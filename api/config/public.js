import { getSiteUrl, json, handleOptions } from '../../server/lib/auth-utils.js';
import { getGoogleClientId, isGoogleOAuthReady } from '../../server/lib/google-oauth.js';

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

  const hfSpaceUrl = String(process.env.HF_SPACE_URL || 'https://GBurak-rota-ai-chat.hf.space').trim();

  return json(res, 200, {
    googleClientId,
    googleAuthMode,
    siteUrl: getSiteUrl(),
    hfSpaceUrl,
  });
}
