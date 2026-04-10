/**
 * LivePK — Agora Token Service
 * Generates RTC tokens for live streaming
 */

const { RtcTokenBuilder, RtcRole } = require('agora-token');

// ── Token expiry: 24 hours ──
const TOKEN_EXPIRY = 24 * 3600;

/**
 * Generate Agora RTC token for a user joining a channel
 * @param {string} channelName - Stream channel name
 * @param {string|number} uid - User ID (0 for any)
 * @param {string} role - 'publisher' (host) or 'subscriber' (viewer)
 */
exports.generateToken = (channelName, uid = 0, role = 'subscriber') => {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    throw new Error('Agora credentials not configured. Add AGORA_APP_ID and AGORA_APP_CERTIFICATE to .env');
  }

  const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
  const expirationTime = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY;
  const privilegeExpireTime = expirationTime;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId, appCertificate, channelName,
    uid, rtcRole, expirationTime, privilegeExpireTime
  );

  return token;
};

/**
 * Generate channel name from stream ID
 */
exports.getChannelName = (streamId) => {
  return `livepk_${streamId}`;
};
