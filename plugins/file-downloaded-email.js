const debug = require('debug')('psitransfer:plugin:file-downloaded-email');
const { spawn } = require('child_process');

const SENDMAIL_BIN = '/usr/sbin/sendmail';
// reject anything with whitespace/newlines/angle-brackets (header injection)
const EMAIL_RE = /^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/i;

function formatCET(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Amsterdam',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
  return `${ parts.day }-${ parts.month }-${ parts.year } ${ parts.hour }:${ parts.minute }:${ parts.second } CET`;
}

module.exports = function setupFileDownloadedEmail(eventBus, app, config, db) {
  debug('Setup plugin');

  const FROM_ADDRESS = config.notifyFromAddress || 'noreply@example.com';

  // in-process dedup so two near-simultaneous downloads of the same share
  // can't both slip past the on-disk "notified" check before either persists it
  const claimedInMemory = new Set();

  async function notifyDownload({ sid, file, metadata }) {
    const to = metadata && metadata.notifyEmail;
    if (!to || !EMAIL_RE.test(to)) return;
    if (claimedInMemory.has(sid)) return;

    const bucket = db.get(sid);
    if (!bucket || bucket.some(item => item.metadata && item.metadata.notified)) {
      claimedInMemory.add(sid);
      return;
    }
    claimedInMemory.add(sid); // claim before any async work, to close the race

    const safeFile = String(file || 'your file').replace(/[\r\n]/g, ' ');
    const message =
      `From: ${ FROM_ADDRESS }\r\n` +
      `To: ${ to }\r\n` +
      `Subject: Your PsiTransfer file was downloaded\r\n` +
      `Content-Type: text/plain; charset=utf-8\r\n` +
      `\r\n` +
      `"${ safeFile }" (share ${ sid }) was downloaded on ${ formatCET(new Date()) }.\r\n` +
      `This is a one-time notification — further downloads of this share will not trigger another email.\r\n`;

    const proc = spawn(SENDMAIL_BIN, ['-t', '-i', '-f', FROM_ADDRESS], { stdio: ['pipe', 'ignore', 'ignore'] });
    proc.on('error', err => console.error('[file-downloaded-email] sendmail spawn failed:', err));
    proc.stdin.on('error', () => {}); // avoid crash if sendmail exits before stdin is fully written
    proc.stdin.end(message);
    debug(`Notification email queued for ${ to } (sid=${ sid })`);

    try {
      await Promise.all(bucket.map(item => db.updateMetadata(sid, item.key, { notified: true })));
    } catch (e) {
      console.error('[file-downloaded-email] failed to persist notified flag:', e);
    }
  }

  eventBus.on('fileDownloaded', notifyDownload);
  eventBus.on('archiveDownloaded', notifyDownload);
};
