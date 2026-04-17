const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'bgp_admin_secret_2026';
const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROQ_TOKEN || '';
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

async function callGroq(systemPrompt, userPrompt, temperature) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + GROQ_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      max_tokens: 600
    })
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
  if (sub.service) lines.push('Услуга: ' + sub.service);
  if (sub.package) lines.push('Пакет: ' + sub.package);
  if (sub.contact_method) lines.push('Предпочитан контакт: ' + sub.contact_method);
  if (sub.message) lines.push('Съобщение на клиента: ' + sub.message);
  if (sub.files_count) lines.push('Приложени файлове: ' + sub.files_count);
  if (sub.extra_data && typeof sub.extra_data === 'object') {
    for (const k of Object.keys(sub.extra_data)) {
      if (k === 'admin_notes' || k === 'contacted_at') continue;
      const v = sub.extra_data[k];
      if (v === null || v === undefined || v === '') continue;
      lines.push(k + ': ' + (typeof v === 'string' ? v : JSON.stringify(v)));
    }
  }
  if (sub.created_at) lines.push('Подадена: ' + new Date(sub.created_at).toLocaleString('bg-BG'));
  return lines.join('\n');
}

const PROMPTS = {
  draft_whatsapp: {
    system: 'Ти си личен асистент в bgpomosht.eu — услуги за българи в Европа (Германия, Австрия, Швейцария, Франция, Италия, Испания). Пишеш WhatsApp съобщение на БЪЛГАРСКИ ЕЗИК (кирилица). Стил: топло, професионално, без корпоративен жаргон, като говориш с познат. Структура: поздрав с името → 1 изречение че си разбрал заявката → конкретна следваща стъпка или въпрос → покана за кратък разговор. Дължина: 50-80 думи, максимум 3 параграфа. Може 1-2 емоджита. НЕ пиши шаблонни фрази като "надявам се да сте добре". НЕ започвай с "Здравейте" ако клиентът е посочил предпочитан контакт WhatsApp — използвай "Здрасти" или директно името. Върни САМО съобщението, без въведение.',
    user: function(ctx) { return 'Напиши WhatsApp съобщение до този клиент:\n\n' + ctx; },
    temperature: 0.75
  },
  summarize: {
    system: 'Обобщаваш заявка за admin панел на БЪЛГАРСКИ. МАКСИМУМ 2 изречения. Включи: име + град (ако има), услуга/пакет, ключов детайл от съобщението, спешност (ако се подразбира). Без "Клиентът Иван..." — пиши директно фактите. Без встъпителни фрази.',
    user: function(ctx) { return 'Обобщи тази заявка:\n\n' + ctx; },
    temperature: 0.3
  },
  suggest_package: {
    system: 'Препоръчваш пакет за bgpomosht.eu на БЪЛГАРСКИ. Пакетите са: Базов (най-евтин, бърза помощ с един документ или съвет), Стандарт (препоръчан — комбинация от услуги, придружаване), Пълен (всичко от А до Я, включително превод, попълване, комуникация с институция). Върни точно в този формат:\n\nПакет: [име]\nЦена: [цифра] €\nЗащо: [едно изречение обосновка на базата на детайлите]\nДопълнителни въпроси: [1-2 въпроса към клиента, ако са нужни за финална оферта]',
    user: function(ctx) { return 'Препоръчай пакет за тази заявка:\n\n' + ctx; },
    temperature: 0.4
  }
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://bgpomosht.eu');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!verifyToken(token)) return res.status(401).json({ ok: false, message: 'Unauthorized' });

  if (!GROQ_API_KEY) return res.status(500).json({ ok: false, message: 'AI not configured', debug: { hasKey: !!GROQ_API_KEY, keyLen: (GROQ_API_KEY||'').length, allEnvKeys: Object.keys(process.env).sort() } });
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(500).json({ ok: false, message: 'Database not configured' });

  try {
    const { id, action } = req.body || {};
    if (!id || !action) return res.status(400).json({ ok: false, message: 'id and action required' });

    const prompt = PROMPTS[action];
    if (!prompt) return res.status(400).json({ ok: false, message: 'Unknown action' });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: sub, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !sub) return res.status(404).json({ ok: false, message: 'Submission not found' });

    const context = formatSubmission(sub);
    const text = await callGroq(prompt.system, prompt.user(context), prompt.temperature);

    return res.status(200).json({ ok: true, text: text.trim() });
  } catch (e) {
    console.error('admin-ai error:', e.message);
    return res.status(500).json({ ok: false, message: e.message || 'Server error' });
  }
};
