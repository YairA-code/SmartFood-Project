// ============================================================
// Smart Food — מחשבונים
// כל מחשבון משתמש בנוסחה מקובלת ומציין את המקור שלה.
// החישוב נעשה בדפדפן בלבד, ושום נתון לא נשמר ולא נשלח.
// התוצאות הן הערכה כללית למבוגרים, ולא אבחנה או ייעוץ רפואי.
// ============================================================

const num = id => {
  const v = parseFloat(String(document.getElementById(id)?.value || '').replace(',', '.'));
  return Number.isFinite(v) ? v : NaN;
};
const val = id => document.getElementById(id)?.value;
const fmt = (n, d = 1) => n.toLocaleString('he-IL', { maximumFractionDigits: d, minimumFractionDigits: 0 });
const show = (id, html, tone = '') => {
  const el = document.getElementById(id);
  if (el) { el.className = 'calc-result' + (tone ? ' ' + tone : ''); el.innerHTML = html; }
};
const invalid = id => show(id, '<p>מלאו את כל השדות במספרים בטווח הגיוני.</p>', 'warn');

// ——— BMI: משקל חלקי גובה בריבוע. הקטגוריות לפי ארגון הבריאות העולמי, למבוגרים ———
export function bmi(weightKg, heightCm) {
  const m = heightCm / 100;
  return weightKg / (m * m);
}
export function bmiCategory(b) {
  if (b < 18.5) return ['תת-משקל', 'warn'];
  if (b < 25) return ['משקל תקין', 'ok'];
  if (b < 30) return ['עודף משקל', 'warn'];
  return ['השמנה', 'bad'];
}

// ——— צריכת אנרגיה יומית: נוסחת Mifflin-St Jeor (1990) כפול מקדם פעילות ———
export function bmr(sex, weightKg, heightCm, age) {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'm' ? 5 : -161);
}
const ACTIVITY = [
  ['1.2', 'כמעט בלי פעילות (עבודה בישיבה)'],
  ['1.375', 'פעילות קלה (1 עד 3 אימונים בשבוע)'],
  ['1.55', 'פעילות בינונית (3 עד 5 אימונים בשבוע)'],
  ['1.725', 'פעילות רבה (6 עד 7 אימונים בשבוע)'],
];

// ——— כפיות סוכר: כפית היא כ-4 גרם. ההמלצה של ארגון הבריאות העולמי למבוגר:
//     עד 50 גרם סוכרים חופשיים ביום (10% מ-2,000 קלוריות), ועדיף עד 25 גרם ———
export const SUGAR_PER_TSP = 4;
export const SUGAR_LIMIT = 50;
export const SUGAR_IDEAL = 25;

// ——— יחס מותניים-ירכיים: הסף לסיכון מוגבר לפי ארגון הבריאות העולמי ———
export function whrRisk(sex, ratio) {
  return ratio >= (sex === 'm' ? 0.9 : 0.85);
}

const field = (id, label, attrs, unit) => `
  <label class="calc-field" for="${id}">
    <span>${label}</span>
    <span class="calc-input"><input id="${id}" type="number" inputmode="decimal" ${attrs}><em>${unit}</em></span>
  </label>`;
const sexField = id => `
  <label class="calc-field" for="${id}">
    <span>מין</span>
    <span class="calc-input"><select id="${id}"><option value="f">אישה</option><option value="m">גבר</option></select></span>
  </label>`;
const card = (id, icon, title, intro, fields, source) => `
  <section class="calc-card animate-item" id="${id}">
    <h2><span aria-hidden="true">${icon}</span> ${title}</h2>
    <p class="muted">${intro}</p>
    <form class="calc-form" data-calc="${id}" novalidate>
      ${fields}
      <button class="btn btn-primary" type="submit">חישוב</button>
    </form>
    <div class="calc-result" id="${id}-out" aria-live="polite"></div>
    <p class="source-note">${source}</p>
  </section>`;

