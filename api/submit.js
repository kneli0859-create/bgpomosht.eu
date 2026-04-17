'use strict';

const Busboy     = require('busboy');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const { autoDraft } = require('./lib/ai-autodraft');

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

// Allowed origins for CORS
var ALLOWED_ORIGINS = ['https://bgpomosht.eu', 'https://www.bgpomosht.eu'];

module.exports = async function handler(req, res) {
  var origin = req.headers.origin || '';

  // CORS preflight
  if (req.method === 'OPTIONS') {
    if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  // CORS origin check — block requests from unknown domains
  if (origin && ALLOWED_ORIGINS.indexOf(origin) === -1) {
    return res.status(403).json({ ok: false, message: 'Forbidden origin' });
  }

  // Set CORS headers for valid requests
  if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
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

    // Build WhatsApp quick-reply link for admin email
    var customerPhone = fields['\u0422\u0435\u043B\u0435\u0444\u043E\u043D'] || fields['Телефон'] || '';
    var customerName  = fields['\u0418\u043C\u0435'] || fields['Име'] || '';
    var waLink = '';
    if (customerPhone) {
      var cleanPhone = customerPhone.replace(/[^0-9+]/g, '').replace(/^\+/, '');
      var waText = encodeURIComponent('Здравейте ' + customerName + '! Получихме заявката Ви за ' + (fields.wizardService || 'услуга') + '. Как мога да Ви помогна?');
      waLink = '\n\n\u{1F4F1} \u0411\u044A\u0440\u0437 \u043E\u0442\u0433\u043E\u0432\u043E\u0440 \u043F\u043E WhatsApp:\nhttps://wa.me/' + cleanPhone + '?text=' + waText;
    }

    await transporter.sendMail({
      from:    '"BG \u041F\u043E\u043C\u043E\u0449 \u0424\u043E\u0440\u043C\u0430" <' + GMAIL_USER + '>',
      to:      TO_EMAIL,
      subject: '\u{1F4CB} \u041D\u043E\u0432\u0430 \u0437\u0430\u044F\u0432\u043A\u0430: ' + (fields.wizardService || '\u0421\u0430\u0439\u0442'),
      text:    lines.join('\n') + waLink,
      attachments: attachments
    });

    // Auto-reply confirmation to customer (if email provided)
    var customerEmail = fields['\u0418\u043C\u0435\u0439\u043B'] || fields['Имейл'] || '';
    if (customerEmail && customerEmail.includes('@')) {
      try {
        await transporter.sendMail({
          from:    '"BG \u041F\u043E\u043C\u043E\u0449" <' + GMAIL_USER + '>',
          to:      customerEmail,
          subject: '\u2705 \u041F\u043E\u043B\u0443\u0447\u0438\u0445\u043C\u0435 \u0432\u0430\u0448\u0430\u0442\u0430 \u0437\u0430\u044F\u0432\u043A\u0430 \u2014 BG \u041F\u043E\u043C\u043E\u0449',
          html: [
            '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#333">',
            '<div style="background:linear-gradient(135deg,#0a0e27,#1a1f4a);padding:28px;border-radius:16px 16px 0 0;text-align:center">',
            '<h1 style="color:#d4a843;margin:0;font-size:22px">BG \u041F\u043E\u043C\u043E\u0449</h1>',
            '<p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:13px">\u041F\u043E\u043C\u043E\u0449 \u0437\u0430 \u0431\u044A\u043B\u0433\u0430\u0440\u0438 \u0432 \u0415\u0432\u0440\u043E\u043F\u0430</p>',
            '</div>',
            '<div style="background:#f9f9f9;padding:28px;border-radius:0 0 16px 16px;border:1px solid #eee;border-top:none">',
            '<p style="font-size:16px;margin:0 0 16px">\u0417\u0434\u0440\u0430\u0432\u0435\u0439\u0442\u0435' + (customerName ? ' <strong>' + customerName + '</strong>' : '') + ',</p>',
            '<p style="margin:0 0 12px">\u041F\u043E\u043B\u0443\u0447\u0438\u0445\u043C\u0435 \u0432\u0430\u0448\u0430\u0442\u0430 \u0437\u0430\u044F\u0432\u043A\u0430' + (fields.wizardService ? ' \u0437\u0430 <strong>' + fields.wizardService + '</strong>' : '') + '.</p>',
            '<div style="background:#fff;border-left:4px solid #d4a843;padding:14px 18px;margin:16px 0;border-radius:0 8px 8px 0">',
            '<strong style="color:#d4a843">\u{1F552} \u0429\u0435 \u0441\u0435 \u0441\u0432\u044A\u0440\u0436\u0435\u043C \u0441 \u0432\u0430\u0441 \u0434\u043E 30 \u043C\u0438\u043D\u0443\u0442\u0438</strong><br>',
            '<span style="font-size:13px;color:#666">\u0420\u0430\u0431\u043E\u0442\u043D\u043E \u0432\u0440\u0435\u043C\u0435: 08:30 \u2014 21:00, 7 \u0434\u043D\u0438 \u0432 \u0441\u0435\u0434\u043C\u0438\u0446\u0430\u0442\u0430</span>',
            '</div>',
            '<p style="margin:16px 0 8px">\u0410\u043A\u043E \u0438\u043C\u0430\u0442\u0435 \u0441\u043F\u0435\u0448\u0435\u043D \u0432\u044A\u043F\u0440\u043E\u0441, \u043F\u0438\u0448\u0435\u0442\u0435 \u043D\u0438 \u0434\u0438\u0440\u0435\u043A\u0442\u043D\u043E:</p>',
            '<a href="https://wa.me/4915129893854" style="display:inline-block;background:#25D366;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:bold">\u{1F4AC} WhatsApp</a>',
            '<p style="margin:20px 0 0;font-size:12px;color:#999">\u0422\u043E\u0437\u0438 \u0438\u043C\u0435\u0439\u043B \u0435 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u043D. \u041D\u0435 \u043E\u0442\u0433\u043E\u0432\u0430\u0440\u044F\u0439\u0442\u0435 \u043D\u0430 \u043D\u0435\u0433\u043E \u2014 \u043F\u0438\u0448\u0435\u0442\u0435 \u043D\u0438 \u043D\u0430 WhatsApp \u0438\u043B\u0438 simeonv38@gmail.com</p>',
            '</div>',
            '</div>'
          ].join('\n')
        });
      } catch (replyErr) {
        // Don't fail the main request if auto-reply fails
        console.error('Auto-reply error:', replyErr.message);
      }
    }

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

        var insertRes = await supabase.from('submissions').insert({
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
        }).select('id').single();

        var newId = insertRes && insertRes.data && insertRes.data.id;
        if (newId) {
          // Fire-and-forget AI auto-draft — don't await, don't block response
          autoDraft(supabase, newId).catch(function (e) {
            console.error('autoDraft failed:', e && e.message);
          });
        }
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
