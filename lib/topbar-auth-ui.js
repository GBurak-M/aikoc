/** Üst çubuk giriş açılır panelleri */

let openDropdownId = null;

function qs(id) {
  return document.getElementById(id);
}

function closeAllDropdowns() {
  ['topbar-member-dropdown', 'topbar-google-dropdown'].forEach((id) => {
    const el = qs(id);
    const triggerId = id === 'topbar-member-dropdown' ? 'topbar-member-trigger' : 'topbar-google-trigger';
    if (el) el.hidden = true;
    qs(triggerId)?.setAttribute('aria-expanded', 'false');
  });
  openDropdownId = null;
}

function toggleDropdown(dropdownId, triggerId) {
  const dropdown = qs(dropdownId);
  const trigger = qs(triggerId);
  if (!dropdown || !trigger) return;

  const willOpen = dropdown.hidden;
  closeAllDropdowns();

  if (willOpen) {
    dropdown.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    openDropdownId = dropdownId;
    if (dropdownId === 'topbar-google-dropdown') {
      window.dispatchEvent(new CustomEvent('aikoc:open-google-auth'));
    }
  }
}

export function updateMemberTriggerLabel(user) {
  const label = qs('topbar-member-trigger-label');
  if (!label) return;
  label.textContent = user?.name || user?.email || 'Site üyeliği';
}

export function updateGoogleTriggerLabel(user) {
  const label = qs('topbar-google-trigger-label');
  if (!label) return;
  label.textContent = user?.name || user?.email || 'Google AI';
}

export function initTopbarAuthUI() {
  qs('topbar-member-trigger')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown('topbar-member-dropdown', 'topbar-member-trigger');
  });

  qs('topbar-google-trigger')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown('topbar-google-dropdown', 'topbar-google-trigger');
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
