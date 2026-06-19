import { getCurrentUser } from '../../lib/sidebar-auth.js';
import { renderDashboardStats } from '../../lib/page-stats.js';

export async function init() {
  const member = getCurrentUser();
  const greeting = document.getElementById('dash-greeting');
  if (greeting) {
    if (member?.name) {
      greeting.textContent = `Merhaba ${member.name}! Bugün hangi rotada ilerleyelim?`;
    } else {
      greeting.textContent =
        'ROTA AI\'ye hoş geldin — dersler, sınavlar ve AI için bir kez demo dene; devamı için üye ol.';
    }
  }

  renderDashboardStats();

  const refreshStats = () => renderDashboardStats();
  window.addEventListener('aikoc:session', refreshStats);
  window.addEventListener('aikoc:session-merged', refreshStats);

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
