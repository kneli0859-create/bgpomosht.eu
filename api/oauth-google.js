'use strict';

const crypto = require('crypto');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const REDIRECT_URI = 'https://bgpomosht.eu/api/oauth-callback';

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/calendar'
].join(' ');

module.exports = async function handler(req, res) {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ ok: false, message: 'GOOGLE_CLIENT_ID not configured' });
  }

  const state = crypto.randomBytes(24).toString('hex');

  res.setHeader('Set-Cookie', [
    'oauth_state=' + state + '; Max-Age=600; Path=/; Secure; HttpOnly; SameSite=Lax'
  ]);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: state
  });

  const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
  res.writeHead(302, { Location: url });
  res.end();
};
