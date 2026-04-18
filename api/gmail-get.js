'use strict';

const { callGoogleAPI } = require('./lib/google-auth');
const { extractBodies, summarizeMessage } = require('./lib/gmail-helpers');
const { requireAdmin, setCORS } = require('./lib/admin-auth');

module.exports = async function handler(req, res) {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }
  if (!requireAdmin(req, res)) return;

  try {
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
  } catch (e) {
    console.error('gmail-get error:', e.message);
    return res.status(e.status || 500).json({ ok: false, message: e.message || 'Server error' });
  }
};
