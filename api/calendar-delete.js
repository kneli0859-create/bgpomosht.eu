'use strict';

// Delete a calendar event. Requires confirm: "DELETE" to reduce accidents.
// POST { eventId, calendarId?, account?, sendUpdates?, confirm }

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
  } catch (e) {
    console.error('calendar-delete error:', e.message);
    return res.status(e.status || 500).json({ ok: false, message: e.message || 'Server error' });
  }
};
