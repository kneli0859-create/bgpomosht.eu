'use strict';

// List all labels on the account (system + user).

const { callGoogleAPI } = require('./lib/google-auth');
const { requireAdmin, setCORS } = require('./lib/admin-auth');

module.exports = async function handler(req, res) {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }
  if (!requireAdmin(req, res)) return;

  try {
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
  } catch (e) {
    console.error('gmail-labels error:', e.message);
    return res.status(e.status || 500).json({ ok: false, message: e.message || 'Server error' });
  }
};
