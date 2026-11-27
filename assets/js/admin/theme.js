const storageKey = 'xukuru_admin_theme';
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
let preference;
try { preference = localStorage.getItem(storageKey); } catch { /* Storage may be unavailable. */ }
if (!['light', 'dark'].includes(preference)) preference = null;

function applyTheme(theme) {
  const dark = theme === 'dark';
  document.documentElement.dataset.adminTheme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#101a16' : '#1F3E2B');
  document.querySelectorAll('[data-admin-theme-toggle]').forEach(button => {
    button.setAttribute('aria-pressed', String(dark));
    button.title = dark ? 'Ativar tema claro' : 'Ativar tema escuro';
  });
}

export function themeToggleMarkup() {
  const dark = document.documentElement.dataset.adminTheme === 'dark';
  return `<button type="button" class="admin-theme-toggle" data-admin-theme-toggle aria-label="Modo escuro" aria-pressed="${dark}" title="${dark ? 'Ativar tema claro' : 'Ativar tema escuro'}">
    <svg class="theme-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z" stroke-linejoin="round"/></svg>
    <svg class="theme-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" stroke-linecap="round"/></svg>
    <b class="theme-label-dark">Tema escuro</b><b class="theme-label-light">Tema claro</b>
  </button>`;
}

document.addEventListener('click', event => {
  if (!event.target.closest('[data-admin-theme-toggle]')) return;
  preference = document.documentElement.dataset.adminTheme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem(storageKey, preference); } catch { /* Keep the choice for this session. */ }
  applyTheme(preference);
});
systemTheme.addEventListener('change', event => {
  if (!preference) applyTheme(event.matches ? 'dark' : 'light');
});
window.addEventListener('storage', event => {
  if (event.key !== storageKey && event.key !== null) return;
  preference = ['light', 'dark'].includes(event.newValue) ? event.newValue : null;
  applyTheme(preference || (systemTheme.matches ? 'dark' : 'light'));
});
applyTheme(preference || (systemTheme.matches ? 'dark' : 'light'));
