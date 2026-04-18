'use strict';

const { getValidAccessToken } = require('./lib/google-auth');

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodeHeader(s) {
  // RFC 2047 Q-encoded UTF-8 (для кирилица)
  const needs = /[^\x20-\x7E]/.test(s);
  if (!needs) return s;
  return '=?UTF-8?B?' + Buffer.from(s, 'utf8').toString('base64') + '?=';
}

function buildRawMessage({ from, to, subject, message, html }) {
  const boundary = 'bgp_' + Math.random().toString(36).slice(2);
  const isHtml = !!html;
  const lines = [
    'From: ' + from,
    'To: ' + to,
    'Subject: ' + encodeHeader(subject || ''),
    'MIME-Version: 1.0'
  ];
  if (isHtml) {
    lines.push('Content-Type: multipart/alternative; boundary="' + boundary + '"');
    lines.push('', '--' + boundary);
    lines.push('Content-Type: text/plain; charset="UTF-8"');
    lines.push('Content-Transfer-Encoding: 7bit');
    lines.push('', message || '');
    lines.push('--' + boundary);
    lines.push('Content-Type: text/html; charset="UTF-8"');
    lines.push('Content-Transfer-Encoding: 7bit');
    lines.push('', html);
    lines.push('--' + boundary + '--');
  } else {
    lines.push('Content-Type: text/plain; charset="UTF-8"');
    lines.push('Content-Transfer-Encoding: 7bit');
    lines.push('', message || '');
  }
  return b64url(lines.join('\r\n'));
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://bgpomosht.eu');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });

  try {
    const { email, subject, message, html, account } = req.body || {};
    if (!email || !subject || (!message && !html)) {
      return res.status(400).json({ ok: false, message: 'email, subject, message required' });
    }

    const { access_token, email: fromEmail } = await getValidAccessToken(account);

    const raw = buildRawMessage({
      from: fromEmail,
      to: email,
      subject: subject,
      message: message || '',
      html: html || null
    });

    const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + access_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: raw })
    });
    const j = await r.json();
    if (!r.ok) {
      return res.status(500).json({ ok: false, message: (j.error && j.error.message) || 'Gmail send failed', details: j });
    }
    return res.status(200).json({ ok: true, id: j.id, threadId: j.threadId, from: fromEmail });
  } catch (e) {
    console.error('send-email error:', e.message);
    return res.status(500).json({ ok: false, message: e.message || 'Server error' });
  }
};
