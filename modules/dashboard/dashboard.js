import { getCurrentUser } from '../../lib/sidebar-auth.js';
import { isGoogleSignedIn } from '../../lib/google-auth.js';
import { renderDashboardStats } from '../../lib/page-stats.js';

export async function init() {
  const member = getCurrentUser();
  const greeting = document.getElementById('dash-greeting');
  if (greeting) {
    if (member?.name) {
      greeting.textContent = `Merhaba ${member.name}! Bugün hangi rotada ilerleyelim?`;
    } else if (isGoogleSignedIn()) {
      greeting.textContent = 'AI koçun hazır — site üyeliği için kenar çubuktan kayıt olabilirsin.';
    } else {
      greeting.textContent = 'ROTA AI\'ye hoş geldin — site üyeliği ve AI için ayrı girişler kullanılır.';
    }
  }

  renderDashboardStats();

  const tips = [
    'Günde 25 dakika tek derse odaklan; ardından 5 dakika mola ver.',
    'Yanlış yaptığın soruları konu başlığıyla kaydet; hafta sonu tekrar et.',
    'Kütüphaneden sınıfına uygun ders kitabını sitede doğrudan okuyabilirsin.',
  ];
  const tipEl = document.getElementById('dash-tip');
  if (tipEl) {
    tipEl.innerHTML = `<strong>Günün ipucu</strong><p>${tips[Math.floor(Math.random() * tips.length)]}</p>`;
  }
}
