const path = require('path');

// Control chars incl. NUL. Keep it strict and cross-platform.
const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F]/g;

function toSafeBasename(input, fallback = 'file', opts = {}) {
  const maxLength = Number.isInteger(opts.maxLength) ? opts.maxLength : 255;

  let name = '';
  if (typeof input === 'string') name = input;
  else if (input == null) name = '';
  else name = String(input);

  // Remove NUL/control chars early (these can truncate paths in some tooling).
  name = name.replace(CONTROL_CHARS_RE, '');

  // Normalize separators to POSIX then force basename (flat archives).
  name = name.replace(/\\/g, '/');
  name = path.posix.basename(name);

  // Trim to avoid whitespace-only names; keep the caller’s original if they need strict equality.
  name = name.trim();

  // Disallow dot/dotdot and empty.
  if (!name || name === '.' || name === '..') name = '';

  // Length cap.
  if (name.length > maxLength) name = name.slice(0, maxLength);

  if (!name) {
    const fb = (fallback == null ? '' : String(fallback)).replace(CONTROL_CHARS_RE, '').trim();
    return fb ? fb.slice(0, maxLength) : 'file';
  }

  return name;
}

function isSafeBasename(name, opts = {}) {
  if (typeof name !== 'string') return false;
  return toSafeBasename(name, '', opts) === name;
}

// Node randomUUID() v4 shape (case-insensitive).
const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Tus resume URL id: exactly one "++", safe bucket sid, UUID key.
 */
function isSafeTusUploadId(uploadId) {
  if (typeof uploadId !== 'string' || uploadId.includes('\0')) return false;
  const parts = uploadId.split('++');
  if (parts.length !== 2) return false;
  const [sid, key] = parts;
  if (!sid || !key) return false;
  return isSafeBasename(sid) && UUID_V4_RE.test(key);
}

/**
 * Bucket-only id (lock PATCH, middleware checks without "++").
 */
function isSafeBucketFid(fid) {
  if (typeof fid !== 'string' || fid.includes('++') || fid.includes('\0')) return false;
  return isSafeBasename(fid);
}

const MAX_PATH_SEGMENTS = 15;
const MAX_PATH_LENGTH = 1024;

/**
 * Validates a folder-only relative path (no filename) carried alongside an
 * uploaded file so its original folder structure can be reconstructed in
 * zip/tar downloads. '' means "no folder" (root of the share) and is valid.
 * Each path segment must independently be a safe basename (no '..', no
 * separators, no control chars) - this is the traversal/ZipSlip guard.
 */
function isSafeRelativePath(value) {
  if (value === '' || value == null) return true;
  if (typeof value !== 'string') return false;
  if (value.includes('\0')) return false;
  if (value.length > MAX_PATH_LENGTH) return false;
  if (value.startsWith('/') || value.startsWith('\\')) return false;

  const segments = value.replace(/\\/g, '/').split('/');
  if (segments.length > MAX_PATH_SEGMENTS) return false;

  return segments.every(segment =>
    segment !== '' && segment !== '.' && segment !== '..' && isSafeBasename(segment)
  );
}

module.exports = {
  toSafeBasename,
  isSafeBasename,
  isSafeTusUploadId,
  isSafeBucketFid,
  isSafeRelativePath,
  UUID_V4_RE,
};


