import { getSiteUrl, json, handleOptions } from '../lib/auth-utils.js';
import { getGoogleClientId, isGoogleOAuthReady } from '../lib/google-oauth.js';

/** Herkese açık site yapılandırması (OAuth istemci kimliği gizli değildir). */
export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'GET') return json(res, 405, { error: 'Yalnızca GET' });

  const googleClientId = getGoogleClientId();
  const googleAuthMode = isGoogleOAuthReady()
    ? 'redirect'
    : googleClientId.length > 10
      ? 'button'
      : 'none';

  return json(res, 200, {
    googleClientId,
    googleAuthMode,
    siteUrl: getSiteUrl(),
  });
}
