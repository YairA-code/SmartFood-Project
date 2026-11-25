// ============================================================
// Tavitly — קריאת רשימת הרכיבים מתמונה (OCR) ומוצרים שהמשתמש הוסיף
// הזיהוי רץ בדפדפן בעזרת Tesseract (Apache-2.0), שמאוחסן באתר עצמו.
// התמונה לא נשלחת לשום שרת. התוצאה נשמרת רק במכשיר (localStorage),
// כדי שבסריקה הבאה של אותו ברקוד התשובה תופיע מיד.
// ============================================================

const dir = () => new URL('js/vendor/tesseract/', document.baseURI).href;
const STORE = 'smart-food-my-labels';
export const PIONEER_AT = 5;

let loading = null;
function loadEngine() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = dir() + 'tesseract.min.js';
    s.onload = () => resolve(window.Tesseract);
    s.onerror = () => { loading = null; reject(new Error('engine')); };
    document.head.appendChild(s);
  });
  return loading;
}

// הקטנה, גווני אפור וחידוד ניגודיות. תווית קטנה מצולמת בטלפון נקראת טוב יותר כך
async function prepare(file) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 2200 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  const img = ctx.getImageData(0, 0, c.width, c.height); const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const v = Math.max(0, Math.min(255, (g - 128) * 1.35 + 128));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

export async function readLabel(file, onProgress = () => {}) {
  const T = await loadEngine();
  const worker = await T.createWorker('heb', 1, {
    workerPath: dir() + 'worker.min.js', corePath: dir(), langPath: dir(), workerBlobURL: false, gzip: true,
    logger: m => { if (m.status === 'recognizing text') onProgress(m.progress); },
  });
  try {
    const { data } = await worker.recognize(await prepare(file));
    return ingredientsPart(data.text || '');
  } finally { worker.terminate(); }
}

// רק החלק של רשימת הרכיבים: מהמילה "רכיבים" ועד הסימון התזונתי או האלרגנים
export function ingredientsPart(text) {
  let t = String(text).replace(/\r/g, '').replace(/[|_~^]/g, ' ');
  const start = t.search(/(מ?רכיבים|המרכיבים)\s*[:：]?/);
  if (start >= 0) t = t.slice(start);
  t = t.split(/(ערכים תזונתיים|סימון תזונתי|מידע על אלרגנים|עלול להכיל|יכול להכיל|לשמור ב|בתוקף עד|יצרן|מיוצר על ידי)/)[0];
  return t.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

// ——— מוצרים שהמשתמש הוסיף (נשמרים רק במכשיר) ———
function all() { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } }
export function myLabel(code) { return all()[code] || null; }
export function myLabelCount() { return Object.keys(all()).length; }
export function saveMyLabel(code, entry) {
  const list = all(); const isNew = !list[code];
  list[code] = { ...entry, savedAt: new Date().toISOString().slice(0, 10) };
  try { localStorage.setItem(STORE, JSON.stringify(list)); } catch (e) { return false; }
  return isNew;
}
export function removeMyLabel(code) {
  const list = all(); delete list[code];
  try { localStorage.setItem(STORE, JSON.stringify(list)); } catch (e) {}
}

export const offAddUrl = code => `https://world.openfoodfacts.org/cgi/product.pl?type=search_or_add&action=process&code=${encodeURIComponent(code)}`;
