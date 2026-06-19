/** Üst çubuk üye girişi açılır paneli */

let openDropdownId = null;

function qs(id) {
  return document.getElementById(id);
}

function closeAllDropdowns() {
  const el = qs('topbar-member-dropdown');
  if (el) el.hidden = true;
  qs('topbar-member-trigger')?.setAttribute('aria-expanded', 'false');
  openDropdownId = null;
}

function toggleDropdown() {
  const dropdown = qs('topbar-member-dropdown');
  const trigger = qs('topbar-member-trigger');
  if (!dropdown || !trigger) return;

  const willOpen = dropdown.hidden;
  closeAllDropdowns();

  if (willOpen) {
    dropdown.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    openDropdownId = 'topbar-member-dropdown';
  }
}

export function updateMemberTriggerLabel(user) {
  const label = qs('topbar-member-trigger-label');
  if (!label) return;
  label.textContent = user?.name || user?.email || 'Üye girişi';
}

export function initTopbarAuthUI() {
  qs('topbar-member-trigger')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  document.addEventListener('click', (e) => {
    if (!openDropdownId) return;
    const cluster = document.querySelector('.topbar-auth-cluster');
    if (cluster?.contains(e.target)) return;
    closeAllDropdowns();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllDropdowns();
  });
}
