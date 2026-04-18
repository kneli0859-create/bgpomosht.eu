'use strict';

// Unified router — consolidates Gmail + Calendar + send-email + create-event
// into one serverless function to stay under Vercel's 12-function limit.
// Logic is copied verbatim from the original per-endpoint files; only the
// CORS/method/auth boilerplate is factored out into the dispatcher below.
//
// Routing:
//   /api/router?action=<name>    (query string, GET or POST)
//
// Actions (14):
//   Gmail:     gmail-list, gmail-get, gmail-modify, gmail-trash,
//              gmail-delete, gmail-reply, gmail-labels
//   Calendar:  calendar-list, calendar-get, calendar-update,
//              calendar-delete, calendar-freebusy
//   Open:      send-email, create-event  (no admin auth — preserved from originals)

const { getValidAccessToken, callGoogleAPI } = require('./lib/google-auth');
const { buildRawMessage, summarizeMessage, extractBodies, getHeader } = require('./lib/gmail-helpers');
const { requireAdmin, verifyToken, setCORS } = require('./lib/admin-auth');

// Actions requiring full admin Bearer auth (AI agent tools).
const PROTECTED = new Set([
  'gmail-list', 'gmail-get', 'gmail-modify', 'gmail-trash', 'gmail-delete',
  'gmail-reply', 'gmail-labels',
  'calendar-list', 'calendar-get', 'calendar-update', 'calendar-delete', 'calendar-freebusy'
]);

// Actions protected by x-api-key header (client tools called from admin.html).
// The key is the admin HMAC token — so only a logged-in admin's browser can call.
const SEMI_PROTECTED = new Set(['send-email', 'create-event']);

// ══════════════════════ GMAIL ══════════════════════

async function gmailList(req, res) {
  const src = req.method === 'GET' ? (req.query || {}) : (req.body || {});
  const q = (src.q || '').toString();
  const labelIds = src.labelIds || src.label || '';
  const maxResults = Math.min(parseInt(src.maxResults, 10) || 20, 100);
  const pageToken = src.pageToken || '';
  const account = src.account || undefined;

  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (maxResults) params.set('maxResults', String(maxResults));
  if (pageToken) params.set('pageToken', pageToken);
  if (labelIds) {
    (Array.isArray(labelIds) ? labelIds : String(labelIds).split(',')).forEach(l => {
      if (l) params.append('labelIds', l.trim().toUpperCase());
    });
  }

  const listRes = await callGoogleAPI(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?' + params.toString(),
    { method: 'GET' },
    account
  );
  const ids = (listRes.data.messages || []).map(m => m.id);
  const resultSizeEstimate = listRes.data.resultSizeEstimate || 0;
  const nextPageToken = listRes.data.nextPageToken || null;

  if (ids.length === 0) {
    return res.status(200).json({
      ok: true, messages: [], resultSizeEstimate, nextPageToken, account: listRes.email
    });
  }

  const metaFields = 'id,threadId,snippet,internalDate,labelIds,payload/headers';
  const details = await Promise.all(ids.map(async (id) => {
    try {
      const r = await callGoogleAPI(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/' + id +
          '?format=metadata&fields=' + encodeURIComponent(metaFields) +
          '&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date',
        { method: 'GET' },
        account
      );
      return summarizeMessage(r.data);
    } catch (_) { return null; }
  }));

  return res.status(200).json({
    ok: true,
    messages: details.filter(Boolean),
    resultSizeEstimate,
    nextPageToken,
    account: listRes.email
  });
}

async function gmailGet(req, res) {
  const src = req.method === 'GET' ? (req.query || {}) : (req.body || {});
  const id = (src.id || '').toString().trim();
  const account = src.account || undefined;
  if (!id) return res.status(400).json({ ok: false, message: 'id required' });

  const r = await callGoogleAPI(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/' + encodeURIComponent(id) + '?format=full',
    { method: 'GET' },
    account
  );
  const msg = r.data;
  const summary = summarizeMessage(msg);
  const bodies = extractBodies(msg.payload);

  return res.status(200).json({
    ok: true,
    message: Object.assign({}, summary, {
      bodyPlain: bodies.plain,
      bodyHtml: bodies.html,
      attachments: bodies.attachments,
      sizeEstimate: msg.sizeEstimate || 0,
      historyId: msg.historyId || null
    }),
    account: r.email
  });
}

