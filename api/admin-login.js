'use strict';

const crypto = require('crypto');

// Admin credentials — use env vars in production, fallback for dev
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'simeonv38@gmail.com';
const ADMIN_PASS  = process.env.ADMIN_PASS  || 'Simal456';
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'bgp_admin_secret_2026';

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://bgpomosht.eu');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'Email and password required' });
    }

    // Constant-time comparison to prevent timing attacks
    const emailMatch = crypto.timingSafeEqual(
      Buffer.from(email.toLowerCase().trim()),
      Buffer.from(ADMIN_EMAIL.toLowerCase())
    );
    const passMatch = crypto.timingSafeEqual(
      Buffer.from(password),
      Buffer.from(ADMIN_PASS)
    );

    if (!emailMatch || !passMatch) {
      return res.status(401).json({ ok: false, message: 'Грешен имейл или парола' });
    }

    // Create a simple token: HMAC of email + expiry
    const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    const payload = email.toLowerCase() + ':' + expiry;
    const hmac = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
    const token = Buffer.from(payload + ':' + hmac).toString('base64');

    return res.status(200).json({ ok: true, token: token });

  } catch (err) {
    // Handle length mismatch in timingSafeEqual (wrong length inputs)
    if (err.code === 'ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH') {
      return res.status(401).json({ ok: false, message: 'Грешен имейл или парола' });
    }
    console.error('Admin login error:', err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
};
