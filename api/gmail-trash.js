'use strict';

// Move message to trash or restore from trash.
// POST { id, restore?, account? }  — restore=true uses untrash endpoint.

const { callGoogleAPI } = require('./lib/google-auth');
const { requireAdmin, setCORS } = require('./lib/admin-auth');

module.exports = async function handler(req, res) {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;

  try {
    const { id, restore, account } = req.body || {};
    if (!id) return res.status(400).json({ ok: false, message: 'id required' });

    const path = restore ? 'untrash' : 'trash';
    const r = await callGoogleAPI(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/' + encodeURIComponent(id) + '/' + path,
      { method: 'POST' },
      account
    );
    return res.status(200).json({ ok: true, id: r.data.id, action: path, account: r.email });
  } catch (e) {
    console.error('gmail-trash error:', e.message);
    return res.status(e.status || 500).json({ ok: false, message: e.message || 'Server error' });
  }
};
