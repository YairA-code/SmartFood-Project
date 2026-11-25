// ============================================================
// Tavitly — המאגר המורחב
// כל מוצרי המזון מקובצי המחירים שהרשתות מפרסמות לפי חוק (שם, יצרן,
// ברקוד), ולחלקם רשימת רכיבים בעברית מהמאגר הפתוח Open Food Facts
// (רישיון ODbL). הנתונים מחולקים לקבצים קטנים לפי שתי הספרות האחרונות של
// הברקוד, כך שסריקה טוענת רק קובץ אחד. רשימת השמות לחיפוש נטענת רק
// כשמחפשים. הניתוח של המוצרים האלה אוטומטי ולא נבדק ידנית.
// ============================================================

const BASE = 'data/catalog/';
const shards = new Map();
let names = null, namesLoading = null, meta = null;

const norm = code => String(code || '').replace(/\D/g, '').replace(/^0+/, '');

async function getJSON(path) {
  const res = await fetch(BASE + path, { credentials: 'omit' });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

export async function lookupCatalog(code) {
  const c = norm(code);
  if (c.length < 7) return null;
  const key = c.slice(-2);
  try {
    if (!shards.has(key)) shards.set(key, await getJSON(`c-${key}.json`));
    return shards.get(key).find(e => e.c === c) || null;
  } catch (e) { return null; }
}

function loadNames() {
  if (names) return Promise.resolve(names);
  if (!namesLoading) namesLoading = getJSON('names.json').then(d => (names = d)).catch(() => { namesLoading = null; return []; });
  return namesLoading;
}

// חיפוש לפי שם או יצרן: כל המילים שהוקלדו צריכות להופיע
export async function searchCatalog(query, limit = 8) {
  const words = String(query).trim().toLowerCase().split(/\s+/).filter(w => w.length > 1);
  if (!words.length) return [];
  const list = await loadNames();
  const out = [];
  for (const [c, n, b, hasIng] of list) {
    const hay = (n + ' ' + b).toLowerCase();
    if (words.every(w => hay.includes(w))) { out.push({ c, n, b, hasIng: !!hasIng }); if (out.length >= limit * 3) break; }
  }
  return out.sort((a, b) => b.hasIng - a.hasIng).slice(0, limit);
}

export async function catalogMeta() {
  if (meta) return meta;
  try { meta = await getJSON('meta.json'); } catch (e) { meta = null; }
  return meta;
}
