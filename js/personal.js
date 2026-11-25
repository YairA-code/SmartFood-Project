// ============================================================
// Smart Food — העדפות אישיות והיסטוריית סריקות
// הכול נשמר רק בדפדפן של המשתמש (localStorage) ולא נשלח לשום מקום.
// ההעדפות הן העדפות תזונה ולא כלי לאלרגיות: לאלרגיה בודקים תמיד את
// התווית ואת סימון האלרגנים שעל האריזה.
// ============================================================

import { collectTerms } from './verdict.js?v=39';

const PREFS_KEY = 'smart-food-avoid';
const HIST_KEY = 'smart-food-history';
const HIST_MAX = 20;

const byType = re => terms => terms.filter(t => re.test(t.type || '')).length > 0;
const byName = re => terms => terms.filter(t => re.test(t.name || '')).length > 0;

export const AVOID = [
  { id: 'nova4', label: 'מזון אולטרה-מעובד (NOVA 4)', test: (t, items, nova) => nova && nova.group === 4 },
  { id: 'sweeteners', label: 'ממתיקים מלאכותיים', test: byType(/ממתיק מלאכותי/) },
  { id: 'colors', label: 'צבעי מאכל', test: byType(/צבע/) },
  { id: 'enhancers', label: 'מחזקי טעם (כמו מונוסודיום גלוטמט)', test: byType(/מחזק טעם/) },
  { id: 'preservatives', label: 'חומרים משמרים', test: byType(/משמר/) },
  { id: 'nitrite', label: 'ניטריט ונייטרט (בבשר מעובד)', test: byName(/ניטריט|ניטראט/) },
  { id: 'flavors', label: 'חומרי טעם וריח', test: byName(/^חומרי טעם וריח$/) },
  { id: 'palm', label: 'שמן דקלים', test: (t, items) => items.some(i => /דקל/.test(i.name || i.key || '')) || byName(/דקל/)(t) },
  { id: 'hydro', label: 'שומן מוקשה', test: byType(/מוקשה/) },
  { id: 'sugar_first', label: 'סוכר כרכיב הראשון', test: (t, items) => /^(סוכר|סירופ|גלוקוז)/.test((items[0] && (items[0].name || items[0].key)) || '') },
];

function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (e) { return fallback; } }
function write(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }

export const getAvoid = () => read(PREFS_KEY, []).filter(id => AVOID.some(a => a.id === id));
export const setAvoid = ids => write(PREFS_KEY, ids);

// מה מהרשימה האישית יש במוצר
export function avoidHits(items, nova) {
  const chosen = getAvoid();
  if (!chosen.length) return null;
  const terms = collectTerms(items);
  return AVOID.filter(a => chosen.includes(a.id) && a.test(terms, items, nova)).map(a => a.label);
}

export function avoidHTML(items, nova) {
  const hits = avoidHits(items, nova);
  if (!hits) return `<a class="prefs-hint" href="#/prefs">⚙️ הגדירו מה אתם מעדיפים להימנע ממנו, ונסמן לכם את זה בכל מוצר</a>`;
  return hits.length
    ? `<p class="prefs-hit"><span aria-hidden="true">⚠️</span> <strong>לא מתאים להעדפות שלכם:</strong> ${hits.join(', ')}</p>`
    : `<p class="prefs-ok"><span aria-hidden="true">✓</span> <strong>מתאים להעדפות שלכם</strong>, לפי רשימת הרכיבים</p>`;
}

// ——— היסטוריית סריקות ———
export const getHistory = () => read(HIST_KEY, []);
export function addHistory(entry) {
  const list = getHistory().filter(h => h.code !== entry.code);
  list.unshift({ ...entry, at: Date.now() });
  write(HIST_KEY, list.slice(0, HIST_MAX));
}
export const clearHistory = () => write(HIST_KEY, []);

// ——— דף ההעדפות ———
export function renderPrefs(breadcrumb) {
  const chosen = getAvoid();
  return `
    <main class="page" id="page-content">
      ${breadcrumb([['כלים', '#/tools'], ['ההעדפות שלי']])}
      <section class="page-hero compact">
        <span class="page-hero-icon" aria-hidden="true">⚙️</span>
        <h1>ההעדפות שלי</h1>
        <p>סמנו ממה אתם מעדיפים להימנע. בכל מוצר שתסרקו נראה לכם מיד אם הוא מתאים.</p>
      </section>
      <div class="container narrow">
        <form class="prefs-box" id="prefs-form">
          <fieldset>
            <legend class="label-title">אני מעדיף/ה להימנע מ:</legend>
            ${AVOID.map(a => `
              <label class="prefs-item"><input type="checkbox" name="avoid" value="${a.id}" ${chosen.includes(a.id) ? 'checked' : ''}> ${a.label}</label>`).join('')}
          </fieldset>
          <p class="prefs-saved" id="prefs-saved" role="status" aria-live="polite"></p>
        </form>
        <p class="muted small">ההעדפות נשמרות רק בדפדפן שלכם. הבדיקה נעשית לפי רשימת הרכיבים בלבד, ולכן היא לא מתאימה לאלרגיות: מי שיש לו אלרגיה צריך לבדוק תמיד את סימון האלרגנים שעל האריזה.</p>
      </div>
    </main>`;
}

export function initPrefs() {
  const form = document.getElementById('prefs-form');
  if (!form) return;
  const out = document.getElementById('prefs-saved');
  form.addEventListener('change', () => {
    setAvoid([...form.querySelectorAll('input[name=avoid]:checked')].map(i => i.value));
    out.textContent = '✓ נשמר';
    setTimeout(() => { out.textContent = ''; }, 1500);
  });
}

// ——— סריקות אחרונות (בדף הסריקה) ———
export function historyHTML(escapeHtml) {
  const list = getHistory();
  if (!list.length) return '';
  return `
    <section class="history" id="history">
      <div class="history-head"><h2 class="label-title">סרקתם לאחרונה</h2><button class="btn btn-ghost btn-sm" id="history-clear">ניקוי</button></div>
      <ul class="history-list">
        ${list.slice(0, 10).map(h => `
          <li><a href="${h.id ? `#/product/${encodeURIComponent(h.id)}` : `#/barcode/${encodeURIComponent(h.code)}`}">
            <span class="history-name">${escapeHtml(h.name || 'מוצר ללא שם')}</span>
            ${h.nova ? `<span class="history-nova nova-${h.nova}">NOVA ${h.nova}</span>` : ''}
          </a></li>`).join('')}
      </ul>
    </section>`;
}
