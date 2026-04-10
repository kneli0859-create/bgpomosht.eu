'use strict';

const Busboy     = require('busboy');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

// Vercel environment variables
const GMAIL_USER = process.env.GMAIL_USER || 'simeonv38@gmail.com';
const GMAIL_PASS = process.env.GMAIL_PASS || '';
const TO_EMAIL   = process.env.TO_EMAIL   || 'simeonv38@gmail.com';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

// Disable Vercel default body parser — we handle multipart ourselves
module.exports.config = { api: { bodyParser: false } };

module.exports = async function handler(req, res) {
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
      '\u{1F4CB} НОВА ЗАЯВКА \u2014 bgpomosht.eu',
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

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_PASS }
    });

    await transporter.sendMail({
      from:    '"BG \u041F\u043E\u043C\u043E\u0449 \u0424\u043E\u0440\u043C\u0430" <' + GMAIL_USER + '>',
      to:      TO_EMAIL,
      subject: '\u{1F4CB} \u041D\u043E\u0432\u0430 \u0437\u0430\u044F\u0432\u043A\u0430: ' + (fields.wizardService || '\u0421\u0430\u0439\u0442'),
      text:    lines.join('\n'),
      attachments: attachments
    });

    // Save to Supabase database
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      try {
        var supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // Collect extra step2 fields into a JSON object
        var knownKeys = ['wizardService', '\u041F\u0430\u043A\u0435\u0442', '\u041A\u043E\u043D\u0442\u0430\u043A\u0442', '\u0418\u043C\u0435', '\u0422\u0435\u043B\u0435\u0444\u043E\u043D', '\u0418\u043C\u0435\u0439\u043B', '\u0421\u044A\u043E\u0431\u0449\u0435\u043D\u0438\u0435'];
        var extraData = {};
        Object.entries(fields).forEach(function ([k, v]) {
          if (knownKeys.indexOf(k) === -1 && v && v.toString().trim()) {
            extraData[k] = v;
          }
        });

        await supabase.from('submissions').insert({
          service:        fields.wizardService || null,
          package:        fields['\u041F\u0430\u043A\u0435\u0442'] || null,
          name:           fields['\u0418\u043C\u0435'] || 'Unknown',
          phone:          fields['\u0422\u0435\u043B\u0435\u0444\u043E\u043D'] || 'Unknown',
          email:          fields['\u0418\u043C\u0435\u0439\u043B'] || null,
          contact_method: fields['\u041A\u043E\u043D\u0442\u0430\u043A\u0442'] || 'WhatsApp',
          message:        fields['\u0421\u044A\u043E\u0431\u0449\u0435\u043D\u0438\u0435'] || null,
          extra_data:     extraData,
          files_count:    files.length,
          file_names:     files.map(function (f) { return f.filename; }),
          status:         'new'
        });
      } catch (dbErr) {
        // Log but don't fail — email was already sent
        console.error('Supabase save error:', dbErr.message);
      }
    }

    return res.status(200).json({ ok: true, message: '\u0417\u0430\u044F\u0432\u043A\u0430\u0442\u0430 \u0435 \u0438\u0437\u043F\u0440\u0430\u0442\u0435\u043D\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E!' });

  } catch (err) {
    console.error('Email error:', err);
    return res.status(500).json({ ok: false, message: '\u0413\u0440\u0435\u0448\u043A\u0430 \u043F\u0440\u0438 \u0438\u0437\u043F\u0440\u0430\u0449\u0430\u043D\u0435: ' + err.message });
  }
};

// Parse multipart/form-data with busboy
function parseMultipart(req) {
  return new Promise(function (resolve, reject) {
    var fields = {};
    var files  = [];

    var bb = Busboy({
      headers: req.headers,
      limits: { fileSize: 20 * 1024 * 1024 }
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
