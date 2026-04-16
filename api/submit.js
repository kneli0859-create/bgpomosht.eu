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

// Sanitize user input — strip HTML tags to prevent injection
function sanitize(str) {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/[<>]/g, function (ch) {
    return ch === '<' ? '&lt;' : '&gt;';
  });
}

// Allowed file extensions for uploads
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx'];
function isAllowedFile(filename) {
  if (!filename) return false;
  var ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.indexOf(ext) !== -1;
}

// Simple in-memory rate limiting (per IP, resets on cold start)
var ipHits = {};
var RATE_WINDOW = 60 * 1000; // 1 minute
var RATE_MAX = 5;            // max 5 submissions per minute per IP
function checkRateLimit(ip) {
  var now = Date.now();
  if (!ipHits[ip] || now - ipHits[ip].start > RATE_WINDOW) {
    ipHits[ip] = { start: now, count: 1 };
    return true;
  }
  ipHits[ip].count++;
  return ipHits[ip].count <= RATE_MAX;
}

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

  // Rate limit check
  var clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ ok: false, message: 'Твърде много заявки. Моля, опитайте отново след минута.' });
  }

  try {
    const { fields, files } = await parseMultipart(req);

    // Validate file types
    var rejectedFiles = files.filter(function (f) { return !isAllowedFile(f.filename); });
    if (rejectedFiles.length > 0) {
      return res.status(400).json({
        ok: false,
        message: 'Невалиден тип файл. Приемаме: JPG, PNG, PDF, DOC, DOCX.'
      });
    }

    // Sanitize all text fields
    Object.keys(fields).forEach(function (k) {
      fields[k] = sanitize(fields[k]);
    });

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

        // Field name lookup — handles both UTF-8 and Latin-1 encoded keys
        function findField(patterns) {
          for (var i = 0; i < patterns.length; i++) {
            if (fields[patterns[i]] !== undefined) return fields[patterns[i]];
          }
          // Fallback: search by Buffer comparison for encoding mismatches
          var keys = Object.keys(fields);
          for (var j = 0; j < patterns.length; j++) {
            var patBuf = Buffer.from(patterns[j], 'utf8');
            for (var k = 0; k < keys.length; k++) {
              var keyBuf = Buffer.from(keys[k], 'latin1');
              if (patBuf.equals(keyBuf)) return fields[keys[k]];
            }
          }
          return null;
        }

        var fName    = findField(['\u0418\u043C\u0435', 'Име']);
        var fPhone   = findField(['\u0422\u0435\u043B\u0435\u0444\u043E\u043D', 'Телефон']);
        var fEmail   = findField(['\u0418\u043C\u0435\u0439\u043B', 'Имейл']);
        var fPkg     = findField(['\u041F\u0430\u043A\u0435\u0442', 'Пакет']);
        var fContact = findField(['\u041A\u043E\u043D\u0442\u0430\u043A\u0442', 'Контакт']);
        var fMsg     = findField(['\u0421\u044A\u043E\u0431\u0449\u0435\u043D\u0438\u0435', 'Съобщение']);

        // Collect remaining fields as extra data
        var mappedKeys = new Set();
        Object.keys(fields).forEach(function (k) {
          if (k === 'wizardService') { mappedKeys.add(k); return; }
          var v = fields[k];
          if (v === fName || v === fPhone || v === fEmail || v === fPkg || v === fContact || v === fMsg) {
            mappedKeys.add(k);
          }
        });
        var extraData = {};
        Object.entries(fields).forEach(function ([k, v]) {
          if (!mappedKeys.has(k) && v && v.toString().trim()) {
            extraData[k] = v;
          }
        });

        await supabase.from('submissions').insert({
          service:        fields.wizardService || null,
          package:        fPkg || null,
          name:           fName || 'Unknown',
          phone:          fPhone || 'Unknown',
          email:          fEmail || null,
          contact_method: fContact || 'WhatsApp',
          message:        fMsg || null,
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