const GMAIL_ACTION_MAP = {
  read:        { remove: ['UNREAD'] },
  unread:      { add: ['UNREAD'] },
  archive:     { remove: ['INBOX'] },
  inbox:       { add: ['INBOX'] },
  star:        { add: ['STARRED'] },
  unstar:      { remove: ['STARRED'] },
  important:   { add: ['IMPORTANT'] },
  unimportant: { remove: ['IMPORTANT'] },
  spam:        { add: ['SPAM'], remove: ['INBOX'] },
  unspam:      { remove: ['SPAM'] }
};

async function gmailModify(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });
  const { id, ids, addLabels, removeLabels, action, account } = req.body || {};
  const targetIds = Array.isArray(ids) && ids.length ? ids : (id ? [id] : []);
  if (targetIds.length === 0) return res.status(400).json({ ok: false, message: 'id or ids required' });

  let add = Array.isArray(addLabels) ? addLabels.slice() : [];
  let remove = Array.isArray(removeLabels) ? removeLabels.slice() : [];

  if (action) {
    const preset = GMAIL_ACTION_MAP[String(action).toLowerCase()];
    if (!preset) return res.status(400).json({ ok: false, message: 'Unknown action: ' + action });
    if (preset.add) add = add.concat(preset.add);
    if (preset.remove) remove = remove.concat(preset.remove);
  }

  if (add.length === 0 && remove.length === 0) {
    return res.status(400).json({ ok: false, message: 'action or addLabels/removeLabels required' });
  }

  if (targetIds.length > 1) {
    const r = await callGoogleAPI(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/batchModify',
      { method: 'POST', body: JSON.stringify({ ids: targetIds, addLabelIds: add, removeLabelIds: remove }) },
      account
    );
    return res.status(200).json({ ok: true, modified: targetIds.length, account: r.email });
  }

  const r = await callGoogleAPI(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/' + encodeURIComponent(targetIds[0]) + '/modify',
    { method: 'POST', body: JSON.stringify({ addLabelIds: add, removeLabelIds: remove }) },
    account
  );
  return res.status(200).json({ ok: true, id: r.data.id, labelIds: r.data.labelIds || [], account: r.email });
}

async function gmailTrash(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });
  const { id, restore, account } = req.body || {};
  if (!id) return res.status(400).json({ ok: false, message: 'id required' });

  const path = restore ? 'untrash' : 'trash';
  const r = await callGoogleAPI(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/' + encodeURIComponent(id) + '/' + path,
    { method: 'POST' },
    account
  );
  return res.status(200).json({ ok: true, id: r.data.id, action: path, account: r.email });
}

async function gmailDelete(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }
  const src = req.method === 'DELETE' ? (req.query || {}) : (req.body || {});
  const { id, account, confirm } = src;
  if (!id) return res.status(400).json({ ok: false, message: 'id required' });
  if (confirm !== 'PERMANENT') {
    return res.status(400).json({ ok: false, message: 'confirm: "PERMANENT" required (cannot be undone)' });
  }

  const r = await callGoogleAPI(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/' + encodeURIComponent(id),
    { method: 'DELETE' },
    account
  );
  return res.status(200).json({ ok: true, id, deleted: true, account: r.email });
}

function dedupeEmails(list) {
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    if (!raw) continue;
    const m = /<([^>]+)>/.exec(raw);
    const addr = (m ? m[1] : raw).trim().toLowerCase();
    if (addr && !seen.has(addr)) { seen.add(addr); out.push(raw.trim()); }
  }
  return out;
}

