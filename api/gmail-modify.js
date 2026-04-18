'use strict';

// Generic label management: add/remove labels on one message.
// Covers: mark read (remove UNREAD), mark unread (add UNREAD),
// archive (remove INBOX), star (add STARRED), important (add IMPORTANT), etc.

const { callGoogleAPI } = require('./lib/google-auth');
const { requireAdmin, setCORS } = require('./lib/admin-auth');

const ACTION_MAP = {
  read:       { remove: ['UNREAD'] },
  unread:     { add: ['UNREAD'] },
  archive:    { remove: ['INBOX'] },
  inbox:      { add: ['INBOX'] },
  star:       { add: ['STARRED'] },
  unstar:     { remove: ['STARRED'] },
  important:  { add: ['IMPORTANT'] },
  unimportant:{ remove: ['IMPORTANT'] },
  spam:       { add: ['SPAM'], remove: ['INBOX'] },
  unspam:     { remove: ['SPAM'] }
};

module.exports = async function handler(req, res) {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;

  try {
    const { id, ids, addLabels, removeLabels, action, account } = req.body || {};
    const targetIds = Array.isArray(ids) && ids.length ? ids : (id ? [id] : []);
    if (targetIds.length === 0) {
      return res.status(400).json({ ok: false, message: 'id or ids required' });
    }

    let add = Array.isArray(addLabels) ? addLabels.slice() : [];
    let remove = Array.isArray(removeLabels) ? removeLabels.slice() : [];

    if (action) {
      const preset = ACTION_MAP[String(action).toLowerCase()];
      if (!preset) return res.status(400).json({ ok: false, message: 'Unknown action: ' + action });
      if (preset.add) add = add.concat(preset.add);
      if (preset.remove) remove = remove.concat(preset.remove);
    }

    if (add.length === 0 && remove.length === 0) {
      return res.status(400).json({ ok: false, message: 'action or addLabels/removeLabels required' });
    }

    // Batch modify if multiple; single modify otherwise (batch is atomic server-side)
    if (targetIds.length > 1) {
      const r = await callGoogleAPI(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/batchModify',
        {
          method: 'POST',
          body: JSON.stringify({ ids: targetIds, addLabelIds: add, removeLabelIds: remove })
        },
        account
      );
      return res.status(200).json({ ok: true, modified: targetIds.length, account: r.email });
    }

    const r = await callGoogleAPI(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/' + encodeURIComponent(targetIds[0]) + '/modify',
      {
        method: 'POST',
        body: JSON.stringify({ addLabelIds: add, removeLabelIds: remove })
      },
      account
    );
    return res.status(200).json({ ok: true, id: r.data.id, labelIds: r.data.labelIds || [], account: r.email });
  } catch (e) {
    console.error('gmail-modify error:', e.message);
    return res.status(e.status || 500).json({ ok: false, message: e.message || 'Server error' });
  }
};
