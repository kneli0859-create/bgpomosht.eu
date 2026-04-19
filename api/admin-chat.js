'use strict';

// AI Chat agent for admin — Groq function calling with real Supabase tools.
// Client sends full conversation history, server iterates tool loop, returns updated messages.

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const KB = require('./_lib/knowledge-base');
const { callGoogleAPI } = require('./_lib/google-auth');
const { buildRawMessage, summarizeMessage, extractBodies, getHeader } = require('./_lib/gmail-helpers');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'bgp_admin_secret_2026';
const GROQ_API_KEY = (process.env.GROQ_KEY_B64
  ? Buffer.from(process.env.GROQ_KEY_B64, 'base64').toString('utf8').trim()
  : (process.env.GROQ_API_KEY || process.env.GROQ_TOKEN || ''));
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const MAX_TOOL_ROUNDS = 10;

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
  },
  // ───────── GMAIL TOOLS ─────────
  {
    type: 'function',
    function: {
      name: 'gmail_list',
      description: 'Листва/търси писма в Gmail. Примери на q: "is:unread", "from:john@x.com", "subject:оферта", "after:2026/04/15", "has:attachment", "label:INBOX newer_than:7d". Връща compact summary (без тяло).',
      parameters: {
        type: 'object',
        properties: {
          q: { type: 'string', description: 'Gmail search query (както в UI-а). Остави празно за inbox.' },
          maxResults: { type: 'number', description: 'Max писма, default 15, max 100' },
          labelIds: { type: 'string', description: 'Comma-separated labels (INBOX, UNREAD, STARRED, SENT, TRASH, SPAM)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'gmail_read',
      description: 'Чете пълното съдържание на едно писмо — headers + plain + html body.',
      parameters: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Gmail message ID' } },
        required: ['id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'gmail_send',
      description: 'Изпраща ново писмо от свързания Gmail акаунт.',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Email получател' },
          subject: { type: 'string' },
          message: { type: 'string', description: 'Plain text тяло' },
          html: { type: 'string', description: 'Optional HTML тяло' }
        },
        required: ['to', 'subject', 'message']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'gmail_reply',
      description: 'Отговор в същия thread на дадено писмо.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Gmail message ID на оригиналното писмо' },
          message: { type: 'string' },
          html: { type: 'string' },
          replyAll: { type: 'boolean', description: 'Включи To+Cc адресите' }
        },
        required: ['id', 'message']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'gmail_modify',
      description: 'Маркира писмо (read/unread/archive/star/important/spam). Използвай за "маркирай като прочетено", "архивирай", "звезда на това", etc.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Message ID' },
          action: {
            type: 'string',
            enum: ['read', 'unread', 'archive', 'inbox', 'star', 'unstar', 'important', 'unimportant', 'spam', 'unspam'],
            description: 'Готова операция'
          }
        },
        required: ['id', 'action']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'gmail_trash',
      description: 'Move писмо в Кошчето (или restore с restore=true).',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          restore: { type: 'boolean', description: 'True за възстановяване от trash' }
        },
        required: ['id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'gmail_delete_permanent',
      description: 'ПЕРМАНЕНТНО изтрива писмо. НЕ може да се върне. Използвай само ако user изрично поиска "изтрий завинаги".',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          confirm: { type: 'string', description: 'Винаги подай "PERMANENT" когато user изрично е потвърдил' }
        },
        required: ['id', 'confirm']
      }
    }
  },
  // ───────── CALENDAR TOOLS ─────────
  {
    type: 'function',
    function: {
      name: 'calendar_list',
      description: 'Листва events от календара в даден диапазон. Default: следващите 14 дни.',
      parameters: {
        type: 'object',
        properties: {
          timeMin: { type: 'string', description: 'ISO-8601 (default: сега)' },
          timeMax: { type: 'string', description: 'ISO-8601 (default: +14 дни)' },
          q: { type: 'string', description: 'Текстово търсене' },
          maxResults: { type: 'number', description: 'default 25' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calendar_create',
      description: 'Създава ново event в календара.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          date: { type: 'string', description: 'YYYY-MM-DD' },
          time: { type: 'string', description: 'HH:MM, default 09:00' },
          durationMinutes: { type: 'number', description: 'default 60' },
          description: { type: 'string' },
          location: { type: 'string' },
          attendees: { type: 'array', items: { type: 'string' }, description: 'Email адреси' }
        },
        required: ['title', 'date']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calendar_update',
      description: 'Обновява event (title, date, time, description, attendees, durationMinutes). Само подадените полета се променят.',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string' },
          title: { type: 'string' },
          date: { type: 'string', description: 'YYYY-MM-DD' },
          time: { type: 'string', description: 'HH:MM' },
          durationMinutes: { type: 'number' },
          description: { type: 'string' },
          location: { type: 'string' },
          attendees: { type: 'array', items: { type: 'string' } }
        },
        required: ['eventId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calendar_delete',
      description: 'Изтрива event от календара (с confirm="DELETE").',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string' },
          confirm: { type: 'string', description: 'Винаги подай "DELETE" когато user е потвърдил' }
        },
        required: ['eventId', 'confirm']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calendar_freebusy',
      description: 'Връща заети интервали в даден период. Използвай за "кога съм свободен" / "намери час".',
      parameters: {
        type: 'object',
        properties: {
          timeMin: { type: 'string', description: 'ISO-8601' },
          timeMax: { type: 'string', description: 'ISO-8601' }
        },
        required: ['timeMin', 'timeMax']
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

// ───────── GMAIL TOOL IMPLEMENTATIONS ─────────

async function toolGmailList(_, args) {
  const maxResults = Math.min(args.maxResults || 15, 100);
  const params = new URLSearchParams();
  if (args.q) params.set('q', args.q);
  params.set('maxResults', String(maxResults));
  if (args.labelIds) {
    String(args.labelIds).split(',').forEach(l => {
      if (l.trim()) params.append('labelIds', l.trim().toUpperCase());
    });
  }
  const listRes = await callGoogleAPI(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?' + params.toString(),
    { method: 'GET' }
  );
  const ids = (listRes.data.messages || []).map(m => m.id);
  if (ids.length === 0) return { count: 0, messages: [] };

  const metaFields = 'id,threadId,snippet,internalDate,labelIds,payload/headers';
  const details = await Promise.all(ids.map(async id => {
    try {
      const r = await callGoogleAPI(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/' + id +
          '?format=metadata&fields=' + encodeURIComponent(metaFields) +
          '&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date',
        { method: 'GET' }
      );
      return summarizeMessage(r.data);
    } catch (_) { return null; }
  }));
  return {
    count: details.filter(Boolean).length,
    resultSizeEstimate: listRes.data.resultSizeEstimate || 0,
    messages: details.filter(Boolean)
  };
}

async function toolGmailRead(_, args) {
  const r = await callGoogleAPI(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/' + encodeURIComponent(args.id) + '?format=full',
    { method: 'GET' }
  );
  const summary = summarizeMessage(r.data);
  const bodies = extractBodies(r.data.payload);
  // Trim very large bodies for LLM context
  const plain = (bodies.plain || '').slice(0, 6000);
  return Object.assign({}, summary, {
    bodyPlain: plain,
    bodyHtmlLength: (bodies.html || '').length,
    attachmentsCount: bodies.attachments.length,
    attachments: bodies.attachments.map(a => ({ filename: a.filename, size: a.size, mimeType: a.mimeType }))
  });
}

async function toolGmailSend(_, args) {
  if (!args.to || !args.subject || (!args.message && !args.html)) {
    return { error: 'to, subject, message required' };
  }
  const { access_token, email: fromEmail } = await require('./_lib/google-auth').getValidAccessToken();
  const raw = buildRawMessage({
    from: fromEmail, to: args.to, subject: args.subject,
    message: args.message || '', html: args.html || null
  });
  const r = await callGoogleAPI(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    { method: 'POST', body: JSON.stringify({ raw }) }
  );
  return { ok: true, id: r.data.id, threadId: r.data.threadId, from: r.email };
}

async function toolGmailReply(_, args) {
  if (!args.id || (!args.message && !args.html)) return { error: 'id and message required' };
  const metaFields = 'id,threadId,payload/headers';
  const orig = await callGoogleAPI(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/' + encodeURIComponent(args.id) +
      '?format=metadata&fields=' + encodeURIComponent(metaFields) +
      '&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Message-ID&metadataHeaders=References',
    { method: 'GET' }
  );
  const headers = (orig.data.payload && orig.data.payload.headers) || [];
  const origFrom = getHeader(headers, 'From');
  const origMsgId = getHeader(headers, 'Message-ID') || getHeader(headers, 'Message-Id');
  const origRefs = getHeader(headers, 'References');
  let subj = getHeader(headers, 'Subject') || '';
  if (!/^re:\s/i.test(subj)) subj = 'Re: ' + subj;

  const references = ((origRefs ? origRefs + ' ' : '') + (origMsgId || '')).trim();
  const raw = buildRawMessage({
    from: orig.email, to: origFrom, subject: subj,
    message: args.message || '', html: args.html || null,
    inReplyTo: origMsgId || undefined,
    references: references || undefined
  });
  const send = await callGoogleAPI(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    { method: 'POST', body: JSON.stringify({ raw, threadId: orig.data.threadId }) }
  );
  return { ok: true, id: send.data.id, threadId: send.data.threadId, to: origFrom };
}

const GMAIL_ACTIONS = {
  read: { remove: ['UNREAD'] }, unread: { add: ['UNREAD'] },
  archive: { remove: ['INBOX'] }, inbox: { add: ['INBOX'] },
  star: { add: ['STARRED'] }, unstar: { remove: ['STARRED'] },
  important: { add: ['IMPORTANT'] }, unimportant: { remove: ['IMPORTANT'] },
  spam: { add: ['SPAM'], remove: ['INBOX'] }, unspam: { remove: ['SPAM'] }
};

async function toolGmailModify(_, args) {
  const preset = GMAIL_ACTIONS[String(args.action).toLowerCase()];
  if (!preset) return { error: 'Unknown action: ' + args.action };
  const r = await callGoogleAPI(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/' + encodeURIComponent(args.id) + '/modify',
    {
      method: 'POST',
      body: JSON.stringify({ addLabelIds: preset.add || [], removeLabelIds: preset.remove || [] })
    }
  );
  return { ok: true, id: r.data.id, action: args.action, labelIds: r.data.labelIds || [] };
}

async function toolGmailTrash(_, args) {
  const path = args.restore ? 'untrash' : 'trash';
  const r = await callGoogleAPI(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/' + encodeURIComponent(args.id) + '/' + path,
    { method: 'POST' }
  );
  return { ok: true, id: r.data.id, action: path };
}

async function toolGmailDeletePermanent(_, args) {
  if (args.confirm !== 'PERMANENT') return { error: 'confirm: "PERMANENT" required' };
  await callGoogleAPI(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/' + encodeURIComponent(args.id),
    { method: 'DELETE' }
  );
  return { ok: true, id: args.id, deleted: true };
}

// ───────── CALENDAR TOOL IMPLEMENTATIONS ─────────

function dateToISO(date, time) {
  if (!date) return null;
  const t = time && /^\d{2}:\d{2}$/.test(time) ? time : '09:00';
  return date + 'T' + t + ':00';
}

async function toolCalendarList(_, args) {
  const timeMin = args.timeMin || new Date().toISOString();
  const timeMax = args.timeMax || new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
  const maxResults = Math.min(args.maxResults || 25, 250);
  const params = new URLSearchParams({
    singleEvents: 'true', orderBy: 'startTime',
    timeMin, timeMax, maxResults: String(maxResults)
  });
  if (args.q) params.set('q', args.q);
  const r = await callGoogleAPI(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?' + params.toString(),
    { method: 'GET' }
  );
  const events = (r.data.items || []).map(ev => ({
    id: ev.id, status: ev.status, summary: ev.summary || '',
    description: (ev.description || '').slice(0, 400),
    location: ev.location || '',
    start: ev.start, end: ev.end,
    attendees: (ev.attendees || []).map(a => ({ email: a.email, responseStatus: a.responseStatus })),
    htmlLink: ev.htmlLink
  }));
  return { count: events.length, timeZone: r.data.timeZone, events };
}

async function toolCalendarCreate(_, args) {
  if (!args.title || !args.date) return { error: 'title and date required' };
  const tz = 'Europe/Berlin';
  const startISO = dateToISO(args.date, args.time);
  const dur = parseInt(args.durationMinutes, 10) || 60;
  const endMs = new Date(startISO).getTime() + dur * 60000;
  const end = new Date(endMs);
  const pad = n => String(n).padStart(2, '0');
  const endISO = end.getFullYear() + '-' + pad(end.getMonth()+1) + '-' + pad(end.getDate()) +
    'T' + pad(end.getHours()) + ':' + pad(end.getMinutes()) + ':00';

  const body = {
    summary: args.title,
    description: args.description || '',
    location: args.location || '',
    start: { dateTime: startISO, timeZone: tz },
    end:   { dateTime: endISO,   timeZone: tz }
  };
  if (Array.isArray(args.attendees) && args.attendees.length) {
    body.attendees = args.attendees.map(e => ({ email: e }));
  }
  const r = await callGoogleAPI(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    { method: 'POST', body: JSON.stringify(body) }
  );
  return { ok: true, id: r.data.id, htmlLink: r.data.htmlLink, summary: r.data.summary, start: r.data.start, end: r.data.end };
}

async function toolCalendarUpdate(_, args) {
  if (!args.eventId) return { error: 'eventId required' };
  const tz = 'Europe/Berlin';
  const patch = {};
  if (args.title) patch.summary = args.title;
  if (args.description !== undefined) patch.description = args.description;
  if (args.location !== undefined) patch.location = args.location;
  if (Array.isArray(args.attendees)) patch.attendees = args.attendees.map(e => ({ email: e }));

  if (args.date || args.time) {
    patch.start = { dateTime: dateToISO(args.date, args.time), timeZone: tz };
    const dur = parseInt(args.durationMinutes, 10) || 60;
    const endMs = new Date(patch.start.dateTime).getTime() + dur * 60000;
    const end = new Date(endMs);
    const pad = n => String(n).padStart(2, '0');
    const endISO = end.getFullYear() + '-' + pad(end.getMonth()+1) + '-' + pad(end.getDate()) +
      'T' + pad(end.getHours()) + ':' + pad(end.getMinutes()) + ':00';
    patch.end = { dateTime: endISO, timeZone: tz };
  }

  if (Object.keys(patch).length === 0) return { error: 'No fields to update' };

  const r = await callGoogleAPI(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events/' + encodeURIComponent(args.eventId),
    { method: 'PATCH', body: JSON.stringify(patch) }
  );
  return { ok: true, id: r.data.id, summary: r.data.summary, start: r.data.start, end: r.data.end, htmlLink: r.data.htmlLink };
}

async function toolCalendarDelete(_, args) {
  if (!args.eventId) return { error: 'eventId required' };
  if (args.confirm !== 'DELETE') return { error: 'confirm: "DELETE" required' };
  await callGoogleAPI(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events/' + encodeURIComponent(args.eventId),
    { method: 'DELETE' }
  );
  return { ok: true, eventId: args.eventId, deleted: true };
}

async function toolCalendarFreeBusy(_, args) {
  if (!args.timeMin || !args.timeMax) return { error: 'timeMin and timeMax required' };
  const r = await callGoogleAPI(
    'https://www.googleapis.com/calendar/v3/freeBusy',
    {
      method: 'POST',
      body: JSON.stringify({
        timeMin: args.timeMin,
        timeMax: args.timeMax,
        timeZone: 'Europe/Berlin',
        items: [{ id: 'primary' }]
      })
    }
  );
  const cal = (r.data.calendars && r.data.calendars.primary) || {};
  return { busy: cal.busy || [], errors: cal.errors || [] };
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
  find_overdue: toolFindOverdue,
  // Gmail
  gmail_list: toolGmailList,
  gmail_read: toolGmailRead,
  gmail_send: toolGmailSend,
  gmail_reply: toolGmailReply,
  gmail_modify: toolGmailModify,
  gmail_trash: toolGmailTrash,
  gmail_delete_permanent: toolGmailDeletePermanent,
  // Calendar
  calendar_list: toolCalendarList,
  calendar_create: toolCalendarCreate,
  calendar_update: toolCalendarUpdate,
  calendar_delete: toolCalendarDelete,
  calendar_freebusy: toolCalendarFreeBusy
};

// ---------- CHAT LOOP ----------

const SYSTEM_PROMPT = [
  'Ти си AI агент-асистент за admin панела на bgpomosht.eu — услуги за българи в Европа.',
  'Говориш БЪЛГАРСКИ, неформално но професионално. Кратко и по същество.',
  'Днешна дата: ' + new Date().toISOString().slice(0, 10) + ' (Europe/Berlin).',
  '',
  'ТИ МОЖЕШ ДА ДЕЙСТВАШ НА 3 НИВА — използвай функциите когато user поиска. Не го карай да прави нещата сам.',
  '',
  '▸ ЗАЯВКИ (Supabase):',
  '- "Покажи новите" → list_submissions(status=new)',
  '- "Намери дубликати" → find_duplicates()',
  '- "Кои висят над час" → find_overdue(minutes=60)',
  '- "Напиши съобщение на #5" → draft_whatsapp(id=5)',
  '- "Маркирай #5 като контактиран" → mark_contacted(id=5)',
  '- "Анализирай #5" → analyze_submission(id=5)',
  '- "Статистики" → get_stats()',
  '',
  '▸ GMAIL:',
  '- "Покажи новите писма" → gmail_list(q="is:unread", maxResults=15)',
  '- "Търси писма от Иван" → gmail_list(q="from:ivan")',
  '- "Прочети писмото" → gmail_read(id=...)',
  '- "Отговори на това" → gmail_reply(id=..., message=...)',
  '- "Изпрати писмо до X" → gmail_send(to=..., subject=..., message=...)',
  '- "Маркирай като прочетено" → gmail_modify(id=..., action="read")',
  '- "Архивирай" → gmail_modify(id=..., action="archive")',
  '- "Изтрий" → gmail_trash(id=...). Permanent delete САМО с изрично потвърждение от user.',
  '',
  '▸ КАЛЕНДАР:',
  '- "Какво имам тази седмица" → calendar_list(timeMin=сега, timeMax=+7d)',
  '- "Намери свободен час във вторник" → calendar_freebusy(timeMin, timeMax)',
  '- "Създай среща за утре 10ч с Иван" → calendar_create(title, date, time, attendees=[...])',
  '- "Премести срещата за четвъртък" → calendar_update(eventId, date, time)',
  '- "Изтрий срещата" → calendar_delete(eventId, confirm="DELETE")',
  '',
  'ВАЖНО:',
  '- Винаги използвай реални ID — никога не измисляй.',
  '- Ако user не каже ID, първо listни и попитай кой.',
  '- При destructive операции (trash, delete, permanent) — при първо споменаване потвърди с user ("Да изтрия ли #X? Кажи да.") ОСВЕН АКО user вече е потвърдил в същото съобщение.',
  '- За permanent delete/calendar_delete ВИНАГИ подавай confirm параметър.',
  '- След действие потвърждавай с 1 изречение ("Готово — маркирах #5 като прочетено").',
  '- Draft съобщения форматирай в code block с ```.',
  '- При много резултати показвай само важното (име, тема, дата). НЕ дъмпвай JSON.',
  '- ISO дати: използвай YYYY-MM-DDTHH:MM:SSZ или +01:00 offset.',
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

  // Require admin token — AI agent има достъп до Gmail/Calendar tools, не бива open access
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ ok: false, message: 'Unauthorized — моля логни се отново в admin' });
  }

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