async function gmailReply(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });
  const { id, message, html, replyAll, account } = req.body || {};
  if (!id) return res.status(400).json({ ok: false, message: 'id required' });
  if (!message && !html) return res.status(400).json({ ok: false, message: 'message or html required' });

  const metaFields = 'id,threadId,payload/headers';
  const orig = await callGoogleAPI(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/' + encodeURIComponent(id) +
      '?format=metadata&fields=' + encodeURIComponent(metaFields) +
      '&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Message-ID&metadataHeaders=References',
    { method: 'GET' },
    account
  );

  const headers = (orig.data.payload && orig.data.payload.headers) || [];
  const threadId = orig.data.threadId;
  const origFrom = getHeader(headers, 'From');
  const origTo = getHeader(headers, 'To');
  const origCc = getHeader(headers, 'Cc');
  const origMsgId = getHeader(headers, 'Message-ID') || getHeader(headers, 'Message-Id');
  const origRefs = getHeader(headers, 'References');
  let origSubject = getHeader(headers, 'Subject') || '';
  if (!/^re:\s/i.test(origSubject)) origSubject = 'Re: ' + origSubject;

  let toList = [origFrom];
  if (replyAll) {
    const extra = (origTo ? origTo.split(',') : []).concat(origCc ? origCc.split(',') : []);
    toList = toList.concat(extra);
    toList = dedupeEmails(toList).filter(a => !a.toLowerCase().includes(orig.email.toLowerCase()));
    if (toList.length === 0) toList = [origFrom];
  }

  const references = (origRefs ? origRefs + ' ' : '') + (origMsgId || '');

  const raw = buildRawMessage({
    from: orig.email,
    to: toList.join(', '),
    subject: origSubject,
    message: message || '',
    html: html || null,
    inReplyTo: origMsgId || undefined,
    references: references.trim() || undefined
  });

  const send = await callGoogleAPI(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    { method: 'POST', body: JSON.stringify({ raw, threadId }) },
    account
  );

  return res.status(200).json({
    ok: true,
    id: send.data.id,
    threadId: send.data.threadId,
    to: toList,
    account: send.email
  });
}

async function gmailLabels(req, res) {
  const account = (req.query && req.query.account) || (req.body && req.body.account) || undefined;
  const r = await callGoogleAPI(
    'https://gmail.googleapis.com/gmail/v1/users/me/labels',
    { method: 'GET' },
    account
  );
  const labels = (r.data.labels || []).map(l => ({
    id: l.id, name: l.name, type: l.type,
    messageListVisibility: l.messageListVisibility,
    labelListVisibility: l.labelListVisibility
  }));
  return res.status(200).json({ ok: true, labels, account: r.email });
}

// ══════════════════════ CALENDAR ══════════════════════

function toISO(date, time) {
  if (!date) return null;
  const t = time && /^\d{2}:\d{2}$/.test(time) ? time : '09:00';
  return date + 'T' + t + ':00';
}

async function calendarList(req, res) {
  const src = req.method === 'GET' ? (req.query || {}) : (req.body || {});
  const calendarId = src.calendarId || 'primary';
  const timeMin = src.timeMin || new Date().toISOString();
  const timeMax = src.timeMax || '';
  const q = src.q || '';
  const maxResults = Math.min(parseInt(src.maxResults, 10) || 25, 250);
  const pageToken = src.pageToken || '';
  const account = src.account || undefined;

  const params = new URLSearchParams({
    singleEvents: 'true', orderBy: 'startTime', timeMin, maxResults: String(maxResults)
  });
  if (timeMax) params.set('timeMax', timeMax);
  if (q) params.set('q', q);
  if (pageToken) params.set('pageToken', pageToken);

  const r = await callGoogleAPI(
    'https://www.googleapis.com/calendar/v3/calendars/' +
      encodeURIComponent(calendarId) + '/events?' + params.toString(),
    { method: 'GET' },
    account
  );

  const events = (r.data.items || []).map(ev => ({
    id: ev.id, status: ev.status, summary: ev.summary || '',
    description: ev.description || '', location: ev.location || '',
    start: ev.start || null, end: ev.end || null,
    attendees: (ev.attendees || []).map(a => ({
      email: a.email, responseStatus: a.responseStatus, optional: !!a.optional, organizer: !!a.organizer
    })),
    htmlLink: ev.htmlLink, hangoutLink: ev.hangoutLink || null,
    conferenceData: ev.conferenceData || null,
    created: ev.created, updated: ev.updated, organizer: ev.organizer || null
  }));

  return res.status(200).json({
    ok: true, events,
    nextPageToken: r.data.nextPageToken || null,
    timeZone: r.data.timeZone || null,
    account: r.email
  });
}

async function calendarGet(req, res) {
  const src = req.method === 'GET' ? (req.query || {}) : (req.body || {});
  const { eventId, calendarId = 'primary', account } = src;
  if (!eventId) return res.status(400).json({ ok: false, message: 'eventId required' });

  const r = await callGoogleAPI(
    'https://www.googleapis.com/calendar/v3/calendars/' +
      encodeURIComponent(calendarId) + '/events/' + encodeURIComponent(eventId),
    { method: 'GET' },
    account
  );
  return res.status(200).json({ ok: true, event: r.data, account: r.email });
}

