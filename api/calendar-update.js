'use strict';

// Patch a calendar event. Only provided fields are updated.
// POST { eventId, calendarId?, account?, patch: { summary?, description?, location?,
//   start?, end?, attendees?, status?, reminders?, colorId? } }
// Convenience: title→summary, date/time/endDate/endTime/durationMinutes/timeZone handled.

const { callGoogleAPI } = require('./lib/google-auth');
const { requireAdmin, setCORS } = require('./lib/admin-auth');

function toISO(date, time) {
  if (!date) return null;
  const t = time && /^\d{2}:\d{2}$/.test(time) ? time : '09:00';
  return date + 'T' + t + ':00';
}

module.exports = async function handler(req, res) {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST' && req.method !== 'PATCH') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }
  if (!requireAdmin(req, res)) return;

  try {
    const body = req.body || {};
    const { eventId, calendarId = 'primary', account, patch = {}, sendUpdates = 'none' } = body;
    if (!eventId) return res.status(400).json({ ok: false, message: 'eventId required' });

    // Allow convenience fields at top level (title, date, time, etc.)
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
  } catch (e) {
    console.error('calendar-update error:', e.message);
    return res.status(e.status || 500).json({ ok: false, message: e.message || 'Server error' });
  }
};
