'use strict';

const Busboy     = require('busboy');
const nodemailer = require('nodemailer');

// Vercel environment variables (set in Vercel dashboard)
const GMAIL_USER = process.env.GMAIL_USER || 'simeonv38@gmail.com';
const GMAIL_PASS = process.env.GMAIL_PASS || '';
const TO_EMAIL   = process.env.TO_EMAIL   || 'simeonv38@gmail.com';

// Disable Vercel default body parser — we handle multipart ourselves
module.exports.config = { api: { bodyParser: false } };

module.exports = async function handler(req, res) {
  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  if (!GMAIL_PASS) {
    return res.status(500).json({
      ok: false,
      message: 'Server not configured (missing GMAIL_PASS env variable)'
    });
  }

  try {
    const { fields, files } = await parseMultipart(req);

    // Build attachments array for nodemailer
    const attachments = files.map(function (f) {
      return {
        filename:    f.filename,
        content:     f.buffer,
        contentType: f.mimeType
      };
    });

    // Build email body from fields
    const lines = [
      '\u{1F4CB} НОВА ЗАЯВКА — bgpomosht.eu',
      '\u2550'.repeat(31),
      ''
    ];
    Object.entries(fields).forEach(function ([k, v]) {
      if (v && v.toString().trim()) {
        lines.push(k + ': ' + v);
      }
    });
    if (attachments.length > 0) {
      lines.push('');
      lines.push('\u{1F4CE} Прикачени файлове (' + attachments.length + '):');
      attachments.forEach(function (a) { lines.push('  \u2022 ' + a.filename); });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_PASS }
    });

    await transporter.sendMail({
      from:    '"BG \u041F\u043E\u043C\u043E\u0449 \u0424\u043E\u0440\u043C\u0430" <' + GMAIL_USER + '>',
      to:      TO_EMAIL,
      subject: '\u{1F4CB} Нова заявка: ' + (fields.wizardService || 'Сайт'),
      text:    lines.join('\n'),
      attachments: attachments
    });

    return res.status(200).json({ ok: true, message: 'Заявката е изпратена успешно!' });

  } catch (err) {
    console.error('Email error:', err);
    return res.status(500).json({ ok: false, message: 'Грешка при изпращане: ' + err.message });
  }
};

// Parse multipart/form-data with busboy
function parseMultipart(req) {
  return new Promise(function (resolve, reject) {
    var fields = {};
    var files  = [];

    var bb = Busboy({
      headers: req.headers,
      limits: { fileSize: 20 * 1024 * 1024 } // 20 MB per file
    });

    bb.on('field', function (name, val) {
      fields[name] = val;
    });

    bb.on('file', function (name, stream, info) {
      var chunks = [];
      stream.on('data', function (chunk) { chunks.push(chunk); });
      stream.on('end', function () {
        if (chunks.length > 0) {
          files.push({
            fieldname: name,
            filename:  info.filename,
            mimeType:  info.mimeType,
            buffer:    Buffer.concat(chunks)
          });
        }
      });
    });

    bb.on('close', function ()  { resolve({ fields: fields, files: files }); });
    bb.on('error', function (e) { reject(e); });

    req.pipe(bb);
  });
}
