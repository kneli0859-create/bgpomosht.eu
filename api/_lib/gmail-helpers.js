'use strict';

// Base64url decode → utf8 string
function b64urlDecode(s) {
  if (!s) return '';
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4;
  const padded = pad ? b64 + '='.repeat(4 - pad) : b64;
  try { return Buffer.from(padded, 'base64').toString('utf8'); }
  catch (_) { return ''; }
}

// Base64url encode (for raw message send/reply)
function b64urlEncode(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// RFC 2047 Q-encoded UTF-8 header (за кирилица)
function encodeHeader(s) {
  if (!s) return '';
  const needs = /[^\x20-\x7E]/.test(s);
  if (!needs) return s;
  return '=?UTF-8?B?' + Buffer.from(s, 'utf8').toString('base64') + '?=';
}

function getHeader(headers, name) {
  if (!Array.isArray(headers)) return '';
  const h = headers.find(h => h.name && h.name.toLowerCase() === name.toLowerCase());
  return h ? (h.value || '') : '';
}

// Walk payload tree and collect first text/plain + text/html bodies
function extractBodies(payload) {
  const out = { plain: '', html: '', attachments: [] };
  function walk(part) {
    if (!part) return;
    const mime = (part.mimeType || '').toLowerCase();
    const body = part.body || {};
    const data = body.data;
    const filename = part.filename || '';

    if (filename && body.attachmentId) {
      out.attachments.push({
        filename,
        mimeType: mime,
        size: body.size || 0,
        attachmentId: body.attachmentId
      });
    } else if (mime === 'text/plain' && data && !out.plain) {
      out.plain = b64urlDecode(data);
    } else if (mime === 'text/html' && data && !out.html) {
      out.html = b64urlDecode(data);
    }
    if (Array.isArray(part.parts)) part.parts.forEach(walk);
  }
  walk(payload);
  return out;
}

// Build RFC822 raw message (base64url encoded) for send or reply
function buildRawMessage({ from, to, subject, message, html, inReplyTo, references }) {
  const boundary = 'bgp_' + Math.random().toString(36).slice(2);
  const isHtml = !!html;
  const lines = [
    'From: ' + from,
    'To: ' + to,
    'Subject: ' + encodeHeader(subject || ''),
    'MIME-Version: 1.0'
  ];
  if (inReplyTo) lines.push('In-Reply-To: ' + inReplyTo);
  if (references) lines.push('References: ' + references);

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
  return b64urlEncode(lines.join('\r\n'));
}

// Summarize a gmail message into a compact preview for list endpoints
function summarizeMessage(msg) {
  const headers = (msg.payload && msg.payload.headers) || [];
  const labels = msg.labelIds || [];
  return {
    id: msg.id,
    threadId: msg.threadId,
    snippet: msg.snippet || '',
    subject: getHeader(headers, 'Subject'),
    from: getHeader(headers, 'From'),
    to: getHeader(headers, 'To'),
    date: getHeader(headers, 'Date'),
    internalDate: msg.internalDate ? Number(msg.internalDate) : null,
    unread: labels.includes('UNREAD'),
    starred: labels.includes('STARRED'),
    important: labels.includes('IMPORTANT'),
    labelIds: labels
  };
}

module.exports = {
  b64urlDecode, b64urlEncode, encodeHeader,
  getHeader, extractBodies, buildRawMessage, summarizeMessage
};