async function calendarUpdate(req, res) {
  if (req.method !== 'POST' && req.method !== 'PATCH') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }
  const body = req.body || {};
  const { eventId, calendarId = 'primary', account, patch = {}, sendUpdates = 'none' } = body;
  if (!eventId) return res.status(400).json({ ok: false, message: 'eventId required' });

  const conv = {};
  if (body.title) conv.summary = body.title;
  if (body.summary) conv.summary = body.summary;
  if (body.description !== undefined) conv.description = body.description;
  if (body.location !== undefined) conv.location = body.location;

  const tz = body.timeZone || patch.timeZone || 'Europe/Berlin';
  if (body.date || body.time) {
    const startISO = toISO(body.date, body.time);
    if (startISO) conv.start = { dateTime: startISO, timeZone: tz };
  }
  if (body.endDate || body.endTime) {
    const endISO = toISO(body.endDate || body.date, body.endTime);
    if (endISO) conv.end = { dateTime: endISO, timeZone: tz };
  } else if (conv.start && body.durationMinutes) {
    const dur = parseInt(body.durationMinutes, 10) || 60;
    const startMs = new Date(conv.start.dateTime).getTime();
    const end = new Date(startMs + dur * 60000);
    const pad = n => String(n).padStart(2, '0');
    const endISO = end.getFullYear() + '-' + pad(end.getMonth()+1) + '-' + pad(end.getDate()) +
      'T' + pad(end.getHours()) + ':' + pad(end.getMinutes()) + ':00';
    conv.end = { dateTime: endISO, timeZone: tz };
  }

  if (Array.isArray(body.attendees)) {
    conv.attendees = body.attendees.map(a => typeof a === 'string' ? { email: a } : a);
  }

  const merged = Object.assign({}, patch, conv);
  if (Object.keys(merged).length === 0) {
    return res.status(400).json({ ok: false, message: 'No fields to update' });
  }

  const params = new URLSearchParams();
  if (sendUpdates) params.set('sendUpdates', sendUpdates);

  const r = await callGoogleAPI(
    'https://www.googleapis.com/calendar/v3/calendars/' +
      encodeURIComponent(calendarId) + '/events/' + encodeURIComponent(eventId) +
      (params.toString() ? '?' + params.toString() : ''),
    { method: 'PATCH', body: JSON.stringify(merged) },
    account
  );
  return res.status(200).json({ ok: true, event: r.data, account: r.email });
}

async function calendarDelete(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }
  const src = req.method === 'DELETE' ? (req.query || {}) : (req.body || {});
  const { eventId, calendarId = 'primary', account, sendUpdates = 'none', confirm } = src;
  if (!eventId) return res.status(400).json({ ok: false, message: 'eventId required' });
  if (confirm !== 'DELETE') {
    return res.status(400).json({ ok: false, message: 'confirm: "DELETE" required' });
  }

  const params = new URLSearchParams();
  if (sendUpdates) params.set('sendUpdates', sendUpdates);

  await callGoogleAPI(
    'https://www.googleapis.com/calendar/v3/calendars/' +
      encodeURIComponent(calendarId) + '/events/' + encodeURIComponent(eventId) +
      (params.toString() ? '?' + params.toString() : ''),
    { method: 'DELETE' },
    account
  );
  return res.status(200).json({ ok: true, eventId, deleted: true });
}

async function calendarFreebusy(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });
  const { timeMin, timeMax, calendarIds, timeZone = 'Europe/Berlin', account } = req.body || {};
  if (!timeMin || !timeMax) {
    return res.status(400).json({ ok: false, message: 'timeMin and timeMax required (ISO-8601)' });
  }
  const ids = Array.isArray(calendarIds) && calendarIds.length ? calendarIds : ['primary'];

  const r = await callGoogleAPI(
    'https://www.googleapis.com/calendar/v3/freeBusy',
    {
      method: 'POST',
      body: JSON.stringify({ timeMin, timeMax, timeZone, items: ids.map(id => ({ id })) })
    },
    account
  );

  const calendars = r.data.calendars || {};
  const out = {};
  for (const k of Object.keys(calendars)) {
    out[k] = { busy: calendars[k].busy || [], errors: calendars[k].errors || [] };
  }
  return res.status(200).json({ ok: true, calendars: out, account: r.email });
}

