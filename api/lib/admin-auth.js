'use strict';

const crypto = require('crypto');

const TOKEN_SECRET = process.env.TOKEN_SECRET || 'bgp_admin_secret_2026';

function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;

    const email = parts[0];
    const expiry = parseInt(parts[1]);
    const hmac = parts[2];

    if (!email || !expiry || Date.now() > expiry) return false;

    const payload = email + ':' + expiry;
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
    if (hmac.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected));
  } catch (e) {
    return false;
  }
}

// Returns true on pass. On fail, writes 401 response and returns false.
function requireAdmin(req, res) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token || !verifyToken(token)) {
    res.status(401).json({ ok: false, message: 'Unauthorized' });
    return false;
  }
  return true;
}

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://bgpomosht.eu');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = { verifyToken, requireAdmin, setCORS };
