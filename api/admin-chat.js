'use strict';

// AI Chat agent for admin — Groq function calling with real Supabase tools.
// Client sends full conversation history, server iterates tool loop, returns updated messages.

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
const MAX_TOOL_ROUNDS = 6;

function verifyToken(token) {
  try {
    if (!token) return false;
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;
    const expiry = parseInt(parts[1]);
    if (Date.now() > expiry) return false;
    const payload = parts[0] + ':' + expiry;
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
    const a = Buffer.from(parts[2]);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (e) {
    return false;
  }
}

// ---------- TOOL DEFINITIONS (OpenAI schema) ----------

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'list_submissions',
      description: 'Връща списък със заявки. Използвай за преглед/търсене.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['new', 'in_progress', 'done', 'cancelled', 'any'], description: 'Статус филтър. "any" за всички.' },
          search: { type: 'string', description: 'Текст за търсене в име, телефон, email или съобщение' },
          service: { type: 'string', description: 'Филтър по име на услуга' },
          limit: { type: 'number', description: 'Максимум резултати, default 10' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_submission',
      description: 'Взима една заявка с всички детайли (вкл. AI draft, analysis).',
      parameters: {
        type: 'object',
        properties: { id: { type: 'number', description: 'ID на заявката' } },
        required: ['id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_status',
      description: 'Сменя статус на заявка.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          status: { type: 'string', enum: ['new', 'in_progress', 'done', 'cancelled'] }
        },
        required: ['id', 'status']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_note',
      description: 'Добавя/записва бележка към заявка (запазва се в extra_data.admin_notes).',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          note: { type: 'string' }
        },
        required: ['id', 'note']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'mark_contacted',
      description: 'Маркира заявка като "контактиран" (status=in_progress + timestamp).',
      parameters: {
        type: 'object',
        properties: { id: { type: 'number' } },
        required: ['id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'draft_whatsapp',
      description: 'Генерира и записва WhatsApp draft съобщение за заявка. Връща текста + wa.me линк.',
      parameters: {
        type: 'object',
        properties: { id: { type: 'number' } },
        required: ['id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'analyze_submission',
      description: 'Прави AI анализ на заявка — priority, препоръчан пакет, tags, red flags.',
      parameters: {
        type: 'object',
        properties: { id: { type: 'number' } },
        required: ['id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_stats',
      description: 'Връща dashboard stats — общо/нови/в процес/завършени, приходи, топ услуга.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'find_duplicates',
      description: 'Намира повтарящи се клиенти (един phone/email с 2+ заявки).',
      parameters: {
        type: 'object',
        properties: { min_count: { type: 'number', description: 'Минимум заявки, default 2' } }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'find_overdue',
      description: 'Намира заявки със статус "new" или "in_progress" от преди повече от N минути без контакт.',
      parameters: {
        type: 'object',
        properties: { minutes: { type: 'number', description: 'Минути от създаване, default 30' } }
      }
    }
  }
];

// ---------- TOOL IMPLEMENTATIONS ----------

function slimSubmission(s) {
  if (!s) return null;
  const extra = s.extra_data || {};
  return {
    id: s.id,
    created_at: s.created_at,
    name: s.name,
    phone: s.phone,
    email: s.email,
    service: s.service,
    package: s.package,
    contact_method: s.contact_method,
    message: s.message,
    status: s.status,
    files_count: s.files_count,
    admin_notes: extra.admin_notes || null,
    contacted_at: extra.contacted_at || null,
    ai_summary: extra.ai_summary || null,
    ai_draft: extra.ai_draft || null,
    ai_analysis: extra.ai_analysis || null
  };
}

async function callGroq(messages, opts) {
  const opt = opts || {};
  const body = {
    model: opt.model || GROQ_MODEL,
    messages: messages,
    temperature: typeof opt.temperature === 'number' ? opt.temperature : 0.4,
    max_tokens: opt.max_tokens || 1400
  };
  if (opt.tools) {
    body.tools = opt.tools;
    body.tool_choice = opt.tool_choice || 'auto';
  }
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
  return data.choices && data.choices[0] && data.choices[0].message;
}

async function toolListSubmissions(supabase, args) {
  const limit = Math.min(args.limit || 10, 30);
  let q = supabase.from('submissions').select('*').order('created_at', { ascending: false }).limit(limit);
  if (args.status && args.status !== 'any') q = q.eq('status', args.status);
  if (args.service) q = q.ilike('service', '%' + args.service + '%');
  if (args.search) {
    const s = args.search.replace(/[%_]/g, '');
    q = q.or('name.ilike.%' + s + '%,phone.ilike.%' + s + '%,email.ilike.%' + s + '%,message.ilike.%' + s + '%');
  }
  const { data, error } = await q;
  if (error) return { error: error.message };
  return { count: (data || []).length, submissions: (data || []).map(slimSubmission) };
}

async function toolGetSubmission(supabase, args) {
  const { data, error } = await supabase.from('submissions').select('*').eq('id', args.id).single();
  if (error) return { error: error.message };
  return slimSubmission(data);
}

async function toolUpdateStatus(supabase, args) {
  const { error } = await supabase.from('submissions').update({ status: args.status }).eq('id', args.id);
  if (error) return { error: error.message };
  return { ok: true, id: args.id, status: args.status };
}

async function toolAddNote(supabase, args) {
  const { data: sub, error: e1 } = await supabase.from('submissions').select('extra_data').eq('id', args.id).single();
  if (e1) return { error: e1.message };
  const extra = sub.extra_data || {};
  const prev = extra.admin_notes ? extra.admin_notes + '\n---\n' : '';
  extra.admin_notes = prev + '[AI ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + '] ' + args.note;
  const { error: e2 } = await supabase.from('submissions').update({ extra_data: extra }).eq('id', args.id);
  if (e2) return { error: e2.message };
  return { ok: true, id: args.id, note_added: true };
}

async function toolMarkContacted(supabase, args) {
  const { data: sub, error: e1 } = await supabase.from('submissions').select('extra_data').eq('id', args.id).single();
  if (e1) return { error: e1.message };
  const extra = sub.extra_data || {};
  extra.contacted_at = new Date().toISOString();
  const { error: e2 } = await supabase.from('submissions').update({ extra_data: extra, status: 'in_progress' }).eq('id', args.id);
  if (e2) return { error: e2.message };
  return { ok: true, id: args.id, status: 'in_progress' };
}

async function toolDraftWhatsapp(supabase, args) {
  const { data: sub, error } = await supabase.from('submissions').select('*').eq('id', args.id).single();
  if (error || !sub) return { error: 'Submission not found' };

  const ctxLines = [];
  if (sub.name) ctxLines.push('Име: ' + sub.name);
  if (sub.phone) ctxLines.push('Телефон: ' + sub.phone);
  if (sub.service) ctxLines.push('Услуга: ' + sub.service);
  if (sub.package) ctxLines.push('Пакет: ' + sub.package);
  if (sub.message) ctxLines.push('Съобщение: ' + sub.message);

  const sys = [
    'Ти си личен асистент в bgpomosht.eu. Пишеш WhatsApp съобщение на БЪЛГАРСКИ (кирилица).',
    'Стил: топло, професионално. 50-80 думи. Максимум 3 параграфа. Може 1-2 емоджита.',
    'Върни САМО съобщението.',
    '',
    KB.formatKnowledgeForPrompt()
  ].join('\n');

  const resp = await callGroq([
    { role: 'system', content: sys },
    { role: 'user', content: 'Напиши WhatsApp съобщение:\n\n' + ctxLines.join('\n') }
  ], { temperature: 0.75, max_tokens: 600 });
  const text = (resp && resp.content || '').trim();

  // persist to extra_data
  const extra = sub.extra_data || {};
  extra.ai_draft = text;
  extra.ai_generated_at = new Date().toISOString();
  await supabase.from('submissions').update({ extra_data: extra }).eq('id', args.id);

  let waLink = '';
  if (sub.phone) {
    const clean = String(sub.phone).replace(/[^0-9+]/g, '').replace(/^\+/, '');
    waLink = 'https://wa.me/' + clean + '?text=' + encodeURIComponent(text);
  }
  return { ok: true, id: args.id, text: text, wa_link: waLink };
}

async function toolAnalyze(supabase, args) {
  const { data: sub, error } = await supabase.from('submissions').select('*').eq('id', args.id).single();
  if (error || !sub) return { error: 'Submission not found' };

  const ctxLines = [];
  if (sub.name) ctxLines.push('Име: ' + sub.name);
  if (sub.service) ctxLines.push('Услуга: ' + sub.service);
  if (sub.package) ctxLines.push('Пакет: ' + sub.package);
  if (sub.message) ctxLines.push('Съобщение: ' + sub.message);
  if (sub.extra_data && typeof sub.extra_data === 'object') {
    for (const k of Object.keys(sub.extra_data)) {
      if (['admin_notes', 'ai_draft', 'ai_summary', 'ai_analysis', 'ai_generated_at', 'contacted_at'].indexOf(k) !== -1) continue;
      const v = sub.extra_data[k];
      if (v) ctxLines.push(k + ': ' + (typeof v === 'string' ? v : JSON.stringify(v)));
    }
  }

  const sys = [
    'Връщаш СТРОГО валиден JSON без markdown за клиентска заявка на bgpomosht.eu.',
    'Формат: {"priority":"high|medium|low","priority_reason":"","suggested_package":"Базов|Стандарт|Пълен|VIP","suggested_service":"","suggested_price":number,"tags":[],"red_flags":[],"language_detected":"bg|de|en|mixed","next_action":"","confidence":0-1}',
    '',
    KB.formatKnowledgeForPrompt()
  ].join('\n');

  const resp = await callGroq([
    { role: 'system', content: sys },
    { role: 'user', content: 'Анализирай:\n\n' + ctxLines.join('\n') }
  ], { temperature: 0.2, jsonMode: true, max_tokens: 700 });

  let parsed = null;
  try { parsed = JSON.parse(resp.content); }
  catch (e) {
    const m = (resp.content || '').match(/\{[\s\S]*\}/);
    if (m) { try { parsed = JSON.parse(m[0]); } catch (e2) {} }
  }

  const extra = sub.extra_data || {};
  if (parsed) extra.ai_analysis = parsed;
  extra.ai_generated_at = new Date().toISOString();
  await supabase.from('submissions').update({ extra_data: extra }).eq('id', args.id);
  return { ok: true, id: args.id, analysis: parsed };
}

async function toolStats(supabase) {
  const { data, error } = await supabase.from('submissions').select('id, status, service, created_at, extra_data');
  if (error) return { error: error.message };
  const rows = data || [];
  const today = new Date().toISOString().slice(0, 10);
  const stats = {
    total: rows.length,
    new: rows.filter(r => r.status === 'new').length,
    in_progress: rows.filter(r => r.status === 'in_progress').length,
    done: rows.filter(r => r.status === 'done').length,
    cancelled: rows.filter(r => r.status === 'cancelled').length,
    today: rows.filter(r => (r.created_at || '').slice(0, 10) === today).length,
    by_service: {}
  };
  rows.forEach(r => {
    const svc = r.service || 'Без услуга';
    stats.by_service[svc] = (stats.by_service[svc] || 0) + 1;
  });
  const topService = Object.entries(stats.by_service).sort((a, b) => b[1] - a[1])[0];
  stats.top_service = topService ? { name: topService[0], count: topService[1] } : null;
  return stats;
}

async function toolFindDuplicates(supabase, args) {
  const minCount = args.min_count || 2;
  const { data, error } = await supabase.from('submissions').select('id, name, phone, email, service, status, created_at').order('created_at', { ascending: false });
  if (error) return { error: error.message };
  const groups = {};
  (data || []).forEach(r => {
    const key = r.phone || r.email || null;
    if (!key) return;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });
  const duplicates = Object.entries(groups)
    .filter(([k, rows]) => rows.length >= minCount)
    .map(([key, rows]) => ({
      contact: key,
      name: rows[0].name,
      count: rows.length,
      submissions: rows.map(r => ({ id: r.id, service: r.service, status: r.status, created_at: r.created_at }))
    }));
  return { groups: duplicates, total_duplicate_clients: duplicates.length };
}

async function toolFindOverdue(supabase, args) {
  const minutes = args.minutes || 30;
  const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  const { data, error } = await supabase.from('submissions')
    .select('id, name, phone, service, status, created_at, extra_data')
    .in('status', ['new', 'in_progress'])
    .lt('created_at', cutoff)
    .order('created_at', { ascending: true });
  if (error) return { error: error.message };
  const overdue = (data || []).filter(r => {
    const extra = r.extra_data || {};
    return !extra.contacted_at;
  });
  return {
    count: overdue.length,
    cutoff_minutes: minutes,
    submissions: overdue.map(r => ({
      id: r.id, name: r.name, phone: r.phone, service: r.service, status: r.status, created_at: r.created_at,
      minutes_waiting: Math.round((Date.now() - new Date(r.created_at).getTime()) / 60000)
    }))
  };
}

const TOOL_IMPL = {
  list_submissions: toolListSubmissions,
  get_submission: toolGetSubmission,
  update_status: toolUpdateStatus,
  add_note: toolAddNote,
  mark_contacted: toolMarkContacted,
  draft_whatsapp: toolDraftWhatsapp,
  analyze_submission: toolAnalyze,
  get_stats: (s, a) => toolStats(s),
  find_duplicates: toolFindDuplicates,
  find_overdue: toolFindOverdue
};

// ---------- CHAT LOOP ----------

const SYSTEM_PROMPT = [
  'Ти си AI агент-асистент за admin панела на bgpomosht.eu — услуги за българи в Европа.',
  'Говориш БЪЛГАРСКИ, неформално но професионално. Кратко и по същество.',
  '',
  'ТИ МОЖЕШ ДА ДЕЙСТВАШ — използвай функциите когато user поиска. Не го карай да прави нещата сам.',
  'Примери:',
  '- "Покажи новите" → list_submissions(status=new)',
  '- "Намери дубликати" → find_duplicates()',
  '- "Кои заявки висят повече от час" → find_overdue(minutes=60)',
  '- "Напиши съобщение на клиент #5" → draft_whatsapp(id=5) и покажи текста',
  '- "Маркирай #5 като контактиран" → mark_contacted(id=5)',
  '- "Анализирай #5" → analyze_submission(id=5)',
  '- "Добави бележка към #5: обади се обратно" → add_note(id=5, note=...)',
  '- "Колко заявки имам днес" → get_stats()',
  '',
  'ВАЖНО:',
  '- Винаги използвай ID-та от реални заявки — не измисляй.',
  '- Ако user не каже ID, първо list_submissions или попитай.',
  '- След действие потвърждавай с 1 изречение ("Готово — маркирах #5 като контактиран").',
  '- Ако върнеш draft съобщение, форматирай го в code block с тройни backticks.',
  '- При много резултати покажи само важното — име, услуга, статус, ID. Не дъмпвай JSON.',
  '',
  KB.formatKnowledgeForPrompt()
].join('\n');

// Groq rejects tool_calls:null on assistant messages — strip the field when empty.
function sanitizeForGroq(msgs) {
  return msgs.map(function (m) {
    if (m && m.role === 'assistant') {
      var out = { role: 'assistant', content: m.content || '' };
      if (Array.isArray(m.tool_calls) && m.tool_calls.length > 0) out.tool_calls = m.tool_calls;
      return out;
    }
    return m;
  });
}

async function runAgentLoop(supabase, userMessages) {
  const clean = sanitizeForGroq(userMessages);
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }].concat(clean);
  const newMessages = [];
  const toolTrace = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const assistantMsg = await callGroq(messages, { tools: TOOLS, temperature: 0.4 });
    if (!assistantMsg) break;

    // Push assistant message (may have content AND/OR tool_calls)
    messages.push(assistantMsg);
    const persisted = { role: 'assistant', content: assistantMsg.content || '' };
    if (Array.isArray(assistantMsg.tool_calls) && assistantMsg.tool_calls.length > 0) {
      persisted.tool_calls = assistantMsg.tool_calls;
    }
    newMessages.push(persisted);

    const toolCalls = assistantMsg.tool_calls || [];
    if (toolCalls.length === 0) break; // done — final text response

    for (const tc of toolCalls) {
      const name = tc.function && tc.function.name;
      let args = {};
      try { args = JSON.parse(tc.function.arguments || '{}'); } catch (e) { args = {}; }
      const impl = TOOL_IMPL[name];
      let result;
      if (!impl) {
        result = { error: 'Unknown tool: ' + name };
      } else {
        try {
          result = await impl(supabase, args);
        } catch (e) {
          result = { error: e.message || String(e) };
        }
      }
      toolTrace.push({ name, args, result });
      const toolMsg = {
        role: 'tool',
        tool_call_id: tc.id,
        name: name,
        content: JSON.stringify(result).slice(0, 8000)
      };
      messages.push(toolMsg);
      newMessages.push(toolMsg);
    }
  }

  return { newMessages, toolTrace };
}

// ---------- HANDLER ----------

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://bgpomosht.eu');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });

  // Auth removed — AI Chat is open access

  if (!GROQ_API_KEY) return res.status(500).json({ ok: false, message: 'AI not configured' });
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(500).json({ ok: false, message: 'Database not configured' });

  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ ok: false, message: 'messages array required' });
    }
    // Basic sanity: last message should be user
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { newMessages, toolTrace } = await runAgentLoop(supabase, messages);
    return res.status(200).json({ ok: true, messages: newMessages, tool_trace: toolTrace });
  } catch (e) {
    console.error('admin-chat error:', e.message);
    return res.status(500).json({ ok: false, message: e.message || 'Server error' });
  }
};
