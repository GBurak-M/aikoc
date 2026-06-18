import { getSiteUrl } from './auth-utils.js';

export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || 'ROTA AI <onboarding@resend.dev>';

  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY tanımlı değil' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { ok: false, error: err.slice(0, 300) };
  }
  return { ok: true };
}

export function verificationEmailHtml(name, link) {
  return `
    <div style="font-family:Nunito,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h2 style="color:#00d4ff">ROTA AI</h2>
      <p>Merhaba <strong>${name}</strong>,</p>
      <p>Üyelik kaydını tamamlamak için aşağıdaki bağlantıya tıkla:</p>
      <p><a href="${link}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Hesabımı doğrula</a></p>
      <p style="color:#666;font-size:13px">Bağlantı 24 saat geçerlidir. Bu işlemi sen yapmadıysan bu e-postayı yok say.</p>
    </div>`;
}

export function resetEmailHtml(name, link) {
  return `
    <div style="font-family:Nunito,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h2 style="color:#00d4ff">ROTA AI</h2>
      <p>Merhaba <strong>${name}</strong>,</p>
      <p>Şifreni yenilemek için bağlantıya tıkla:</p>
      <p><a href="${link}" style="display:inline-block;background:#00d4ff;color:#0b1026;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Şifremi yenile</a></p>
      <p style="color:#666;font-size:13px">Bağlantı 2 saat geçerlidir.</p>
    </div>`;
}

export function buildVerifyLink(token) {
  return `${getSiteUrl()}/#/dogrula?token=${encodeURIComponent(token)}`;
}

export function buildResetLink(token) {
  return `${getSiteUrl()}/#/sifre-sifirla?token=${encodeURIComponent(token)}`;
}