export function renderCalculators(breadcrumb, pageHero) {
  return `
    <main class="page" id="page-content">
      ${breadcrumb([['כלים', '#/tools'], ['מחשבונים']])}
      ${pageHero('🧮', 'מחשבונים', 'ארבעה חישובים פשוטים, לפי נוסחאות מקובלות. החישוב נעשה במכשיר שלכם, ושום נתון לא נשמר')}
      <div class="container">
        <div class="calc-grid">
          ${card('calc-sugar', '🥄', 'כמה כפיות סוכר יש במוצר?',
            'העתיקו מהתווית את כמות הסוכרים ל-100 גרם (או 100 מ"ל), והוסיפו את גודל המנה שאתם אוכלים.',
            field('sugar-per100', 'סוכרים ל-100 גרם', 'min="0" max="100" step="0.1" placeholder="10.6"', 'גרם') +
            field('sugar-serving', 'גודל המנה', 'min="1" max="2000" step="1" placeholder="330"', 'גרם / מ"ל'),
            'כפית סוכר שוקלת כ-4 גרם. ארגון הבריאות העולמי ממליץ למבוגר על פחות מ-50 גרם סוכרים חופשיים ביום (10% מהקלוריות), ועדיף פחות מ-25 גרם. התווית מציגה את סך הסוכרים, כולל סוכר טבעי מחלב ומפרי.')}
          ${card('calc-bmi', '⚖️', 'מדד מסת הגוף (BMI)',
            'היחס בין המשקל לגובה. מדד גס שמתאים למבוגרים בלבד.',
            field('bmi-weight', 'משקל', 'min="30" max="300" step="0.1" placeholder="70"', 'ק"ג') +
            field('bmi-height', 'גובה', 'min="120" max="230" step="1" placeholder="170"', 'ס"מ'),
            'BMI הוא המשקל בקילוגרמים חלקי ריבוע הגובה במטרים. הקטגוריות לפי ארגון הבריאות העולמי. המדד לא מבחין בין שריר לשומן, ולא מתאים לילדים, לנשים בהיריון ולספורטאים.')}
          ${card('calc-energy', '🔥', 'כמה קלוריות הגוף צריך ביום?',
            'הערכה של צריכת האנרגיה היומית, לפי גיל, מין, גובה, משקל ורמת פעילות.',
            sexField('en-sex') +
            field('en-age', 'גיל', 'min="18" max="100" step="1" placeholder="30"', 'שנים') +
            field('en-weight', 'משקל', 'min="30" max="300" step="0.1" placeholder="70"', 'ק"ג') +
            field('en-height', 'גובה', 'min="120" max="230" step="1" placeholder="170"', 'ס"מ') +
            `<label class="calc-field" for="en-act"><span>פעילות גופנית</span><span class="calc-input"><select id="en-act">${ACTIVITY.map(([v, t], i) => `<option value="${v}"${i === 1 ? ' selected' : ''}>${t}</option>`).join('')}</select></span></label>`,
            'חילוף החומרים במנוחה מחושב בנוסחת Mifflin-St Jeor (1990), ומוכפל במקדם פעילות מקובל. זו הערכה ממוצעת: הצריכה בפועל משתנה מאדם לאדם, ולכן הסטייה יכולה להגיע למאות קלוריות.')}
          ${card('calc-whr', '📏', 'יחס מותניים-ירכיים',
            'היקף המותניים חלקי היקף הירכיים. מעיד על פיזור השומן בגוף.',
            sexField('whr-sex') +
            field('whr-waist', 'היקף מותניים', 'min="40" max="200" step="0.5" placeholder="80"', 'ס"מ') +
            field('whr-hip', 'היקף ירכיים', 'min="50" max="200" step="0.5" placeholder="100"', 'ס"מ'),
            'לפי ארגון הבריאות העולמי, יחס של 0.90 ומעלה בגברים ושל 0.85 ומעלה בנשים נקשר לסיכון מוגבר למחלות לב וסוכרת. מודדים את המותניים באמצע בין הצלע התחתונה לעצם האגן, ואת הירכיים בנקודה הרחבה ביותר.')}
        </div>
        <section class="prose-card disclaimer calc-disclaimer">
          <h2>⚠️ חשוב לדעת</h2>
          <p>המחשבונים נותנים הערכה כללית למבוגרים בריאים, ולא אבחנה. הם לא מחליפים רופא או דיאטנית, ולא מתאימים לילדים, לנשים בהיריון או למי שמתמודד עם מצב רפואי.</p>
        </section>
      </div>
    </main>`;
}

