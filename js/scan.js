// ============================================================
// Smart Food — סורק ברקוד
// סורקים ברקוד במצלמה (או מקלידים אותו), ומגיעים ישר לדף המוצר.
// מוצר שלא נמצא במאגר שלנו נבדק מול המאגר הפתוח Open Food Facts
// (ללא מפתח API וללא הרשמה), ורשימת הרכיבים שלו מנותחת בדפדפן.
// ============================================================

import { products } from './data.js?v=20';
import { escapeHtml } from './utils.js?v=20';
import { breadcrumb, renderProductCard } from './components.js?v=20';
import { analyzeLabel, labelResultHTML } from './widgets.js?v=20';

const OFF_API = 'https://world.openfoodfacts.org/api/v2/product/';
const OFF_PAGE = 'https://world.openfoodfacts.org/product/';
const OFF_FIELDS = 'code,product_name,product_name_he,brands,quantity,ingredients_text_he,ingredients_text,image_front_small_url';
const HEBREW = /[֐-׿]/;

// ——————————————————————————————————————
// ברקודים
// ——————————————————————————————————————
export const cleanCode = raw => String(raw || '').replace(/\D/g, '').slice(0, 14);

// בדיקת ספרת הביקורת של EAN-8 / UPC-A / EAN-13 / GTIN-14
export function validCode(code) {
  if (!/^(\d{8}|\d{12,14})$/.test(code)) return false;
  const digits = [...code].map(Number);
  const check = digits.pop();
  const sum = digits.reverse().reduce((s, d, i) => s + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

// אותו ברקוד יכול להופיע עם או בלי אפסים מובילים (UPC-A מול EAN-13)
const strip = code => code.replace(/^0+/, '');
let index = null;
export function findByBarcode(code) {
  if (!index) {
    index = new Map();
    products.forEach(p => (p.barcodes || []).forEach(b => index.set(strip(b), p)));
  }
  return index.get(strip(code)) || null;
}

// מוצר דומה מהמאגר שלנו, לפי שם ומותג (הצעה בלבד, לא התאמה ודאית)
const norm = s => String(s || '').toLowerCase().replace(/["'׳״`.,\-–()]/g, ' ').replace(/\s+/g, ' ').trim();
export function similarProducts(name, brand, limit = 3) {
  const n = norm(name), b = norm(brand);
  if (!n) return [];
  const words = new Set(n.split(' ').filter(w => w.length > 1));
  return products
    .map(p => {
      const pw = norm(p.name).split(' ').filter(w => w.length > 1);
      const hit = pw.filter(w => words.has(w)).length;
      if (!hit || hit < Math.ceil(pw.length / 2)) return null;
      const sameBrand = b && p.brand !== 'מוצר כללי' && (b.includes(norm(p.brand)) || norm(p.brand).includes(b));
      return { p, rank: hit / pw.length + (sameBrand ? 1 : 0) + hit / 10 };
    })
    .filter(Boolean)
    .sort((x, y) => y.rank - x.rank)
    .slice(0, limit)
    .map(x => x.p);
}

// ——————————————————————————————————————
// דף הסריקה
// ——————————————————————————————————————
export function scanButton(cls = '') {
  return `<a href="#/scan" class="btn btn-scan ${cls}"><span class="scan-ico" aria-hidden="true"></span>סריקת ברקוד</a>`;
}

export function renderScan() {
  return `
    <main class="page page-scan" id="page-content">
      ${breadcrumb([['סריקת ברקוד']])}
      <section class="page-hero compact">
        <h1>סריקת ברקוד</h1>
        <p>כוונו את המצלמה אל הברקוד שעל האריזה, ונקפיץ אתכם ישר לדף המוצר</p>
      </section>
      <div class="container narrow">
        <div class="scan-box">
          <div class="scan-view" id="scan-view">
            <video id="scan-video" playsinline muted autoplay aria-label="תצוגת המצלמה"></video>
            <div class="scan-frame" aria-hidden="true"><span class="scan-line"></span></div>
            <div class="scan-idle" id="scan-idle">
              <span class="scan-idle-ico" aria-hidden="true"></span>
              <button class="btn btn-primary" id="scan-start">הפעלת המצלמה</button>
              <p class="small">התמונה מהמצלמה נשארת במכשיר שלכם ולא נשלחת לשום מקום</p>
            </div>
          </div>
          <p class="scan-status" id="scan-status" role="status" aria-live="polite"></p>
          <div class="scan-controls">
            <button class="btn btn-ghost btn-sm" id="scan-torch" hidden>🔦 פנס</button>
            <button class="btn btn-ghost btn-sm" id="scan-stop" hidden>עצירה</button>
            <label class="btn btn-ghost btn-sm scan-file">📷 סריקה מתמונה
              <input type="file" id="scan-file" accept="image/*" capture="environment" class="visually-hidden">
            </label>
          </div>
        </div>

        <form class="scan-manual" id="scan-form" novalidate>
          <label for="scan-code">או הקלידו את המספר שמתחת לברקוד</label>
          <div class="scan-manual-row">
            <input id="scan-code" inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="14" placeholder="לדוגמה: 7290000066318" dir="ltr">
            <button class="btn btn-primary" type="submit">חיפוש</button>
          </div>
          <p class="scan-error" id="scan-error" role="alert" hidden></p>
        </form>
      </div>
    </main>`;
}

// ——————————————————————————————————————
// זיהוי הברקוד: המנגנון המובנה בדפדפן אם יש, ואחרת ספריית ZXing המקומית
// ——————————————————————————————————————
const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
let zxingLoad = null;
function loadZXing() {
  if (window.ZXing) return Promise.resolve(window.ZXing);
  if (!zxingLoad) {
    zxingLoad = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'js/vendor/zxing.min.js';
      s.onload = () => resolve(window.ZXing);
      s.onerror = () => { zxingLoad = null; reject(new Error('zxing')); };
      document.head.appendChild(s);
    });
  }
  return zxingLoad;
}

async function createDetector() {
  if ('BarcodeDetector' in window) {
    try {
      const supported = await window.BarcodeDetector.getSupportedFormats();
      const formats = FORMATS.filter(f => supported.includes(f));
      if (formats.length) {
        const native = new window.BarcodeDetector({ formats });
        return async source => {
          const found = await native.detect(source);
          return found.length ? found[0].rawValue : null;
        };
      }
    } catch (e) { /* ממשיכים לספרייה */ }
  }
  const Z = await loadZXing();
  const hints = new Map();
  hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E]);
  hints.set(Z.DecodeHintType.TRY_HARDER, true);
  const reader = new Z.MultiFormatReader();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  return async source => {
    const w = source.videoWidth || source.naturalWidth || source.width;
    const h = source.videoHeight || source.naturalHeight || source.height;
    if (!w || !h) return null;
    const scale = Math.min(1, 1280 / Math.max(w, h));
    canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    try {
      const bitmap = new Z.BinaryBitmap(new Z.HybridBinarizer(new Z.HTMLCanvasElementLuminanceSource(canvas)));
      return reader.decode(bitmap, hints).getText();
    } catch (e) { return null; }
  };
}

