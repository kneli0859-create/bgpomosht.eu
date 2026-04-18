'use strict';

// PERMANENT delete — message cannot be recovered. Requires full mail scope.
// Use gmail-trash for safer soft-delete.

const { callGoogleAPI } = require('./lib/google-auth');
const { requireAdmin, setCORS } = require('./lib/admin-auth');

module.exports = async function handler(req, res) {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }
  if (!requireAdmin(req, res)) return;

  try {
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
  } catch (e) {
    console.error('gmail-delete error:', e.message);
    return res.status(e.status || 500).json({ ok: false, message: e.message || 'Server error' });
  }
};
