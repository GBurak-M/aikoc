/** Sabit 3D takvim ve saat — tüm sayfalarda sağ kenar */

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const DAYS_TR = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

function pad(n) {
  return String(n).padStart(2, '0');
}

function buildCalendarCells(year, month) {
  const first = new Date(year, month, 1);
  const start = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < start; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function renderClock(root) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const h = pad(now.getHours());
  const min = pad(now.getMinutes());
  const sec = pad(now.getSeconds());

  const cells = buildCalendarCells(y, m);
  const today = d;

  root.innerHTML = `
    <div class="widget-clock-card card-3d">
      <div class="widget-clock-face">
        <div class="widget-time-block">
          <span class="widget-time-h">${h}</span>
          <span class="widget-time-sep">:</span>
          <span class="widget-time-m">${min}</span>
          <span class="widget-time-sep">:</span>
          <span class="widget-time-s">${sec}</span>
        </div>
        <p class="widget-date-line">${d} ${MONTHS_TR[m]} ${y}</p>
      </div>
      <div class="widget-cal-head">${MONTHS_TR[m]} ${y}</div>
      <div class="widget-cal-grid" aria-hidden="true">
        ${DAYS_TR.map((day) => `<span class="widget-cal-dow">${day}</span>`).join('')}
        ${cells
          .map((cell) => {
            if (cell == null) return '<span class="widget-cal-day empty"></span>';
            const cls = cell === today ? 'widget-cal-day today' : 'widget-cal-day';
            return `<span class="${cls}">${cell}</span>`;
          })
          .join('')}
      </div>
    </div>
  `;
}

export function initWidgetClock() {
  const mount = document.getElementById('site-widget-clock');
  if (!mount) return;

  const tick = () => renderClock(mount);
  tick();
  window.setInterval(tick, 1000);
}