// ——————————————————————————————————————
// מצלמה
// ——————————————————————————————————————
let stream = null, timer = null, running = false;

export function stopScan() {
  running = false;
  clearTimeout(timer);
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
}

const go = code => { stopScan(); location.hash = `#/barcode/${code}`; };

export function initScan() {
  const video = document.getElementById('scan-video');
  const view = document.getElementById('scan-view');
  const status = document.getElementById('scan-status');
  const idle = document.getElementById('scan-idle');
  const stopBtn = document.getElementById('scan-stop');
  const torchBtn = document.getElementById('scan-torch');
  if (!video) return;
  const say = t => { status.textContent = t; };

  const reset = () => {
    stopScan();
    video.srcObject = null;
    view.classList.remove('live');
    idle.hidden = false; stopBtn.hidden = true; torchBtn.hidden = true;
  };

  const start = async () => {
    if (running) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      say('הדפדפן הזה לא מאפשר גישה למצלמה. אפשר לצלם את הברקוד או להקליד את המספר.');
      return;
    }
    say('מפעילים את המצלמה…');
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
    } catch (e) {
      say(e && e.name === 'NotAllowedError'
        ? 'אין הרשאה למצלמה. אפשר לאשר אותה בהגדרות הדפדפן, לצלם את הברקוד או להקליד את המספר.'
        : 'לא הצלחנו להפעיל את המצלמה. אפשר לצלם את הברקוד או להקליד את המספר.');
      return;
    }
    // ייתכן שהמשתמש עזב את הדף בזמן בקשת ההרשאה
    if (!document.body.contains(video)) { stopScan(); return; }
    running = true;
    video.srcObject = stream;
    try { await video.play(); } catch (e) { /* autoplay */ }
    view.classList.add('live');
    idle.hidden = true; stopBtn.hidden = false;

    const track = stream.getVideoTracks()[0];
    const caps = track && track.getCapabilities ? track.getCapabilities() : {};
    if (caps.torch) {
      let on = false;
      torchBtn.hidden = false;
      torchBtn.onclick = () => { on = !on; track.applyConstraints({ advanced: [{ torch: on }] }).catch(() => {}); torchBtn.setAttribute('aria-pressed', String(on)); };
    }

    let detect;
    try { detect = await createDetector(); }
    catch (e) { say('לא הצלחנו לטעון את הסורק. אפשר להקליד את המספר שמתחת לברקוד.'); reset(); return; }
    say('מחפשים ברקוד… החזיקו את האריזה יציבה ובאור טוב');

    let last = '', streak = 0;
    const tick = async () => {
      if (!running) return;
      let code = null;
      try { if (video.readyState >= 2) code = cleanCode(await detect(video)); } catch (e) { /* פריים שלא נקרא */ }
      if (!running) return;
      if (code && validCode(code)) {
        // שתי קריאות זהות ברצף, כדי למנוע קריאה שגויה
        streak = code === last ? streak + 1 : 1; last = code;
        if (streak >= 2) {
          if (navigator.vibrate) navigator.vibrate(60);
          go(code);
          return;
        }
      }
      timer = setTimeout(tick, 120);
    };
    tick();
  };

  document.getElementById('scan-start').addEventListener('click', start);
  stopBtn.addEventListener('click', () => { reset(); say(''); });

  // סריקה מתמונה: מצלמים או בוחרים תמונה של הברקוד
  document.getElementById('scan-file').addEventListener('change', async e => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    say('קוראים את התמונה…');
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      const detect = await createDetector();
      const code = cleanCode(await detect(img));
      if (code && validCode(code)) go(code);
      else say('לא מצאנו ברקוד בתמונה. נסו לצלם מקרוב ובאור טוב, או הקלידו את המספר.');
    } catch (err) {
      say('לא הצלחנו לקרוא את התמונה. אפשר להקליד את המספר שמתחת לברקוד.');
    } finally { URL.revokeObjectURL(url); }
  });

  // הקלדה ידנית
  const input = document.getElementById('scan-code');
  const error = document.getElementById('scan-error');
  input.addEventListener('input', () => { input.value = cleanCode(input.value); error.hidden = true; });
  document.getElementById('scan-form').addEventListener('submit', e => {
    e.preventDefault();
    const code = cleanCode(input.value);
    if (!validCode(code)) {
      error.textContent = 'המספר לא נראה כמו ברקוד תקין. ברקוד של מוצר הוא בדרך כלל 13 ספרות (לפעמים 8 או 12). בדקו שלא התפספסה ספרה.';
      error.hidden = false; input.focus();
      return;
    }
    go(code);
  });
}

