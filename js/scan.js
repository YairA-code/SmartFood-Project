// ============================================================
// Tavitly — סורק ברקוד
// סורקים ברקוד במצלמה (או מקלידים אותו), ומגיעים ישר לדף המוצר.
// מוצר שלא נמצא במאגר שלנו נבדק מול המאגר הפתוח Open Food Facts
// (ללא מפתח API וללא הרשמה), ורשימת הרכיבים שלו מנותחת בדפדפן.
// ============================================================

import { products } from './data.js?v=53';
import { escapeHtml } from './utils.js?v=53';
import { breadcrumb, renderProductCard } from './components.js?v=53';
import { analyzeLabel, labelResultHTML } from './widgets.js?v=53';
import { redFlags } from './verdict.js?v=53';
import { readLabel, myLabel, myLabelCount, saveMyLabel, removeMyLabel, offAddUrl, PIONEER_AT } from './ocr.js?v=53';
import { avoidHTML, addHistory, historyHTML, clearHistory } from './personal.js?v=53';
import { getNova } from './nova.js?v=53';
import { lookupCatalog } from './catalog.js?v=53';
import { tr, EN } from './i18n.js?v=53';

const OFF_API = 'https://world.openfoodfacts.org/api/v2/product/';
const OFF_PAGE = 'https://world.openfoodfacts.org/product/';
const OFF_FIELDS = 'code,product_name,product_name_he,product_name_en,brands,quantity,ingredients_text_he,ingredients_text,ingredients_text_en,image_front_small_url';
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
      const pw = norm(p.he ? p.he.name : p.name).split(' ').filter(w => w.length > 1);
      const hit = pw.filter(w => words.has(w)).length;
      if (!hit || hit < Math.ceil(pw.length / 2)) return null;
      const sameBrand = b && !p.generic && (b.includes(norm(p.he ? p.he.brand : p.brand)) || norm(p.he ? p.he.brand : p.brand).includes(b));
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
  return `<a href="#/scan" class="btn btn-scan ${cls}"><span class="scan-ico" aria-hidden="true"></span>${tr('סריקת ברקוד', 'Scan barcode')}</a>`;
}

