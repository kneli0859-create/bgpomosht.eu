'use strict';

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
  } catch (e) {
    console.error('calendar-get error:', e.message);
    return res.status(e.status || 500).json({ ok: false, message: e.message || 'Server error' });
  }
};
