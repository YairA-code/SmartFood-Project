// ============================================================
// Tavitly — סורק ברקוד
// סורקים ברקוד במצלמה (או מקלידים אותו), ומגיעים ישר לדף המוצר.
// מוצר שלא נמצא במאגר שלנו נבדק מול המאגר הפתוח Open Food Facts
// (ללא מפתח API וללא הרשמה), ורשימת הרכיבים שלו מנותחת בדפדפן.
// ============================================================

import { products } from './data.js?v=41';
import { escapeHtml } from './utils.js?v=41';
import { breadcrumb, renderProductCard } from './components.js?v=41';
import { analyzeLabel, labelResultHTML } from './widgets.js?v=41';
import { redFlags } from './verdict.js?v=41';
import { readLabel, myLabel, myLabelCount, saveMyLabel, removeMyLabel, offAddUrl, PIONEER_AT } from './ocr.js?v=41';
import { avoidHTML, addHistory, historyHTML, clearHistory } from './personal.js?v=41';
import { getNova } from './nova.js?v=41';
import { lookupCatalog } from './catalog.js?v=41';

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

// ——————————————————————————————————————
// מוצר שלא נמצא: מצלמים את רשימת הרכיבים ומקבלים ציון מיד
// ——————————————————————————————————————
function pioneerHTML() {
  const n = myLabelCount();
  if (n >= PIONEER_AT) return `<p class="pioneer is-on"><span aria-hidden="true">🏅</span> <strong>חלוץ Tavitly</strong> · הוספתם ${n} מוצרים שלא היו במאגר</p>`;
  return n ? `<p class="pioneer"><span aria-hidden="true">🌱</span> הוספתם ${n} ${n === 1 ? 'מוצר' : 'מוצרים'}. עוד ${PIONEER_AT - n} לתג „חלוץ Tavitly”</p>` : '';
}

function captureHTML(code, lead) {
  return `
    <section class="capture" id="capture" data-code="${escapeHtml(code)}">
      <h2 class="capture-title">📸 ${lead || 'צלמו את רשימת הרכיבים'}</h2>
      <p class="muted">צלמו מקרוב רק את רשימת הרכיבים שעל האריזה, באור טוב. הטקסט נקרא במכשיר שלכם, והתמונה לא נשלחת לשום מקום.</p>
      <label class="btn btn-primary capture-btn">
        <input type="file" accept="image/*" capture="environment" id="capture-file" hidden>
        📷 צילום התווית
      </label>
      <p class="capture-progress" id="capture-progress" hidden aria-live="polite"></p>
      <div class="capture-edit" id="capture-edit" hidden>
        <label for="capture-name" class="label-title">שם המוצר (לא חובה)</label>
        <input type="text" id="capture-name" maxlength="80" autocomplete="off" placeholder="למשל: חטיף תירס בטעם גבינה">
        <label for="capture-text" class="label-title">זה מה שקראנו. תקנו טעויות אם יש, ולחצו על בדיקה</label>
        <textarea id="capture-text" rows="5"></textarea>
        <div class="label-actions"><button class="btn btn-primary" id="capture-run">בדיקה ושמירה</button></div>
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
      <p class="eyebrow">ברקוד <bdi>${escapeHtml(code)}</bdi> · נשמר במכשיר שלכם</p>
      <h1 class="barcode-h">${escapeHtml(entry.name || 'מוצר שהוספתם')}</h1>
    </div></section>
    <p class="barcode-note">את המוצר הזה הוספתם בעצמכם מצילום התווית ב-<bdi>${escapeHtml(entry.savedAt || '')}</bdi>. הניתוח אוטומטי, ונשמר רק במכשיר הזה.</p>
    ${r ? flagsHTML(r) + labelResultHTML(r) : ''}
    <div class="barcode-actions">
      <button class="btn btn-ghost btn-sm" id="capture-again">📸 צילום מחדש</button>
      <button class="btn btn-ghost btn-sm" id="capture-forget">מחיקה מהמכשיר</button>
      <a class="btn btn-ghost btn-sm" href="${offAddUrl(code)}" target="_blank" rel="noopener noreferrer">🌍 הוספה למאגר הפתוח</a>
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
      slot.innerHTML = captureHTML(location.hash.slice(10), 'צילום מחדש של רשימת הרכיבים');
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
        <p><strong>✓ נשמר במכשיר שלכם.</strong> בפעם הבאה שתסרקו את הברקוד הזה, התשובה תופיע מיד.</p>
        ${isNew ? pioneerHTML() : ''}
        <p class="muted small">רוצים שגם אחרים יקבלו תשובה על המוצר הזה? הוסיפו אותו למאגר הפתוח Open Food Facts, שממנו Tavitly בודק מוצרים שלא נמצאים אצלנו. ההוספה נעשית באתר שלהם, עם חשבון משלכם.</p>
        <a class="btn btn-ghost btn-sm" href="${offAddUrl(code)}" target="_blank" rel="noopener noreferrer">🌍 הוספה למאגר הפתוח</a>
      </div>`;
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  file.addEventListener('change', async () => {
    const f = file.files && file.files[0];
    if (!f) return;
    prog.hidden = false; prog.textContent = 'טוענים את מנוע הקריאה… (בפעם הראשונה זה לוקח כמה שניות)';
    edit.hidden = true; out.innerHTML = '';
    try {
      const t = await readLabel(f, p => { prog.textContent = `קוראים את התווית… ${Math.round(p * 100)}%`; });
      prog.hidden = true; edit.hidden = false;
      text.value = t;
      if (t && analyzeLabel(t)) run();
      else out.innerHTML = '<div class="empty-note">לא הצלחנו לקרוא את הרכיבים מהתמונה. נסו לצלם שוב מקרוב ובאור טוב, או הקלידו אותם בתיבה.</div>';
    } catch (e) {
      prog.textContent = 'לא הצלחנו לקרוא את התמונה. אפשר להקליד את רשימת הרכיבים בתיבה.';
      edit.hidden = false;
    } finally { file.value = ''; }
  });
  document.getElementById('capture-run').addEventListener('click', run);
}