export function renderScan() {
  return `
    <main class="page page-scan" id="page-content">
      ${breadcrumb([[tr('סריקת ברקוד', 'Barcode scan')]])}
      <section class="page-hero compact">
        <h1>${tr('סריקת ברקוד', 'Barcode scan')}</h1>
        <p>${tr('כוונו את המצלמה אל הברקוד שעל האריזה, ונקפיץ אתכם ישר לדף המוצר', 'Point your camera at the barcode on the package, and we’ll take you straight to the product page')}</p>
      </section>
      <div class="container narrow">
        <div class="scan-box">
          <div class="scan-view" id="scan-view">
            <video id="scan-video" playsinline muted autoplay aria-label="${tr('תצוגת המצלמה', 'Camera view')}"></video>
            <div class="scan-frame" aria-hidden="true"><span class="scan-line"></span></div>
            <div class="scan-idle" id="scan-idle">
              <span class="scan-idle-ico" aria-hidden="true"></span>
              <button class="btn btn-primary" id="scan-start">${tr('הפעלת המצלמה', 'Turn on camera')}</button>
              <p class="small">${tr('התמונה מהמצלמה נשארת במכשיר שלכם ולא נשלחת לשום מקום', 'The camera image stays on your device and is never sent anywhere')}</p>
            </div>
          </div>
          <p class="scan-status" id="scan-status" role="status" aria-live="polite"></p>
          <div class="scan-controls">
            <button class="btn btn-ghost btn-sm" id="scan-torch" hidden>🔦 ${tr('פנס', 'Flashlight')}</button>
            <button class="btn btn-ghost btn-sm" id="scan-stop" hidden>${tr('עצירה', 'Stop')}</button>
            <label class="btn btn-ghost btn-sm scan-file">📷 ${tr('סריקה מתמונה', 'Scan from photo')}
              <input type="file" id="scan-file" accept="image/*" capture="environment" class="visually-hidden">
            </label>
          </div>
        </div>

        <form class="scan-manual" id="scan-form" novalidate>
          <label for="scan-code">${tr('או הקלידו את המספר שמתחת לברקוד', 'Or type the number under the barcode')}</label>
          <div class="scan-manual-row">
            <input id="scan-code" inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="14" placeholder="${tr('לדוגמה: 7290000066318', 'For example: 7290000066318')}" dir="ltr">
            <button class="btn btn-primary" type="submit">${tr('חיפוש', 'Search')}</button>
          </div>
          <p class="scan-error" id="scan-error" role="alert" hidden></p>
        </form>
        ${historyHTML(escapeHtml)}
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
  document.getElementById('history-clear')?.addEventListener('click', () => { clearHistory(); document.getElementById('history')?.remove(); });
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
      say(tr('הדפדפן הזה לא מאפשר גישה למצלמה. אפשר לצלם את הברקוד או להקליד את המספר.', 'This browser doesn’t allow camera access. You can take a photo of the barcode or type the number.'));
      return;
    }
    say(tr('מפעילים את המצלמה…', 'Starting the camera…'));
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
    } catch (e) {
      say(e && e.name === 'NotAllowedError'
        ? tr('אין הרשאה למצלמה. אפשר לאשר אותה בהגדרות הדפדפן, לצלם את הברקוד או להקליד את המספר.', 'No camera permission. You can allow it in your browser settings, take a photo of the barcode or type the number.')
        : tr('לא הצלחנו להפעיל את המצלמה. אפשר לצלם את הברקוד או להקליד את המספר.', 'We couldn’t start the camera. You can take a photo of the barcode or type the number.'));
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
    catch (e) { say(tr('לא הצלחנו לטעון את הסורק. אפשר להקליד את המספר שמתחת לברקוד.', 'We couldn’t load the scanner. You can type the number under the barcode.')); reset(); return; }
    say(tr('מחפשים ברקוד… החזיקו את האריזה יציבה ובאור טוב', 'Looking for a barcode… Hold the package steady in good light'));

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
    say(tr('קוראים את התמונה…', 'Reading the image…'));
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      const detect = await createDetector();
      const code = cleanCode(await detect(img));
      if (code && validCode(code)) go(code);
      else say(tr('לא מצאנו ברקוד בתמונה. נסו לצלם מקרוב ובאור טוב, או הקלידו את המספר.', 'We didn’t find a barcode in the image. Try a close-up in good light, or type the number.'));
    } catch (err) {
      say(tr('לא הצלחנו לקרוא את התמונה. אפשר להקליד את המספר שמתחת לברקוד.', 'We couldn’t read the image. You can type the number under the barcode.'));
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
      error.textContent = tr('המספר לא נראה כמו ברקוד תקין. ברקוד של מוצר הוא בדרך כלל 13 ספרות (לפעמים 8 או 12). בדקו שלא התפספסה ספרה.', 'That number doesn’t look like a valid barcode. Product barcodes usually have 13 digits (sometimes 8 or 12). Check that no digit is missing.');
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
    ${breadcrumb([[tr('סריקת ברקוד', 'Barcode scan'), '#/scan'], [code]])}
    <div class="container narrow" id="barcode-body">${inner}</div>
  </main>`;

const again = `<a class="btn btn-ghost btn-sm" href="#/scan">${tr('סריקת מוצר נוסף', 'Scan another product')}</a>`;

export function renderBarcode(raw) {
  const code = cleanCode(raw);
  if (!validCode(code)) {
    return shell(code || tr('ברקוד', 'Barcode'), `
      <div class="empty-note big"><h1 class="barcode-h">${tr('הברקוד לא תקין', 'Invalid barcode')}</h1>
      <p>${tr(`המספר ${escapeHtml(code)} לא עובר את בדיקת התקינות של ברקוד. נסו לסרוק שוב.`, `The number ${escapeHtml(code)} doesn’t pass the barcode check. Try scanning again.`)}</p>
      <div class="barcode-actions">${again}</div></div>`);
  }
  return shell(code, `
    <div class="barcode-loading" aria-busy="true"><span class="spinner" aria-hidden="true"></span><p>${tr(`מחפשים את המוצר ${escapeHtml(code)}…`, `Looking up product ${escapeHtml(code)}…`)}</p></div>`);
}

// ——————————————————————————————————————
// מוצר שלא נמצא: מצלמים את רשימת הרכיבים ומקבלים ציון מיד
// ——————————————————————————————————————
function pioneerHTML() {
  const n = myLabelCount();
  if (n >= PIONEER_AT) return `<p class="pioneer is-on"><span aria-hidden="true">🏅</span> <strong>${tr('חלוץ Tavitly', 'Tavitly Pioneer')}</strong> · ${tr(`הוספתם ${n} מוצרים שלא היו במאגר`, `You’ve added ${n} products that weren’t in the database`)}</p>`;
  return n ? `<p class="pioneer"><span aria-hidden="true">🌱</span> ${tr(`הוספתם ${n} ${n === 1 ? 'מוצר' : 'מוצרים'}. עוד ${PIONEER_AT - n} לתג „חלוץ Tavitly”`, `You’ve added ${n} ${n === 1 ? 'product' : 'products'}. ${PIONEER_AT - n} more to earn the “Tavitly Pioneer” badge`)}</p>` : '';
}

function captureHTML(code, lead) {
  return `
    <section class="capture" id="capture" data-code="${escapeHtml(code)}">
      <h2 class="capture-title">📸 ${lead || tr('צלמו את רשימת הרכיבים', 'Photograph the ingredient list')}</h2>
      <p class="muted">${tr('צלמו מקרוב רק את רשימת הרכיבים שעל האריזה, באור טוב. הטקסט נקרא במכשיר שלכם, והתמונה לא נשלחת לשום מקום.', 'Take a close-up of just the ingredient list on the package, in good light. Reads ingredient lists printed in Hebrew. The text is read on your device, and the photo is never sent anywhere.')}</p>
      <label class="btn btn-primary capture-btn">
        <input type="file" accept="image/*" capture="environment" id="capture-file" hidden>
        📷 ${tr('צילום התווית', 'Photograph the label')}
      </label>
      <p class="capture-progress" id="capture-progress" hidden aria-live="polite"></p>
      <div class="capture-edit" id="capture-edit" hidden>
        <label for="capture-name" class="label-title">${tr('שם המוצר (לא חובה)', 'Product name (optional)')}</label>
        <input type="text" id="capture-name" maxlength="80" autocomplete="off" placeholder="${tr('למשל: חטיף תירס בטעם גבינה', 'For example: cheese-flavored corn snack')}">
        <label for="capture-text" class="label-title">${tr('זה מה שקראנו. תקנו טעויות אם יש, ולחצו על בדיקה', 'Here’s what we read. Fix any mistakes, then tap Check')}</label>
        <textarea id="capture-text" rows="5"></textarea>
        <div class="label-actions"><button class="btn btn-primary" id="capture-run">${tr('בדיקה ושמירה', 'Check and save')}</button></div>
      </div>
      <div id="capture-result" aria-live="polite"></div>
    </section>`;
}

function flagsHTML(r) {
  const flags = redFlags(r.items, r.nova);
  return flags.length
    ? `<ul class="verdict-flags capture-flags">${flags.map(f => `<li><span aria-hidden="true">🚩</span> ${escapeHtml(f)}</li>`).join('')}</ul>${avoidHTML(r.items, r.nova)}`
    : avoidHTML(r.items, r.nova);
}

function savedResultHTML(code, entry) {
  const r = analyzeLabel(entry.text);
  return `
    <section class="barcode-head"><div>
      <p class="eyebrow">${tr('ברקוד', 'Barcode')} <bdi>${escapeHtml(code)}</bdi> · ${tr('נשמר במכשיר שלכם', 'Saved on your device')}</p>
      <h1 class="barcode-h">${escapeHtml(entry.name || tr('מוצר שהוספתם', 'Product you added'))}</h1>
    </div></section>
    <p class="barcode-note">${tr('את המוצר הזה הוספתם בעצמכם מצילום התווית ב-', 'You added this product yourself from a photo of the label on ')}<bdi>${escapeHtml(entry.savedAt || '')}</bdi>${tr('. הניתוח אוטומטי, ונשמר רק במכשיר הזה.', '. The analysis is automatic and is saved only on this device.')}</p>
    ${r ? flagsHTML(r) + labelResultHTML(r) : ''}
    <div class="barcode-actions">
      <button class="btn btn-ghost btn-sm" id="capture-again">📸 ${tr('צילום מחדש', 'Retake photo')}</button>
      <button class="btn btn-ghost btn-sm" id="capture-forget">${tr('מחיקה מהמכשיר', 'Delete from device')}</button>
      <a class="btn btn-ghost btn-sm" href="${offAddUrl(code)}" target="_blank" rel="noopener noreferrer">🌍 ${tr('הוספה למאגר הפתוח', 'Add to the open database')}</a>
      ${again}
    </div>
    <div id="capture-slot"></div>`;
}

export function initCapture() {
  const box = document.getElementById('capture');
  const again2 = document.getElementById('capture-again');
  if (again2) {
    again2.addEventListener('click', () => {
      const slot = document.getElementById('capture-slot');
      slot.innerHTML = captureHTML(location.hash.slice(10), tr('צילום מחדש של רשימת הרכיבים', 'Retake the ingredient list photo'));
      initCapture();
    });
    document.getElementById('capture-forget')?.addEventListener('click', () => {
      removeMyLabel(location.hash.slice(10)); location.reload();
    });
  }
  if (!box) return;
  const code = box.dataset.code;
  const file = document.getElementById('capture-file');
  const prog = document.getElementById('capture-progress');
  const edit = document.getElementById('capture-edit');
  const text = document.getElementById('capture-text');
  const name = document.getElementById('capture-name');
  const out = document.getElementById('capture-result');
  const run = () => {
    const r = analyzeLabel(text.value);
    if (!r) { out.innerHTML = labelResultHTML(null); return; }
    const isNew = saveMyLabel(code, { text: text.value.trim(), name: name.value.trim() });
    out.innerHTML = `
      ${flagsHTML(r)}
      ${labelResultHTML(r)}
      <div class="capture-saved">
        <p><strong>${tr('✓ נשמר במכשיר שלכם.', '✓ Saved on your device.')}</strong> ${tr('בפעם הבאה שתסרקו את הברקוד הזה, התשובה תופיע מיד.', 'Next time you scan this barcode, the answer will appear right away.')}</p>
        ${isNew ? pioneerHTML() : ''}
        <p class="muted small">${tr('רוצים שגם אחרים יקבלו תשובה על המוצר הזה? הוסיפו אותו למאגר הפתוח Open Food Facts, שממנו Tavitly בודק מוצרים שלא נמצאים אצלנו. ההוספה נעשית באתר שלהם, עם חשבון משלכם.', 'Want others to get an answer for this product too? Add it to the open Open Food Facts database, which Tavitly checks for products we don’t have. You add it on their site, with your own account.')}</p>
        <a class="btn btn-ghost btn-sm" href="${offAddUrl(code)}" target="_blank" rel="noopener noreferrer">🌍 ${tr('הוספה למאגר הפתוח', 'Add to the open database')}</a>
      </div>`;
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  file.addEventListener('change', async () => {
    const f = file.files && file.files[0];
    if (!f) return;
    prog.hidden = false; prog.textContent = tr('טוענים את מנוע הקריאה… (בפעם הראשונה זה לוקח כמה שניות)', 'Loading the text reader… (the first time takes a few seconds)');
    edit.hidden = true; out.innerHTML = '';
    try {
      const t = await readLabel(f, p => { prog.textContent = `${tr('קוראים את התווית…', 'Reading the label…')} ${Math.round(p * 100)}%`; });
      prog.hidden = true; edit.hidden = false;
      text.value = t;
      if (t && analyzeLabel(t)) run();
      else out.innerHTML = `<div class="empty-note">${tr('לא הצלחנו לקרוא את הרכיבים מהתמונה. נסו לצלם שוב מקרוב ובאור טוב, או הקלידו אותם בתיבה.', 'We couldn’t read the ingredients from the photo. Try again with a close-up in good light, or type them in the box.')}</div>`;
    } catch (e) {
      prog.textContent = tr('לא הצלחנו לקרוא את התמונה. אפשר להקליד את רשימת הרכיבים בתיבה.', 'We couldn’t read the image. You can type the ingredient list in the box.');
      edit.hidden = false;
    } finally { file.value = ''; }
  });
  document.getElementById('capture-run').addEventListener('click', run);
}

function notFoundHTML(code, why) {
  if (why === 'offline') return `
    <div class="empty-note big">
      <h1 class="barcode-h">${tr('לא הצלחנו לבדוק את הברקוד', 'We couldn’t check this barcode')}</h1>
      <p>${tr('אין כרגע חיבור למאגר המוצרים הפתוח. אפשר לצלם את רשימת הרכיבים ולקבל ציון גם בלי חיבור טוב.', 'We can’t reach the open product database right now. You can photograph the ingredient list and get a score even without a good connection.')}</p>
    </div>
    ${captureHTML(code)}
    <div class="barcode-actions"><a class="btn btn-ghost btn-sm" href="#/products">${tr('חיפוש לפי שם', 'Search by name')}</a>${again}</div>`;
  return `
    <div class="empty-note big">
      <h1 class="barcode-h">${tr('המוצר הזה עוד לא אצלנו', 'We don’t have this product yet')}</h1>
      <p>${tr('לא מצאנו את הברקוד ', 'We didn’t find barcode ')}<bdi>${escapeHtml(code)}</bdi>${tr(', לא במאגר שלנו ולא במאגר הפתוח. צלמו את רשימת הרכיבים, ותקבלו ציון תוך כמה שניות.', ' in our database or in the open database. Photograph the ingredient list and get a score in seconds.')}</p>
    </div>
    ${captureHTML(code)}
    <div class="barcode-actions"><a class="btn btn-ghost btn-sm" href="#/products">${tr('חיפוש לפי שם', 'Search by name')}</a>${again}</div>`;
}

// מוצר שזיהינו מקובצי המחירים, אבל עוד אין לנו את רשימת הרכיבים שלו
function identifiedHTML(code, e) {
  const similar = similarProducts(e.n, e.b);
  return `
    <section class="barcode-head"><div>
      <p class="eyebrow">${tr('זיהינו לפי ברקוד', 'Identified by barcode')} <bdi>${escapeHtml(code)}</bdi></p>
      <h1 class="barcode-h">${escapeHtml(e.n)}</h1>
      ${e.b ? `<p class="muted">${escapeHtml(e.b)}</p>` : ''}
      ${EN ? '<p class="muted small">Product name as published by the Israeli retailer.</p>' : ''}
    </div></section>
    <p class="barcode-note">${tr('המוצר מופיע בקובצי המחירים שהרשתות מפרסמות, אבל עוד אין לנו את רשימת הרכיבים שלו. צלמו אותה, ותקבלו ציון תוך כמה שניות.', 'This product appears in the price files published by retail chains, but we don’t have its ingredient list yet. Photograph it and get a score in seconds.')}</p>
    ${captureHTML(code)}
    ${similar.length ? `
      <div class="section-head start"><h2 class="section-title">${tr('מוצרים דומים שכבר בדקנו', 'Similar products we’ve already checked')}</h2></div>
      <div class="products-grid">${similar.map(renderProductCard).join('')}</div>` : ''}
    <div class="barcode-actions">${again}</div>`;
}

// שם המוצר מ-Open Food Facts: בעברית כמו תמיד; באנגלית מעדיפים את השם באנגלית
const offName = p => (EN ? p.product_name_en || p.product_name || p.product_name_he : p.product_name_he || p.product_name);
// רשימת הרכיבים באנגלית, רק במצב אנגלית (להצגה בלבד; הניתוח מבין עברית בלבד)
const enIngredients = p => {
  const t = EN ? String(p.ingredients_text_en || '').trim() : '';
  return t && !HEBREW.test(t) ? t : '';
};

function offProductHTML(code, p, src, retailer) {
  src = src || { label: 'Open Food Facts', url: `${OFF_PAGE}${encodeURIComponent(code)}`, license: tr(' (רישיון ODbL)', ' (ODbL license)'), note: tr('הנתונים מגיעים מהמאגר הפתוח Open Food Facts, שנכתב על ידי מתנדבים', 'The data comes from the open Open Food Facts database, written by volunteers') };
  const name = offName(p) || tr('מוצר ללא שם', 'Unnamed product');
  const brand = (p.brands || '').split(',')[0].trim();
  const text = HEBREW.test(p.ingredients_text_he || '') ? p.ingredients_text_he
    : HEBREW.test(p.ingredients_text || '') ? p.ingredients_text : '';
  const result = text ? analyzeLabel(text) : null;
  // באנגלית: מציגים את הרשימה באנגלית אם יש, אבל הניתוח נשאר על הטקסט העברי
  const en = retailer ? '' : enIngredients(p);
  const enList = en ? `<p class="barcode-note"><strong>Ingredients:</strong> ${escapeHtml(en)}</p>` : '';
  const similar = similarProducts(name, brand);
  const img = /^https:\/\/images\.openfoodfacts\.org\//.test(p.image_front_small_url || '') ? p.image_front_small_url : '';
  return `
    <section class="barcode-head">
      ${img ? `<img class="barcode-img" src="${escapeHtml(img)}" alt="" width="96" height="96" loading="lazy" referrerpolicy="no-referrer">` : ''}
      <div>
        <p class="eyebrow">${tr('נמצא לפי ברקוד', 'Found by barcode')} <bdi>${escapeHtml(code)}</bdi></p>
        <h1 class="barcode-h">${escapeHtml(name)}</h1>
        <p class="muted">${escapeHtml([brand, p.quantity].filter(Boolean).join(' · '))}</p>
        ${retailer ? `${EN ? '<p class="muted small">Product name as published by the Israeli retailer.</p>' : ''}` : ''}
      </div>
    </section>
    <p class="barcode-note">${tr('המוצר הזה לא נמצא במאגר שנבדק על ידינו. ', 'This product isn’t in our reviewed database. ')}${escapeHtml(src.note)}${tr(', והניתוח נעשה אוטומטית ולא נבדק ידנית. כדאי להשוות לרשימת הרכיבים שעל האריזה.', ', and the analysis is automatic, not checked by hand. Compare it with the ingredient list on the package.')}</p>
    ${similar.length ? `
      <div class="section-head start"><h2 class="section-title">${tr('אולי זה אחד מאלה?', 'Is it one of these?')}</h2><p class="section-subtitle">${tr('מוצרים דומים מהמאגר שלנו, עם רשימת רכיבים שנבדקה והסבר לכל רכיב', 'Similar products from our database, with a reviewed ingredient list and an explanation for every ingredient')}</p></div>
      <div class="products-grid">${similar.map(renderProductCard).join('')}</div>` : ''}
    ${enList}
    ${result ? flagsHTML(result) + labelResultHTML(result) : `
      ${en ? '<p class="barcode-note">Automatic analysis is available for Hebrew ingredient lists only.</p>' : ''}
      ${captureHTML(code, tr('אין כאן רשימת רכיבים בעברית. צלמו אותה מהאריזה', 'No Hebrew ingredient list here. Photograph it from the package'))}`}
    <p class="source-note">${tr('מקור רשימת הרכיבים:', 'Ingredient list source:')} <a href="${escapeHtml(src.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(src.label)}</a>${src.license || ''}.</p>
    <div class="barcode-actions">${again}</div>`;
}

export async function initBarcode(raw, onDone) {
  const code = cleanCode(raw);
  if (!validCode(code)) return;
  const local = findByBarcode(code);
  if (local) { addHistory({ code, id: local.id, name: local.name, nova: getNova(local).group }); location.replace(`#/product/${local.id}`); return; }
  const mine = myLabel(code);
  if (mine) {
    const mr = analyzeLabel(mine.text);
    addHistory({ code, name: mine.name || tr('מוצר שהוספתם', 'Product you added'), nova: mr && mr.nova.group });
    const body = document.getElementById('barcode-body');
    if (body) { body.innerHTML = savedResultHTML(code, mine); initCapture(); if (onDone) onDone(); }
    return;
  }
  const here = location.hash;
  let html;
  const cat = await lookupCatalog(code);
  if (cat && cat.i) {
    addHistory({ code, name: cat.n });
    const body = document.getElementById('barcode-body');
    if (body && location.hash === here) {
      const src = cat.s === 'shufersal'
        ? { label: tr('שופרסל אונליין', 'Shufersal Online'), url: `https://www.shufersal.co.il/online/he/x/p/P_${encodeURIComponent(cat.u || cat.c)}`, note: `${tr('רשימת הרכיבים נלקחה מדף המוצר בשופרסל אונליין', 'The ingredient list was taken from the product page on Shufersal Online')}${cat.d ? ` (${cat.d})` : ''}` }
        : null;
      body.innerHTML = offProductHTML(code, { product_name_he: cat.n, brands: cat.b, quantity: cat.q, ingredients_text_he: cat.i }, src, true);
      initCapture(); if (onDone) onDone();
    }
    return;
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(`${OFF_API}${code}.json?fields=${OFF_FIELDS}`, { signal: ctrl.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
    clearTimeout(t);
    if (res.status === 404) { html = cat ? identifiedHTML(code, cat) : notFoundHTML(code); if (cat) addHistory({ code, name: cat.n }); }
    else if (!res.ok) html = cat ? identifiedHTML(code, cat) : notFoundHTML(code, 'offline');
    else {
      const data = await res.json();
      const found = data && data.status === 1 && data.product;
      const hasIng = found && (HEBREW.test(data.product.ingredients_text_he || data.product.ingredients_text || '') || !!enIngredients(data.product));
      html = found && (hasIng || !cat) ? offProductHTML(code, data.product) : cat ? identifiedHTML(code, cat) : notFoundHTML(code);
      if (found || cat) addHistory({ code, name: (cat && cat.n) || offName(data.product) || '' });
    }
  } catch (e) { html = cat ? identifiedHTML(code, cat) : notFoundHTML(code, 'offline'); }
  if (location.hash !== here) return;
  const body = document.getElementById('barcode-body');
  if (body) { body.innerHTML = html; initCapture(); if (onDone) onDone(); }
}
