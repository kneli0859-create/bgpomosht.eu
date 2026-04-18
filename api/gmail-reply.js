'use strict';

// Reply in the same thread. Fetches the original for Message-ID + subject + from,
// then sends a new message with In-Reply-To + References + threadId.
// POST { id, message?, html?, replyAll?, account? }

const { callGoogleAPI } = require('./lib/google-auth');
const { buildRawMessage, getHeader } = require('./lib/gmail-helpers');
const { requireAdmin, setCORS } = require('./lib/admin-auth');

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

module.exports = async function handler(req, res) {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;

  try {
    const { id, message, html, replyAll, account } = req.body || {};
    if (!id) return res.status(400).json({ ok: false, message: 'id required' });
    if (!message && !html) return res.status(400).json({ ok: false, message: 'message or html required' });

    // Fetch original message headers
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
      {
        method: 'POST',
        body: JSON.stringify({ raw, threadId })
      },
      account
    );

    return res.status(200).json({
      ok: true,
      id: send.data.id,
      threadId: send.data.threadId,
      to: toList,
      account: send.email
    });
  } catch (e) {
    console.error('gmail-reply error:', e.message);
    return res.status(e.status || 500).json({ ok: false, message: e.message || 'Server error' });
  }
};
