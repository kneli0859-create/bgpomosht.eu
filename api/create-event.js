'use strict';

const { getValidAccessToken } = require('./lib/google-auth');

function toISO(date, time, tz) {
  // date: YYYY-MM-DD, time: HH:MM (optional)
  if (!date) return null;
  const t = time && /^\d{2}:\d{2}$/.test(time) ? time : '09:00';
  // Return naive datetime + timeZone field; Google handles conversion
  return date + 'T' + t + ':00';
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://bgpomosht.eu');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });

  try {
    const {
      title,
      date,
      time,
      endDate,
      endTime,
      description,
      location,
      attendees,
      timeZone,
      durationMinutes,
      account
    } = req.body || {};

    if (!title || !date) {
      return res.status(400).json({ ok: false, message: 'title and date required' });
    }

    const tz = timeZone || 'Europe/Berlin';
    const startISO = toISO(date, time, tz);
    let endISO = toISO(endDate || date, endTime, tz);

    // If no explicit end, add durationMinutes (default 60)
    if (!endTime && !endDate) {
      const dur = Number.isFinite(+durationMinutes) ? +durationMinutes : 60;
      const startMs = new Date(startISO).getTime();
      const e = new Date(startMs + dur * 60000);
      const yyyy = e.getFullYear();
      const mm = String(e.getMonth() + 1).padStart(2, '0');
      const dd = String(e.getDate()).padStart(2, '0');
      const hh = String(e.getHours()).padStart(2, '0');
      const mi = String(e.getMinutes()).padStart(2, '0');
      endISO = yyyy + '-' + mm + '-' + dd + 'T' + hh + ':' + mi + ':00';
    }

    const { access_token } = await getValidAccessToken(account);

    const eventBody = {
      summary: title,
      description: description || '',
      location: location || '',
      start: { dateTime: startISO, timeZone: tz },
      end: { dateTime: endISO, timeZone: tz }
    };

    if (Array.isArray(attendees) && attendees.length) {
      eventBody.attendees = attendees
        .filter(function (a) { return a && typeof a === 'string'; })
        .map(function (a) { return { email: a }; });
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
      ok: true,
      id: j.id,
      htmlLink: j.htmlLink,
      start: j.start,
      end: j.end
    });
  } catch (e) {
    console.error('create-event error:', e.message);
    return res.status(500).json({ ok: false, message: e.message || 'Server error' });
  }
};
