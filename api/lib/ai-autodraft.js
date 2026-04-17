'use strict';

// Fire-and-forget AI auto-draft for new submissions.
// Generates WhatsApp draft + summary + analysis on submit so admin opens pre-analyzed entries.

const KB = require('./knowledge-base');

const GROQ_API_KEY = (process.env.GROQ_KEY_B64
  ? Buffer.from(process.env.GROQ_KEY_B64, 'base64').toString('utf8').trim()
  : (process.env.GROQ_API_KEY || process.env.GROQ_TOKEN || ''));
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

async function callGroq(sys, user, opts) {
  const opt = opts || {};
  const body = {
    model: opt.model || GROQ_MODEL,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: user }
    ],
    temperature: typeof opt.temperature === 'number' ? opt.temperature : 0.5,
    max_tokens: opt.max_tokens || 700
  };
  if (opt.jsonMode) body.response_format = { type: 'json_object' };

  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + GROQ_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const errText = await r.text();
    throw new Error('Groq ' + r.status + ': ' + errText.slice(0, 200));
  }
  const data = await r.json();
  return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
}

function formatSub(sub) {
  const lines = [];
  if (sub.name) lines.push('Име: ' + sub.name);
  if (sub.phone) lines.push('Телефон: ' + sub.phone);
  if (sub.email) lines.push('Имейл: ' + sub.email);
  if (sub.service) lines.push('Избрана услуга: ' + sub.service);
  if (sub.package) lines.push('Избран пакет: ' + sub.package);
  if (sub.contact_method) lines.push('Предпочитан контакт: ' + sub.contact_method);
  if (sub.message) lines.push('Съобщение на клиента: ' + sub.message);
  if (sub.files_count) lines.push('Приложени файлове: ' + sub.files_count);
  if (sub.extra_data && typeof sub.extra_data === 'object') {
    for (const k of Object.keys(sub.extra_data)) {
      if (['admin_notes', 'contacted_at', 'ai_draft', 'ai_summary', 'ai_analysis', 'ai_generated_at'].indexOf(k) !== -1) continue;
      const v = sub.extra_data[k];
      if (v === null || v === undefined || v === '') continue;
      lines.push(k + ': ' + (typeof v === 'string' ? v : JSON.stringify(v)));
    }
  }
  return lines.join('\n');
}

async function getHistory(supabase, sub) {
  if (!sub.phone && !sub.email) return [];
  try {
    let q = supabase.from('submissions').select('id, created_at, service, package, status, message').neq('id', sub.id).order('created_at', { ascending: false }).limit(5);
    if (sub.phone && sub.email) {
      q = q.or('phone.eq.' + sub.phone + ',email.eq.' + sub.email);
    } else if (sub.phone) {
      q = q.eq('phone', sub.phone);
    } else {
      q = q.eq('email', sub.email);
    }
    const { data } = await q;
    return data || [];
  } catch (e) {
    return [];
  }
}

function formatHist(history) {
  if (!history || history.length === 0) return '';
  const lines = ['\n=== ИСТОРИЯ НА КЛИЕНТА (' + history.length + ' предишни заявки) ==='];
  history.forEach(function(h, i) {
    const date = h.created_at ? new Date(h.created_at).toLocaleDateString('bg-BG') : '?';
    lines.push((i + 1) + '. [' + date + '] ' + (h.service || '?') + ' / ' + (h.package || '?') + ' — ' + (h.status || '?'));
    if (h.message) lines.push('   "' + String(h.message).slice(0, 120) + '"');
  });
  return lines.join('\n');
}

async function autoDraft(supabase, submissionId) {
  if (!GROQ_API_KEY) return;
  try {
    const { data: sub, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();
    if (error || !sub) return;

    const history = await getHistory(supabase, sub);
    const ctx = formatSub(sub) + formatHist(history);

    const sysDraft = [
      'Ти си личен асистент в bgpomosht.eu. Пишеш WhatsApp съобщение на БЪЛГАРСКИ (кирилица).',
      'Стил: топло, професионално, като говориш с познат. Без корпоративен жаргон. Без шаблонни фрази.',
      'Структура: поздрав с име → 1 изречение че си разбрал заявката → конкретна стъпка или въпрос → покана за кратък разговор.',
      'Дължина: 50-80 думи. Максимум 3 параграфа. Може 1-2 емоджита.',
      'ВАЖНО: ако клиентът е писал преди, НЕ започвай сякаш е първи контакт — реферирай предишната заявка.',
      'Върни САМО съобщението, без встъпление.',
      '',
      KB.formatKnowledgeForPrompt()
    ].join('\n');

    const sysSum = 'Обобщаваш заявка за admin панел на БЪЛГАРСКИ. МАКСИМУМ 2 изречения. Включи: име + град (ако има), услуга/пакет, ключов детайл, спешност. Без встъпителни фрази като "Клиентът...". Пиши директно фактите.';

    const sysAnalyze = [
      'Ти си AI анализатор на клиентски заявки за bgpomosht.eu. Връщаш СТРОГО валиден JSON без markdown.',
      'Структура:',
      '{',
      '  "priority": "high" | "medium" | "low",',
      '  "priority_reason": "кратко обяснение защо",',
      '  "suggested_package": "Базов" | "Стандарт" | "Пълен" | "VIP",',
      '  "suggested_service": "точно име на услуга от каталога",',
      '  "suggested_price": число в евро,',
      '  "tags": [масив от къси етикети на български],',
      '  "red_flags": [масив от неща за които да внимаваш — може да е празен],',
      '  "language_detected": "bg" | "de" | "en" | "mixed",',
      '  "next_action": "едно изречение какво да направиш следващо",',
      '  "confidence": число 0-1',
      '}',
      'Priority правила:',
      '- high: спешно, VIP клиент, проблем с институция с deadline',
      '- medium: нормална заявка, стандартен процес',
      '- low: информационна заявка без времеви натиск',
      '',
      KB.formatKnowledgeForPrompt()
    ].join('\n');

    const results = await Promise.allSettled([
      callGroq(sysDraft, 'Напиши WhatsApp съобщение до този клиент:\n\n' + ctx, { temperature: 0.75 }),
      callGroq(sysSum, 'Обобщи тази заявка:\n\n' + ctx, { temperature: 0.3, max_tokens: 200 }),
      callGroq(sysAnalyze, 'Анализирай тази заявка и върни JSON:\n\n' + ctx, { temperature: 0.2, jsonMode: true, max_tokens: 700 })
    ]);

    const draftText = results[0].status === 'fulfilled' ? results[0].value : null;
    const summaryText = results[1].status === 'fulfilled' ? results[1].value : null;
    const analyzeRaw = results[2].status === 'fulfilled' ? results[2].value : null;

    let analysisObj = null;
    if (analyzeRaw) {
      try {
        analysisObj = JSON.parse(analyzeRaw);
      } catch (e) {
        const m = analyzeRaw.match(/\{[\s\S]*\}/);
        if (m) { try { analysisObj = JSON.parse(m[0]); } catch (e2) { /* ignore */ } }
      }
    }

    const extra = sub.extra_data || {};
    if (draftText) extra.ai_draft = draftText.trim();
    if (summaryText) extra.ai_summary = summaryText.trim();
    if (analysisObj) extra.ai_analysis = analysisObj;
    extra.ai_generated_at = new Date().toISOString();

    await supabase.from('submissions').update({ extra_data: extra }).eq('id', submissionId);
  } catch (e) {
    console.error('autoDraft error:', e.message);
  }
}

module.exports = { autoDraft };
