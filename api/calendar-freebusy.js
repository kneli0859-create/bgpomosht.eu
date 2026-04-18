'use strict';

// Returns busy slots in a given time range across given calendars.
// POST { timeMin, timeMax, calendarIds?, timeZone?, account? }

const { callGoogleAPI } = require('./lib/google-auth');
const { requireAdmin, setCORS } = require('./lib/admin-auth');

module.exports = async function handler(req, res) {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;

  try {
    const { timeMin, timeMax, calendarIds, timeZone = 'Europe/Berlin', account } = req.body || {};
    if (!timeMin || !timeMax) {
      return res.status(400).json({ ok: false, message: 'timeMin and timeMax required (ISO-8601)' });
    }
    const ids = Array.isArray(calendarIds) && calendarIds.length ? calendarIds : ['primary'];

    const r = await callGoogleAPI(
      'https://www.googleapis.com/calendar/v3/freeBusy',
      {
        method: 'POST',
        body: JSON.stringify({
          timeMin, timeMax, timeZone,
          items: ids.map(id => ({ id }))
        })
      },
      account
    );

    const calendars = r.data.calendars || {};
    const out = {};
    for (const k of Object.keys(calendars)) {
      out[k] = {
        busy: calendars[k].busy || [],
        errors: calendars[k].errors || []
      };
    }
    return res.status(200).json({ ok: true, calendars: out, account: r.email });
  } catch (e) {
    console.error('calendar-freebusy error:', e.message);
    return res.status(e.status || 500).json({ ok: false, message: e.message || 'Server error' });
  }
};
