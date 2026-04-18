'use strict';

const { callGoogleAPI } = require('./lib/google-auth');
const { summarizeMessage } = require('./lib/gmail-helpers');
const { requireAdmin, setCORS } = require('./lib/admin-auth');

module.exports = async function handler(req, res) {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }
  if (!requireAdmin(req, res)) return;

  try {
    const src = req.method === 'GET' ? (req.query || {}) : (req.body || {});
    const q = (src.q || '').toString();
    const labelIds = src.labelIds || src.label || '';
    const maxResults = Math.min(parseInt(src.maxResults, 10) || 20, 100);
    const pageToken = src.pageToken || '';
    const account = src.account || undefined;

    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (maxResults) params.set('maxResults', String(maxResults));
    if (pageToken) params.set('pageToken', pageToken);
    if (labelIds) {
      (Array.isArray(labelIds) ? labelIds : String(labelIds).split(',')).forEach(l => {
        if (l) params.append('labelIds', l.trim().toUpperCase());
      });
    }

    // 1. List message IDs
    const listRes = await callGoogleAPI(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?' + params.toString(),
      { method: 'GET' },
      account
    );
    const ids = (listRes.data.messages || []).map(m => m.id);
    const resultSizeEstimate = listRes.data.resultSizeEstimate || 0;
    const nextPageToken = listRes.data.nextPageToken || null;

    if (ids.length === 0) {
      return res.status(200).json({
        ok: true, messages: [], resultSizeEstimate, nextPageToken, account: listRes.email
      });
    }

    // 2. Fetch metadata for each message in parallel (metadata format = headers only)
    const metaFields = 'id,threadId,snippet,internalDate,labelIds,payload/headers';
    const details = await Promise.all(ids.map(async (id) => {
      try {
        const r = await callGoogleAPI(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages/' + id +
            '?format=metadata&fields=' + encodeURIComponent(metaFields) +
            '&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date',
          { method: 'GET' },
          account
        );
        return summarizeMessage(r.data);
      } catch (_) { return null; }
    }));

    return res.status(200).json({
      ok: true,
      messages: details.filter(Boolean),
      resultSizeEstimate,
      nextPageToken,
      account: listRes.email
    });
  } catch (e) {
    console.error('gmail-list error:', e.message);
    return res.status(e.status || 500).json({ ok: false, message: e.message || 'Server error' });
  }
};