// ══════════════════════ OPEN (no admin auth — preserved from originals) ══════════════════════

async function sendEmail(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });
  const { email, subject, message, html, account } = req.body || {};
  if (!email || !subject || (!message && !html)) {
    return res.status(400).json({ ok: false, message: 'email, subject, message required' });
  }

  const { access_token, email: fromEmail } = await getValidAccessToken(account);

  const raw = buildRawMessage({
    from: fromEmail, to: email, subject,
    message: message || '', html: html || null
  });

  const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + access_token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw })
  });
  const j = await r.json();
  if (!r.ok) {
    return res.status(500).json({ ok: false, message: (j.error && j.error.message) || 'Gmail send failed', details: j });
  }
  return res.status(200).json({ ok: true, id: j.id, threadId: j.threadId, from: fromEmail });
}

async function createEvent(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });
  const {
    title, date, time, endDate, endTime,
    description, location, attendees, timeZone, durationMinutes, account
  } = req.body || {};

  if (!title || !date) {
    return res.status(400).json({ ok: false, message: 'title and date required' });
  }

  const tz = timeZone || 'Europe/Berlin';
  const startISO = toISO(date, time);
  let endISO = toISO(endDate || date, endTime);

  if (!endTime && !endDate) {
    const dur = Number.isFinite(+durationMinutes) ? +durationMinutes : 60;
    const startMs = new Date(startISO).getTime();
    const e = new Date(startMs + dur * 60000);
    const pad = n => String(n).padStart(2, '0');
    endISO = e.getFullYear() + '-' + pad(e.getMonth()+1) + '-' + pad(e.getDate()) +
      'T' + pad(e.getHours()) + ':' + pad(e.getMinutes()) + ':00';
  }

  const { access_token } = await getValidAccessToken(account);

  const eventBody = {
    summary: title,
    description: description || '',
    location: location || '',
    start: { dateTime: startISO, timeZone: tz },
    end:   { dateTime: endISO,   timeZone: tz }
  };

  if (Array.isArray(attendees) && attendees.length) {
    eventBody.attendees = attendees
      .filter(a => a && typeof a === 'string')
      .map(a => ({ email: a }));
  }

  const r = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + access_token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventBody)
  });
  const j = await r.json();
  if (!r.ok) {
    return res.status(500).json({ ok: false, message: (j.error && j.error.message) || 'Calendar insert failed', details: j });
  }
  return res.status(200).json({
    ok: true, id: j.id, htmlLink: j.htmlLink, start: j.start, end: j.end
  });
}

// ══════════════════════ DISPATCH ══════════════════════

const ACTIONS = {
  'gmail-list':       gmailList,
  'gmail-get':        gmailGet,
  'gmail-modify':     gmailModify,
  'gmail-trash':      gmailTrash,
  'gmail-delete':     gmailDelete,
  'gmail-reply':      gmailReply,
  'gmail-labels':     gmailLabels,
  'calendar-list':    calendarList,
  'calendar-get':     calendarGet,
  'calendar-update':  calendarUpdate,
  'calendar-delete':  calendarDelete,
  'calendar-freebusy':calendarFreebusy,
  'send-email':       sendEmail,
  'create-event':     createEvent
};

module.exports = async function handler(req, res) {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = (req.query && req.query.action) ||
                 (req.body && req.body.action) || '';
  if (!action) {
    return res.status(400).json({ ok: false, message: 'action query parameter required' });
  }
  const fn = ACTIONS[action];
  if (!fn) {
    return res.status(404).json({ ok: false, message: 'Unknown action: ' + action });
  }

  if (PROTECTED.has(action)) {
    if (!requireAdmin(req, res)) return;
  } else if (SEMI_PROTECTED.has(action)) {
    const apiKey = req.headers['x-api-key'] || '';
    if (!apiKey || !verifyToken(apiKey)) {
      return res.status(401).json({ ok: false, message: 'Invalid or missing x-api-key' });
    }
  }

  try {
    await fn(req, res);
  } catch (e) {
    console.error('router [' + action + '] error:', e.message);
    if (!res.headersSent) {
      res.status(e.status || 500).json({
        ok: false,
        message: e.message || 'Server error',
        details: e.details || undefined
      });
    }
  }
};