// ——————————————————————————————————————
// דף תוצאת הברקוד
// ——————————————————————————————————————
const shell = (code, inner) => `
  <main class="page page-barcode" id="page-content">
    ${breadcrumb([['סריקת ברקוד', '#/scan'], [code]])}
    <div class="container narrow" id="barcode-body">${inner}</div>
  </main>`;

const again = '<a class="btn btn-ghost btn-sm" href="#/scan">סריקת מוצר נוסף</a>';

export function renderBarcode(raw) {
  const code = cleanCode(raw);
  if (!validCode(code)) {
    return shell(code || 'ברקוד', `
      <div class="empty-note big"><h1 class="barcode-h">הברקוד לא תקין</h1>
      <p>המספר ${escapeHtml(code)} לא עובר את בדיקת התקינות של ברקוד. נסו לסרוק שוב.</p>
      <div class="barcode-actions">${again}</div></div>`);
  }
  return shell(code, `
    <div class="barcode-loading" aria-busy="true"><span class="spinner" aria-hidden="true"></span><p>מחפשים את המוצר ${escapeHtml(code)}…</p></div>`);
}

function notFoundHTML(code, why) {
  return `
    <div class="empty-note big">
      <h1 class="barcode-h">${why === 'offline' ? 'לא הצלחנו לבדוק את הברקוד' : 'המוצר הזה עוד לא אצלנו'}</h1>
      <p>${why === 'offline'
        ? 'אין כרגע חיבור למאגר המוצרים הפתוח. בדקו את החיבור לאינטרנט ונסו שוב.'
        : `לא מצאנו מוצר עם הברקוד <bdi>${escapeHtml(code)}</bdi>, לא במאגר שלנו ולא במאגר הפתוח Open Food Facts.`}</p>
      <p>אפשר עדיין לבדוק אותו: העתיקו את רשימת הרכיבים מהאריזה אל בודק התווית, או חפשו אותו לפי שם.</p>
      <div class="barcode-actions">
        <a class="btn btn-primary btn-sm" href="#/label">🔬 בודק התווית</a>
        <a class="btn btn-ghost btn-sm" href="#/products">חיפוש לפי שם</a>
        ${again}
      </div>
    </div>`;
}

