const focusable = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
let activeDialog = null;
let returnFocus = null;
let background = [];
let previousOverflow = '';

export function announce(message) {
  const status = document.getElementById('accessibility-status');
  if (status) status.textContent = message;
}

export function openAccessibleDialog(dialog) {
  if (activeDialog) closeAccessibleDialog(activeDialog);
  returnFocus = document.activeElement;
  activeDialog = dialog;
  previousOverflow = document.body.style.overflow;
  dialog.hidden = false;
  dialog.classList.add('open');
  dialog.tabIndex = -1;
  background = [...document.body.children]
    .filter(node => node !== dialog && !['SCRIPT', 'STYLE', 'LINK'].includes(node.tagName) && !node.matches('[role="status"]'))
    .map(node => ({ node, inert: node.inert }));
  background.forEach(({ node }) => { node.inert = true; });
  document.body.style.overflow = 'hidden';
  (dialog.querySelector(focusable) || dialog).focus({ preventScroll: true });
}

export function closeAccessibleDialog(dialog) {
  if (!dialog || activeDialog !== dialog) return;
  dialog.classList.remove('open');
  dialog.hidden = true;
  background.forEach(({ node, inert }) => { node.inert = inert; });
  background = [];
  document.body.style.overflow = previousOverflow;
  activeDialog = null;
  if (returnFocus?.isConnected && !returnFocus.closest('[hidden],[inert]')) returnFocus.focus({ preventScroll: true });
  returnFocus = null;
}

document.addEventListener('keydown', event => {
  if (!activeDialog || event.key !== 'Tab') return;
  const targets = [...activeDialog.querySelectorAll(focusable)].filter(node => node.getClientRects().length && !node.closest('[hidden],[inert]'));
  const first = targets[0], last = targets.at(-1);
  if (!first) { event.preventDefault(); activeDialog.focus(); return; }
  if (event.shiftKey && (document.activeElement === first || document.activeElement === activeDialog)) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === activeDialog)) {
    event.preventDefault(); first.focus();
  }
});
document.addEventListener('focusin', event => {
  if (activeDialog && !activeDialog.contains(event.target)) (activeDialog.querySelector(focusable) || activeDialog).focus();
});

export function retainCartFocus(button, update) {
  const container = document.getElementById('cart-page-items-list');
  const buttons = [...container.querySelectorAll('button')];
  const index = buttons.indexOf(button);
  const key = ['data-cart-incr', 'data-cart-decr', 'data-cart-remove'].find(key => button.hasAttribute(key));
  const id = key && button.getAttribute(key);
  update();
  const remaining = [...container.querySelectorAll('button')];
  const same = remaining.find(node => key && node.getAttribute(key) === id);
  (same || remaining[Math.min(index, remaining.length - 1)] || document.querySelector('#page-cart h1'))?.focus({ preventScroll: true });
}

const preferenceKey = 'xukuru_reading_preferences';
let preferences = {};
try { preferences = JSON.parse(localStorage.getItem(preferenceKey) || '{}') || {}; } catch { /* Use defaults. */ }
if (typeof preferences !== 'object' || Array.isArray(preferences)) preferences = {};
const options = { contrast: 'highContrast', text: 'largeText', motion: 'reduceMotion' };
for (const [name, attribute] of Object.entries(options)) {
  const input = document.querySelector(`[data-reading-option="${name}"]`);
  if (!input) continue;
  input.checked = preferences[name] === true;
  document.documentElement.dataset[attribute] = String(input.checked);
  input.addEventListener('change', () => {
    preferences[name] = input.checked;
    document.documentElement.dataset[attribute] = String(input.checked);
    try { localStorage.setItem(preferenceKey, JSON.stringify(preferences)); } catch { /* Session preference still works. */ }
  });
}
document.getElementById('skip-content')?.addEventListener('click', event => {
  const main = [...document.querySelectorAll('main.page-section')].find(node => !node.hidden && getComputedStyle(node).display !== 'none');
  if (!main) return;
  event.preventDefault();
  const target = main.querySelector('h1') || main;
  target.tabIndex = -1;
  target.focus();
  target.scrollIntoView({ block: 'start', behavior: 'instant' });
});

document.getElementById('nav-accessibility')?.addEventListener('click', event => {
  const preferences = document.getElementById('reading-preferences');
  if (!preferences) return;
  event.preventDefault();
  document.getElementById('nav-links')?.classList.remove('mobile-open');
  const menu = document.getElementById('mobile-menu-btn');
  menu?.setAttribute('aria-expanded', 'false');
  menu?.setAttribute('aria-label', 'Abrir menu');
  preferences.open = true;
  preferences.querySelector('summary')?.focus({ preventScroll: true });
  preferences.scrollIntoView({ block: 'start', behavior: 'instant' });
});
