'use strict';

// List calendar events. GET ?timeMin=&timeMax=&q=&maxResults=&calendarId=primary

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
    const calendarId = src.calendarId || 'primary';
    const timeMin = src.timeMin || new Date().toISOString();
    const timeMax = src.timeMax || '';
    const q = src.q || '';
    const maxResults = Math.min(parseInt(src.maxResults, 10) || 25, 250);
    const pageToken = src.pageToken || '';
    const account = src.account || undefined;

    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      timeMin,
      maxResults: String(maxResults)
    });
    if (timeMax) params.set('timeMax', timeMax);
    if (q) params.set('q', q);
    if (pageToken) params.set('pageToken', pageToken);

    const r = await callGoogleAPI(
      'https://www.googleapis.com/calendar/v3/calendars/' +
        encodeURIComponent(calendarId) + '/events?' + params.toString(),
      { method: 'GET' },
      account
    );

    const events = (r.data.items || []).map(ev => ({
      id: ev.id,
      status: ev.status,
      summary: ev.summary || '',
      description: ev.description || '',
      location: ev.location || '',
      start: ev.start || null,
      end: ev.end || null,
      attendees: (ev.attendees || []).map(a => ({
        email: a.email, responseStatus: a.responseStatus, optional: !!a.optional, organizer: !!a.organizer
      })),
      htmlLink: ev.htmlLink,
      hangoutLink: ev.hangoutLink || null,
      conferenceData: ev.conferenceData || null,
      created: ev.created, updated: ev.updated,
      organizer: ev.organizer || null
    }));

    return res.status(200).json({
      ok: true,
      events,
      nextPageToken: r.data.nextPageToken || null,
      timeZone: r.data.timeZone || null,
      account: r.email
    });
  } catch (e) {
    console.error('calendar-list error:', e.message);
    return res.status(e.status || 500).json({ ok: false, message: e.message || 'Server error' });
  }
};
