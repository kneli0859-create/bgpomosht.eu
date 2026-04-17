'use strict';

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const KB = require('./lib/knowledge-base');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'bgp_admin_secret_2026';
const GROQ_API_KEY = (process.env.GROQ_KEY_B64
  ? Buffer.from(process.env.GROQ_KEY_B64, 'base64').toString('utf8').trim()
  : (process.env.GROQ_API_KEY || process.env.GROQ_TOKEN || ''));
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

function verifyToken(token) {
  try {
    if (!token) return false;
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;
    const email = parts[0];
    const expiry = parseInt(parts[1]);
    const hmac = parts[2];
    if (Date.now() > expiry) return false;
    const payload = email + ':' + expiry;
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
    const a = Buffer.from(hmac);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (e) {
    return false;
  }
}

async function callGroq(systemPrompt, userPrompt, options) {
  const opt = options || {};
  const body = {
    model: opt.model || GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: typeof opt.temperature === 'number' ? opt.temperature : 0.7,
    max_tokens: opt.max_tokens || 900
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
    throw new Error('Groq ' + r.status + ': ' + errText.slice(0, 400));
  }
  const data = await r.json();
  return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
}

function formatSubmission(sub) {
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
  if (sub.created_at) lines.push('Подадена: ' + new Date(sub.created_at).toLocaleString('bg-BG'));
  return lines.join('\n');
}

function formatClientHistory(history) {
  if (!history || history.length === 0) return '';
  const lines = ['\n=== ИСТОРИЯ НА КЛИЕНТА (' + history.length + ' предишни заявки) ==='];
  history.forEach(function(h, i) {
    const date = h.created_at ? new Date(h.created_at).toLocaleDateString('bg-BG') : '?';
    lines.push((i + 1) + '. [' + date + '] ' + (h.service || '?') + ' / ' + (h.package || '?') + ' — статус: ' + (h.status || '?'));
    if (h.message) lines.push('   "' + String(h.message).slice(0, 120) + '"');
  });
  return lines.join('\n');
}

async function getClientHistory(supabase, sub) {
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

// ---------- ACTIONS ----------

async function actionDraftWhatsapp(ctx) {
  const sys = [
    'Ти си личен асистент в bgpomosht.eu. Пишеш WhatsApp съобщение на БЪЛГАРСКИ (кирилица).',
    'Стил: топло, професионално, като говориш с познат. Без корпоративен жаргон. Без шаблонни фрази.',
    'Структура: поздрав с име → 1 изречение че си разбрал заявката → конкретна стъпка или въпрос → покана за кратък разговор.',
    'Дължина: 50-80 думи. Максимум 3 параграфа. Може 1-2 емоджита.',
    'ВАЖНО: ако клиентът е писал преди, НЕ започвай сякаш е първи контакт — реферирай предишната заявка.',
    'Върни САМО съобщението, без встъпление като "Ето съобщението:".',
    '',
    KB.formatKnowledgeForPrompt()
  ].join('\n');
  const user = 'Напиши WhatsApp съобщение до този клиент:\n\n' + ctx.submission + ctx.history;
  const text = await callGroq(sys, user, { temperature: 0.75 });
  return { text: text.trim() };
}

async function actionSummarize(ctx) {
  const sys = 'Обобщаваш заявка за admin панел на БЪЛГАРСКИ. МАКСИМУМ 2 изречения. Включи: име + град (ако има), услуга/пакет, ключов детайл, спешност. Без встъпителни фрази като "Клиентът...". Пиши директно фактите.';
  const user = 'Обобщи тази заявка:\n\n' + ctx.submission + ctx.history;
  const text = await callGroq(sys, user, { temperature: 0.3, max_tokens: 200 });
  return { text: text.trim() };
}

async function actionSuggestPackage(ctx) {
  const sys = [
    'Препоръчваш пакет на БЪЛГАРСКИ на база реалните цени и услуги на bgpomosht.eu.',
    'Формат на отговора (точно така):',
    'Пакет: [име от каталога]',
    'Цена: [цифра] €',
    'Защо: [едно изречение обосновка]',
    'Допълнителни въпроси: [1-2 въпроса ако са нужни]',
    '',
    KB.formatKnowledgeForPrompt()
  ].join('\n');
  const user = 'Препоръчай пакет за тази заявка:\n\n' + ctx.submission + ctx.history;
  const text = await callGroq(sys, user, { temperature: 0.4 });
  return { text: text.trim() };
}

async function actionAnalyze(ctx) {
  const sys = [
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
    '- low: информационна заявка без belowtime pressure',
    '',
    KB.formatKnowledgeForPrompt()
  ].join('\n');
  const user = 'Анализирай тази заявка и върни JSON:\n\n' + ctx.submission + ctx.history;
  const raw = await callGroq(sys, user, { temperature: 0.2, jsonMode: true, max_tokens: 700 });
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    // try to extract JSON from text
    const m = raw.match(/\{[\s\S]*\}/);
    parsed = m ? JSON.parse(m[0]) : { error: 'Invalid JSON', raw: raw };
  }
  return { text: JSON.stringify(parsed, null, 2), data: parsed };
}

const ACTIONS = {
  draft_whatsapp: actionDraftWhatsapp,
  summarize: actionSummarize,
  suggest_package: actionSuggestPackage,
  analyze: actionAnalyze
};

// ---------- HANDLER ----------

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://bgpomosht.eu');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!verifyToken(token)) return res.status(401).json({ ok: false, message: 'Unauthorized' });

  if (!GROQ_API_KEY) return res.status(500).json({ ok: false, message: 'AI not configured' });
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(500).json({ ok: false, message: 'Database not configured' });

  try {
    const { id, action, persist } = req.body || {};
    if (!id || !action) return res.status(400).json({ ok: false, message: 'id and action required' });
    const handler = ACTIONS[action];
    if (!handler) return res.status(400).json({ ok: false, message: 'Unknown action' });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: sub, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !sub) return res.status(404).json({ ok: false, message: 'Submission not found' });

    const history = await getClientHistory(supabase, sub);
    const ctx = {
      submission: formatSubmission(sub),
      history: formatClientHistory(history),
      historyRaw: history
    };

    const result = await handler(ctx);

    // Persist to extra_data if requested
    if (persist) {
      try {
        const extra = sub.extra_data || {};
        if (action === 'draft_whatsapp') extra.ai_draft = result.text;
        if (action === 'summarize') extra.ai_summary = result.text;
        if (action === 'analyze') extra.ai_analysis = result.data;
        extra.ai_generated_at = new Date().toISOString();
        await supabase.from('submissions').update({ extra_data: extra }).eq('id', id);
      } catch (e) { /* non-fatal */ }
    }

    return res.status(200).json({
      ok: true,
      text: result.text,
      data: result.data || null,
      history: history.map(function(h) {
        return { id: h.id, created_at: h.created_at, service: h.service, package: h.package, status: h.status };
      })
    });
  } catch (e) {
    console.error('admin-ai error:', e.message);
    return res.status(500).json({ ok: false, message: e.message || 'Server error' });
  }
};
