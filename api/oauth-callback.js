'use strict';

const { createClient } = require('@supabase/supabase-js');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = 'https://bgpomosht.eu/api/oauth-callback';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

function parseCookies(req) {
  const out = {};
  const raw = req.headers.cookie || '';
  raw.split(';').forEach(function (p) {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ ok: false, message: 'OAuth credentials not configured' });
  }

  const url = new URL(req.url, 'https://bgpomosht.eu');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) return redirect(res, '/admin.html?oauth_error=' + encodeURIComponent(error));
  if (!code || !state) return redirect(res, '/admin.html?oauth_error=missing_params');

  const cookies = parseCookies(req);
  if (!cookies.oauth_state || cookies.oauth_state !== state) {
    return redirect(res, '/admin.html?oauth_error=state_mismatch');
  }

  // Clear state cookie
  res.setHeader('Set-Cookie', [
    'oauth_state=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax'
  ]);

  try {
    const body = new URLSearchParams({
      code: code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
    const tokens = await tokenRes.json();
    if (!tokenRes.ok) {
      return redirect(res, '/admin.html?oauth_error=' + encodeURIComponent(tokens.error || 'token_exchange_failed'));
    }

    // Fetch user info
    let userInfo = {};
    try {
      const uRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: 'Bearer ' + tokens.access_token }
      });
      if (uRes.ok) userInfo = await uRes.json();
    } catch (e) {}

    // Persist in Supabase (table: google_tokens)
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        const expires_at = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();
        await supabase.from('google_tokens').upsert({
          email: userInfo.email || 'unknown',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          scope: tokens.scope || '',
          token_type: tokens.token_type || 'Bearer',
          expires_at: expires_at,
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' });
      } catch (e) {
        console.error('Supabase persist error:', e.message);
      }
    }

    return redirect(res, '/admin.html?success=1&email=' + encodeURIComponent(userInfo.email || ''));
  } catch (e) {
    console.error('oauth-callback error:', e.message);
    return redirect(res, '/admin.html?oauth_error=server_error');
  }
};
