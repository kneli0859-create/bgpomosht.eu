'use strict';

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'bgp_admin_secret_2026';

function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;

    const email = parts[0];
    const expiry = parseInt(parts[1]);
    const hmac = parts[2];

    // Check expiry
    if (Date.now() > expiry) return false;

    // Verify HMAC
    const payload = email + ':' + expiry;
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
    const hmacMatch = crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected));

    return hmacMatch;
  } catch (e) {
    return false;
  }
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://bgpomosht.eu');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Verify auth token
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ ok: false, message: 'Database not configured' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // GET = fetch submissions
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      return res.status(200).json({ ok: true, data: data || [] });
    }

    // POST = update status
    if (req.method === 'POST') {
      const { id, status } = req.body || {};
      if (!id || !status) {
        return res.status(400).json({ ok: false, message: 'id and status required' });
      }

      const allowed = ['new', 'in_progress', 'done', 'cancelled'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ ok: false, message: 'Invalid status' });
      }

      const { error } = await supabase
        .from('submissions')
        .update({ status: status })
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, message: 'Method not allowed' });

  } catch (err) {
    console.error('Admin data error:', err);
    return res.status(500).json({ ok: false, message: err.message });
  }
};
