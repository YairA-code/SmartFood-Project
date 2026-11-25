// ============================================================
// Tavitly — התקנה למסך הבית (PWA)
// Service Worker שומר את האתר במכשיר, ובטלפון מופיעה הצעה להוסיף
// את Tavitly למסך הבית, כך שייפתח במסך מלא ישר לסורק.
// ============================================================

const KEY = 'smart-food-install-dismissed';
const DAYS = 21;

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol !== 'https:' && location.hostname !== 'localhost') return;
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}

const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isPhone = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));

function dismissedRecently() {
  try { const t = Number(localStorage.getItem(KEY)); return t && Date.now() - t < DAYS * 864e5; } catch (e) { return false; }
}

function banner(html, onInstall) {
  if (document.getElementById('install-banner')) return;
  const el = document.createElement('div');
  el.id = 'install-banner'; el.className = 'install-banner'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'הוספה למסך הבית');
  el.innerHTML = `
    <img src="img/icon-192.png" alt="" width="44" height="44">
    <div class="install-text">${html}</div>
    <div class="install-actions">
      ${onInstall ? '<button class="btn btn-primary btn-sm" id="install-go">התקנה</button>' : ''}
      <button class="btn btn-ghost btn-sm" id="install-close" aria-label="סגירה">לא עכשיו</button>
    </div>`;
  document.body.appendChild(el);
  const close = () => { el.remove(); try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} };
  el.querySelector('#install-close').addEventListener('click', close);
  el.querySelector('#install-go')?.addEventListener('click', async () => { await onInstall(); close(); });
}

export function initInstallPrompt() {
  if (standalone() || !isPhone() || dismissedRecently()) return;
  let deferred = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferred = e;
    setTimeout(() => banner('<strong>Tavitly במסך הבית</strong><span>נפתח במסך מלא, ישר לסורק הברקודים. בלי חנות אפליקציות.</span>',
      async () => { deferred.prompt(); await deferred.userChoice.catch(() => {}); deferred = null; }), 4000);
  });
  if (isIOS()) {
    setTimeout(() => banner('<strong>Tavitly במסך הבית</strong><span>לחצו על כפתור השיתוף <b aria-label="שיתוף">⬆︎</b> ואז על „הוספה למסך הבית”. האתר ייפתח במסך מלא, ישר לסורק.</span>'), 6000);
  }
}