const HANDLERS = {
  'calc-sugar'() {
    const per100 = num('sugar-per100'), serving = num('sugar-serving');
    if (!(per100 >= 0 && per100 <= 100 && serving > 0 && serving <= 2000)) return invalid('calc-sugar-out');
    const grams = per100 * serving / 100, tsp = grams / SUGAR_PER_TSP, pct = grams / SUGAR_LIMIT * 100;
    const tone = grams > SUGAR_LIMIT ? 'bad' : grams > SUGAR_IDEAL ? 'warn' : 'ok';
    const spoons = '🥄'.repeat(Math.min(20, Math.round(tsp)));
    show('calc-sugar-out', `
      <p class="calc-big">${fmt(tsp)} כפיות סוכר</p>
      ${spoons ? `<p class="calc-spoons" aria-hidden="true">${spoons}</p>` : ''}
      <p>במנה הזו יש ${fmt(grams)} גרם סוכרים, שהם ${fmt(pct, 0)}% מהתקרה היומית של 50 גרם.</p>`, tone);
  },
  'calc-bmi'() {
    const w = num('bmi-weight'), h = num('bmi-height');
    if (!(w >= 30 && w <= 300 && h >= 120 && h <= 230)) return invalid('calc-bmi-out');
    const b = bmi(w, h), [name, tone] = bmiCategory(b), m = h / 100;
    show('calc-bmi-out', `
      <p class="calc-big">${fmt(b)}</p>
      <p><strong>${name}</strong>. הטווח התקין הוא 18.5 עד 24.9, ובגובה שלכם זה ${fmt(18.5 * m * m, 0)} עד ${fmt(24.9 * m * m, 0)} ק"ג.</p>`, tone);
  },
  'calc-energy'() {
    const age = num('en-age'), w = num('en-weight'), h = num('en-height'), act = parseFloat(val('en-act'));
    if (!(age >= 18 && age <= 100 && w >= 30 && w <= 300 && h >= 120 && h <= 230)) return invalid('calc-energy-out');
    const rest = bmr(val('en-sex'), w, h, age), total = rest * act;
    show('calc-energy-out', `
      <p class="calc-big">כ-${fmt(Math.round(total / 10) * 10, 0)} קלוריות ביום</p>
      <p>מתוכן כ-${fmt(Math.round(rest / 10) * 10, 0)} קלוריות הגוף שורף במנוחה מוחלטת, והשאר בתנועה ובפעילות.</p>`, 'ok');
  },
  'calc-whr'() {
    const waist = num('whr-waist'), hip = num('whr-hip'), sex = val('whr-sex');
    if (!(waist >= 40 && waist <= 200 && hip >= 50 && hip <= 200)) return invalid('calc-whr-out');
    const r = waist / hip, risk = whrRisk(sex, r), limit = sex === 'm' ? '0.90' : '0.85';
    show('calc-whr-out', `
      <p class="calc-big">${r.toFixed(2)}</p>
      <p>${risk ? `מעל הסף של ${limit}, שנקשר לסיכון בריאותי מוגבר. כדאי להתייעץ עם רופא.` : `מתחת לסף של ${limit}.`}</p>`, risk ? 'warn' : 'ok');
  },
};

export function initCalculators() {
  document.querySelectorAll('form[data-calc]').forEach(form => {
    form.addEventListener('submit', e => { e.preventDefault(); HANDLERS[form.dataset.calc]?.(); });
  });
}
