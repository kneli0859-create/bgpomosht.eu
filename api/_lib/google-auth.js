'use strict';

// Shared Google OAuth token helper. Fetches tokens from Supabase `google_tokens`,
// auto-refreshes when expired, returns a valid access_token.

const { createClient } = require('@supabase/supabase-js');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

function supabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw new Error('Supabase not configured');
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

async function loadTokenRow(email) {
  const sb = supabase();
  let q = sb.from('google_tokens').select('*');
  if (email) q = q.eq('email', email);
  else q = q.order('updated_at', { ascending: false }).limit(1);
  const { data, error } = await q.maybeSingle ? await q.maybeSingle() : await q.single();
  if (error) throw new Error('Token lookup failed: ' + error.message);
  if (!data) throw new Error('No Google account connected');
  return data;
}

async function refreshAccessToken(row) {
  if (!row.refresh_token) throw new Error('No refresh_token stored — reconnect Google');
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) throw new Error('Google credentials missing');

  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: row.refresh_token,
    grant_type: 'refresh_token'
  });

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });
  const j = await r.json();
  if (!r.ok) throw new Error('Refresh failed: ' + (j.error_description || j.error || r.status));

  const expires_at = new Date(Date.now() + (j.expires_in || 3600) * 1000).toISOString();
  const sb = supabase();
  await sb.from('google_tokens').update({
    access_token: j.access_token,
    expires_at: expires_at,
    updated_at: new Date().toISOString()
  }).eq('email', row.email);

  return { access_token: j.access_token, expires_at: expires_at, email: row.email };
}

async function getValidAccessToken(email) {
  const row = await loadTokenRow(email);
  const expMs = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  // refresh if expired or within 60s of expiry
  if (!row.access_token || Date.now() > expMs - 60000) {
    const refreshed = await refreshAccessToken(row);
    return { access_token: refreshed.access_token, email: row.email };
  }
  return { access_token: row.access_token, email: row.email };
}

// Call Google API with automatic 401 retry (force-refresh access token once).
// url: full URL. opts: fetch options (headers auto-merged with Authorization).
// Returns parsed JSON (or {} on 204). Throws Error with .status + .details on failure.
async function callGoogleAPI(url, opts, email) {
  const doCall = async (accessToken) => {
    const headers = Object.assign({}, opts.headers || {}, {
      Authorization: 'Bearer ' + accessToken
    });
    if (opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    const r = await fetch(url, Object.assign({}, opts, { headers }));
    const text = await r.text();
    let j = {};
    if (text) { try { j = JSON.parse(text); } catch (_) { j = { raw: text }; } }
    return { ok: r.ok, status: r.status, body: j };
  };

  const { access_token, email: tokenEmail } = await getValidAccessToken(email);
  let res = await doCall(access_token);

  if (res.status === 401) {
    // Force refresh and retry once
    const row = await loadTokenRow(tokenEmail);
    const refreshed = await refreshAccessToken(row);
    res = await doCall(refreshed.access_token);
  }

  if (!res.ok) {
    const msg = (res.body && res.body.error && (res.body.error.message || res.body.error)) || ('Google API ' + res.status);
    const err = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    err.status = res.status;
    err.details = res.body;
    throw err;
  }
  return { data: res.body, email: tokenEmail };
}

module.exports = { getValidAccessToken, callGoogleAPI };