function notFoundHTML(code, why) {
  if (why === 'offline') return `
    <div class="empty-note big">
      <h1 class="barcode-h">לא הצלחנו לבדוק את הברקוד</h1>
      <p>אין כרגע חיבור למאגר המוצרים הפתוח. אפשר לצלם את רשימת הרכיבים ולקבל ציון גם בלי חיבור טוב.</p>
    </div>
    ${captureHTML(code)}
    <div class="barcode-actions"><a class="btn btn-ghost btn-sm" href="#/products">חיפוש לפי שם</a>${again}</div>`;
  return `
    <div class="empty-note big">
      <h1 class="barcode-h">המוצר הזה עוד לא אצלנו</h1>
      <p>לא מצאנו את הברקוד <bdi>${escapeHtml(code)}</bdi>, לא במאגר שלנו ולא במאגר הפתוח. צלמו את רשימת הרכיבים, ותקבלו ציון תוך כמה שניות.</p>
    </div>
    ${captureHTML(code)}
    <div class="barcode-actions"><a class="btn btn-ghost btn-sm" href="#/products">חיפוש לפי שם</a>${again}</div>`;
}

// מוצר שזיהינו מקובצי המחירים, אבל עוד אין לנו את רשימת הרכיבים שלו
function identifiedHTML(code, e) {
  const similar = similarProducts(e.n, e.b);
  return `
    <section class="barcode-head"><div>
      <p class="eyebrow">זיהינו לפי ברקוד <bdi>${escapeHtml(code)}</bdi></p>
      <h1 class="barcode-h">${escapeHtml(e.n)}</h1>
      ${e.b ? `<p class="muted">${escapeHtml(e.b)}</p>` : ''}
    </div></section>
    <p class="barcode-note">המוצר מופיע בקובצי המחירים שהרשתות מפרסמות, אבל עוד אין לנו את רשימת הרכיבים שלו. צלמו אותה, ותקבלו ציון תוך כמה שניות.</p>
    ${captureHTML(code)}
    ${similar.length ? `
      <div class="section-head start"><h2 class="section-title">מוצרים דומים שכבר בדקנו</h2></div>
      <div class="products-grid">${similar.map(renderProductCard).join('')}</div>` : ''}
    <div class="barcode-actions">${again}</div>`;
}

function offProductHTML(code, p, src) {
  src = src || { label: 'Open Food Facts', url: `${OFF_PAGE}${encodeURIComponent(code)}`, license: ' (רישיון ODbL)', note: 'הנתונים מגיעים מהמאגר הפתוח Open Food Facts, שנכתב על ידי מתנדבים' };
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
    <p class="barcode-note">המוצר הזה לא נמצא במאגר שנבדק על ידינו. ${escapeHtml(src.note)}, והניתוח נעשה אוטומטית ולא נבדק ידנית. כדאי להשוות לרשימת הרכיבים שעל האריזה.</p>
    ${similar.length ? `
      <div class="section-head start"><h2 class="section-title">אולי זה אחד מאלה?</h2><p class="section-subtitle">מוצרים דומים מהמאגר שלנו, עם רשימת רכיבים שנבדקה והסבר לכל רכיב</p></div>
      <div class="products-grid">${similar.map(renderProductCard).join('')}</div>` : ''}
    ${result ? flagsHTML(result) + labelResultHTML(result) : `
      ${captureHTML(code, 'אין כאן רשימת רכיבים בעברית. צלמו אותה מהאריזה')}`}
    <p class="source-note">מקור רשימת הרכיבים: <a href="${escapeHtml(src.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(src.label)}</a>${src.license || ''}.</p>
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
    addHistory({ code, name: mine.name || 'מוצר שהוספתם', nova: mr && mr.nova.group });
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
        ? { label: 'שופרסל אונליין', url: `https://www.shufersal.co.il/online/he/x/p/P_${encodeURIComponent(cat.u || cat.c)}`, note: `רשימת הרכיבים נלקחה מדף המוצר בשופרסל אונליין${cat.d ? ` (${cat.d})` : ''}` }
        : null;
      body.innerHTML = offProductHTML(code, { product_name_he: cat.n, brands: cat.b, quantity: cat.q, ingredients_text_he: cat.i }, src);
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
      const hasIng = found && HEBREW.test(data.product.ingredients_text_he || data.product.ingredients_text || '');
      html = found && (hasIng || !cat) ? offProductHTML(code, data.product) : cat ? identifiedHTML(code, cat) : notFoundHTML(code);
      if (found || cat) addHistory({ code, name: (cat && cat.n) || data.product.product_name_he || data.product.product_name || '' });
    }
  } catch (e) { html = cat ? identifiedHTML(code, cat) : notFoundHTML(code, 'offline'); }
  if (location.hash !== here) return;
  const body = document.getElementById('barcode-body');
  if (body) { body.innerHTML = html; initCapture(); if (onDone) onDone(); }
}
