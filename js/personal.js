// ============================================================
// Tavitly — העדפות אישיות והיסטוריית סריקות
// הכול נשמר רק בדפדפן של המשתמש (localStorage) ולא נשלח לשום מקום.
// ההעדפות הן העדפות תזונה ולא כלי לאלרגיות: לאלרגיה בודקים תמיד את
// התווית ואת סימון האלרגנים שעל האריזה.
// ============================================================

import { collectTerms } from './verdict.js?v=44';
import { tr } from './i18n.js?v=44';
import { products } from './data.js?v=44';

const PREFS_KEY = 'smart-food-avoid';
const HIST_KEY = 'smart-food-history';
const HIST_MAX = 20;

const byType = re => terms => terms.filter(t => re.test(t.type || '')).length > 0;
const byName = re => terms => terms.filter(t => re.test(t.heName || t.name || '')).length > 0;

export const AVOID = [
  { id: 'nova4', label: tr('מזון אולטרה-מעובד (NOVA 4)', 'Ultra-processed foods (NOVA 4)'), test: (t, items, nova) => nova && nova.group === 4 },
  { id: 'sweeteners', label: tr('ממתיקים מלאכותיים', 'Artificial sweeteners'), test: byType(/ממתיק מלאכותי/) },
  { id: 'colors', label: tr('צבעי מאכל', 'Food colorings'), test: byType(/צבע/) },
  { id: 'enhancers', label: tr('מחזקי טעם (כמו מונוסודיום גלוטמט)', 'Flavor enhancers (such as MSG)'), test: byType(/מחזק טעם/) },
  { id: 'preservatives', label: tr('חומרים משמרים', 'Preservatives'), test: byType(/משמר/) },
  { id: 'nitrite', label: tr('ניטריט ונייטרט (בבשר מעובד)', 'Nitrite and nitrate (in processed meat)'), test: byName(/ניטריט|ניטראט/) },
  { id: 'flavors', label: tr('חומרי טעם וריח', 'Flavorings'), test: byName(/^חומרי טעם וריח$/) },
  { id: 'palm', label: tr('שמן דקלים', 'Palm oil'), test: (t, items) => items.some(i => /דקל/.test(i.name || i.key || '')) || byName(/דקל/)(t) },
  { id: 'hydro', label: tr('שומן מוקשה', 'Hydrogenated fat'), test: byType(/מוקשה/) },
  { id: 'sugar_first', label: tr('סוכר כרכיב הראשון', 'Sugar as the first ingredient'), test: (t, items) => /^(סוכר|סירופ|גלוקוז)/.test((items[0] && (items[0].name || items[0].key)) || '') },
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
  if (!hits) return `<a class="prefs-hint" href="#/prefs">⚙️ ${tr('הגדירו מה אתם מעדיפים להימנע ממנו, ונסמן לכם את זה בכל מוצר', 'Set what you prefer to avoid, and we’ll flag it on every product')}</a>`;
  return hits.length
    ? `<p class="prefs-hit"><span aria-hidden="true">⚠️</span> <strong>${tr('לא מתאים להעדפות שלכם:', 'Doesn’t match your preferences:')}</strong> ${hits.join(', ')}</p>`
    : `<p class="prefs-ok"><span aria-hidden="true">✓</span> <strong>${tr('מתאים להעדפות שלכם', 'Matches your preferences')}</strong>${tr(', לפי רשימת הרכיבים', ', based on the ingredient list')}</p>`;
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
      ${breadcrumb([[tr('כלים', 'Tools'), '#/tools'], [tr('ההעדפות שלי', 'My preferences')]])}
      <section class="page-hero compact">
        <span class="page-hero-icon" aria-hidden="true">⚙️</span>
        <h1>${tr('ההעדפות שלי', 'My preferences')}</h1>
        <p>${tr('סמנו ממה אתם מעדיפים להימנע. בכל מוצר שתסרקו נראה לכם מיד אם הוא מתאים.', 'Check what you prefer to avoid. For every product you scan, we’ll show right away whether it fits.')}</p>
      </section>
      <div class="container narrow">
        <form class="prefs-box" id="prefs-form">
          <fieldset>
            <legend class="label-title">${tr('אני מעדיף/ה להימנע מ:', 'I prefer to avoid:')}</legend>
            ${AVOID.map(a => `
              <label class="prefs-item"><input type="checkbox" name="avoid" value="${a.id}" ${chosen.includes(a.id) ? 'checked' : ''}> ${a.label}</label>`).join('')}
          </fieldset>
          <p class="prefs-saved" id="prefs-saved" role="status" aria-live="polite"></p>
        </form>
        <p class="muted small">${tr('ההעדפות נשמרות רק בדפדפן שלכם. הבדיקה נעשית לפי רשימת הרכיבים בלבד, ולכן היא לא מתאימה לאלרגיות: מי שיש לו אלרגיה צריך לבדוק תמיד את סימון האלרגנים שעל האריזה.', 'Your preferences are saved only in your browser. The check is based on the ingredient list alone, so it is not suitable for allergies: if you have an allergy, always check the allergen labeling on the package.')}</p>
      </div>
    </main>`;
}

export function initPrefs() {
  const form = document.getElementById('prefs-form');
  if (!form) return;
  const out = document.getElementById('prefs-saved');
  form.addEventListener('change', () => {
    setAvoid([...form.querySelectorAll('input[name=avoid]:checked')].map(i => i.value));
    out.textContent = tr('✓ נשמר', '✓ Saved');
    setTimeout(() => { out.textContent = ''; }, 1500);
  });
}

// ——— סריקות אחרונות (בדף הסריקה) ———
export function historyHTML(escapeHtml) {
  const list = getHistory();
  if (!list.length) return '';
  return `
    <section class="history" id="history">
      <div class="history-head"><h2 class="label-title">${tr('סרקתם לאחרונה', 'Recently scanned')}</h2><button class="btn btn-ghost btn-sm" id="history-clear">${tr('ניקוי', 'Clear')}</button></div>
      <ul class="history-list">
        ${list.slice(0, 10).map(h => `
          <li><a href="${h.id ? `#/product/${encodeURIComponent(h.id)}` : `#/barcode/${encodeURIComponent(h.code)}`}">
            <span class="history-name">${escapeHtml((h.id && products.find(p => p.id === h.id)?.name) || h.name || tr('מוצר ללא שם', 'Unnamed product'))}</span>
            ${h.nova ? `<span class="history-nova nova-${h.nova}">NOVA ${h.nova}</span>` : ''}
          </a></li>`).join('')}
      </ul>
    </section>`;
}