function offProductHTML(code, p) {
  const name = p.product_name_he || p.product_name || 'מוצר ללא שם';
  const brand = (p.brands || '').split(',')[0].trim();
  const text = HEBREW.test(p.ingredients_text_he || '') ? p.ingredients_text_he
    : HEBREW.test(p.ingredients_text || '') ? p.ingredients_text : '';
  const result = text ? analyzeLabel(text) : null;
  const similar = similarProducts(name, brand);
  const img = /^https:\/\/images\.openfoodfacts\.org\//.test(p.image_front_small_url || '') ? p.image_front_small_url : '';
  return `
    <section class="barcode-head">
      ${img ? `<img class="barcode-img" src="${escapeHtml(img)}" alt="" width="96" height="96" loading="lazy" referrerpolicy="no-referrer">` : ''}
      <div>
        <p class="eyebrow">נמצא לפי ברקוד <bdi>${escapeHtml(code)}</bdi></p>
        <h1 class="barcode-h">${escapeHtml(name)}</h1>
        <p class="muted">${escapeHtml([brand, p.quantity].filter(Boolean).join(' · '))}</p>
      </div>
    </section>
    <p class="barcode-note">המוצר הזה לא נמצא במאגר שנבדק על ידינו. הנתונים מגיעים מהמאגר הפתוח Open Food Facts, שנכתב על ידי מתנדבים, והניתוח נעשה אוטומטית. כדאי להשוות לרשימת הרכיבים שעל האריזה.</p>
    ${similar.length ? `
      <div class="section-head start"><h2 class="section-title">אולי זה אחד מאלה?</h2><p class="section-subtitle">מוצרים דומים מהמאגר שלנו, עם רשימת רכיבים שנבדקה והסבר לכל רכיב</p></div>
      <div class="products-grid">${similar.map(renderProductCard).join('')}</div>` : ''}
    ${result ? labelResultHTML(result) : `
      <div class="empty-note">
        <p>למוצר הזה אין רשימת רכיבים בעברית במאגר הפתוח. אפשר להעתיק אותה מהאריזה אל בודק התווית.</p>
        <div class="barcode-actions"><a class="btn btn-primary btn-sm" href="#/label">🔬 בודק התווית</a></div>
      </div>`}
    <p class="source-note">מקור הנתונים: <a href="${OFF_PAGE}${escapeHtml(code)}" target="_blank" rel="noopener noreferrer">Open Food Facts</a> (רישיון ODbL).</p>
    <div class="barcode-actions">${again}</div>`;
}

export async function initBarcode(raw, onDone) {
  const code = cleanCode(raw);
  if (!validCode(code)) return;
  const local = findByBarcode(code);
  if (local) { location.replace(`#/product/${local.id}`); return; }
  const here = location.hash;
  let html;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(`${OFF_API}${code}.json?fields=${OFF_FIELDS}`, { signal: ctrl.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
    clearTimeout(t);
    if (res.status === 404) html = notFoundHTML(code);
    else if (!res.ok) html = notFoundHTML(code, 'offline');
    else {
      const data = await res.json();
      html = data && data.status === 1 && data.product ? offProductHTML(code, data.product) : notFoundHTML(code);
    }
  } catch (e) { html = notFoundHTML(code, 'offline'); }
  if (location.hash !== here) return;
  const body = document.getElementById('barcode-body');
  if (body) { body.innerHTML = html; if (onDone) onDone(); }
}
