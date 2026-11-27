// ============================================================
// Tavitly — מחשבונים
// כל מחשבון משתמש בנוסחה מקובלת ומציין את המקור שלה.
// החישוב נעשה בדפדפן בלבד, ושום נתון לא נשמר ולא נשלח.
// התוצאות הן הערכה כללית למבוגרים, ולא אבחנה או ייעוץ רפואי.
// ============================================================

import { tr } from './i18n.js?v=49';

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
const invalid = id => show(id, `<p>${tr('מלאו את כל השדות במספרים בטווח הגיוני.', 'Fill in all the fields with numbers in a reasonable range.')}</p>`, 'warn');

// ——— BMI: משקל חלקי גובה בריבוע. הקטגוריות לפי ארגון הבריאות העולמי, למבוגרים ———
export function bmi(weightKg, heightCm) {
  const m = heightCm / 100;
  return weightKg / (m * m);
}
export function bmiCategory(b) {
  if (b < 18.5) return [tr('תת-משקל', 'Underweight'), 'warn'];
  if (b < 25) return [tr('משקל תקין', 'Normal weight'), 'ok'];
  if (b < 30) return [tr('עודף משקל', 'Overweight'), 'warn'];
  return [tr('השמנה', 'Obesity'), 'bad'];
}

// ——— צריכת אנרגיה יומית: נוסחת Mifflin-St Jeor (1990) כפול מקדם פעילות ———
export function bmr(sex, weightKg, heightCm, age) {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'm' ? 5 : -161);
}
const ACTIVITY = [
  ['1.2', tr('כמעט בלי פעילות (עבודה בישיבה)', 'Almost no activity (desk job)')],
  ['1.375', tr('פעילות קלה (1 עד 3 אימונים בשבוע)', 'Light activity (1 to 3 workouts a week)')],
  ['1.55', tr('פעילות בינונית (3 עד 5 אימונים בשבוע)', 'Moderate activity (3 to 5 workouts a week)')],
  ['1.725', tr('פעילות רבה (6 עד 7 אימונים בשבוע)', 'High activity (6 to 7 workouts a week)')],
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

const KG = tr('ק"ג', 'kg');
const CM = tr('ס"מ', 'cm');

const field = (id, label, attrs, unit) => `
  <label class="calc-field" for="${id}">
    <span>${label}</span>
    <span class="calc-input"><input id="${id}" type="number" inputmode="decimal" ${attrs}><em>${unit}</em></span>
  </label>`;
const sexField = id => `
  <label class="calc-field" for="${id}">
    <span>${tr('מין', 'Sex')}</span>
    <span class="calc-input"><select id="${id}"><option value="f">${tr('אישה', 'Female')}</option><option value="m">${tr('גבר', 'Male')}</option></select></span>
  </label>`;
const card = (id, icon, title, intro, fields, source) => `
  <section class="calc-card animate-item" id="${id}">
    <h2><span aria-hidden="true">${icon}</span> ${title}</h2>
    <p class="muted">${intro}</p>
    <form class="calc-form" data-calc="${id}" novalidate>
      ${fields}
      <button class="btn btn-primary" type="submit">${tr('חישוב', 'Calculate')}</button>
    </form>
    <div class="calc-result" id="${id}-out" aria-live="polite"></div>
    <p class="source-note">${source}</p>
  </section>`;

export function renderCalculators(breadcrumb, pageHero) {
  return `
    <main class="page" id="page-content">
      ${breadcrumb([[tr('כלים', 'Tools'), '#/tools'], [tr('מחשבונים', 'Calculators')]])}
      ${pageHero('🧮', tr('מחשבונים', 'Calculators'), tr('ארבעה חישובים פשוטים, לפי נוסחאות מקובלות. החישוב נעשה במכשיר שלכם, ושום נתון לא נשמר', 'Four simple calculations, based on standard formulas. Everything is calculated on your device, and no data is saved'))}
      <div class="container">
        <div class="calc-grid">
          ${card('calc-sugar', '🥄', tr('כמה כפיות סוכר יש במוצר?', 'How many teaspoons of sugar are in it?'),
            tr('העתיקו מהתווית את כמות הסוכרים ל-100 גרם (או 100 מ"ל), והוסיפו את גודל המנה שאתם אוכלים.', 'Copy the amount of sugars per 100 g (or 100 ml) from the label, and add the serving size you eat.'),
            field('sugar-per100', tr('סוכרים ל-100 גרם', 'Sugars per 100 g'), 'min="0" max="100" step="0.1" placeholder="10.6"', tr('גרם', 'g')) +
            field('sugar-serving', tr('גודל המנה', 'Serving size'), 'min="1" max="2000" step="1" placeholder="330"', tr('גרם / מ"ל', 'g / ml')),
            tr('כפית סוכר שוקלת כ-4 גרם. ארגון הבריאות העולמי ממליץ למבוגר על פחות מ-50 גרם סוכרים חופשיים ביום (10% מהקלוריות), ועדיף פחות מ-25 גרם. התווית מציגה את סך הסוכרים, כולל סוכר טבעי מחלב ומפרי.', 'A teaspoon of sugar weighs about 4 g. The World Health Organization recommends that adults have less than 50 g of free sugars a day (10% of calories), and preferably less than 25 g. The label shows total sugars, including natural sugar from milk and fruit.'))}
          ${card('calc-bmi', '⚖️', tr('מדד מסת הגוף (BMI)', 'Body mass index (BMI)'),
            tr('היחס בין המשקל לגובה. מדד גס שמתאים למבוגרים בלבד.', 'The ratio between weight and height. A rough measure, suitable for adults only.'),
            field('bmi-weight', tr('משקל', 'Weight'), 'min="30" max="300" step="0.1" placeholder="70"', KG) +
            field('bmi-height', tr('גובה', 'Height'), 'min="120" max="230" step="1" placeholder="170"', CM),
            tr('BMI הוא המשקל בקילוגרמים חלקי ריבוע הגובה במטרים. הקטגוריות לפי ארגון הבריאות העולמי. המדד לא מבחין בין שריר לשומן, ולא מתאים לילדים, לנשים בהיריון ולספורטאים.', 'BMI is your weight in kilograms divided by the square of your height in meters. The categories follow the World Health Organization. BMI doesn\'t distinguish between muscle and fat, and isn\'t suitable for children, pregnant women or athletes.'))}
          ${card('calc-energy', '🔥', tr('כמה קלוריות הגוף צריך ביום?', 'How many calories does your body need a day?'),
            tr('הערכה של צריכת האנרגיה היומית, לפי גיל, מין, גובה, משקל ורמת פעילות.', 'An estimate of your daily energy needs, based on age, sex, height, weight and activity level.'),
            sexField('en-sex') +
            field('en-age', tr('גיל', 'Age'), 'min="18" max="100" step="1" placeholder="30"', tr('שנים', 'years')) +
            field('en-weight', tr('משקל', 'Weight'), 'min="30" max="300" step="0.1" placeholder="70"', KG) +
            field('en-height', tr('גובה', 'Height'), 'min="120" max="230" step="1" placeholder="170"', CM) +
            `<label class="calc-field" for="en-act"><span>${tr('פעילות גופנית', 'Physical activity')}</span><span class="calc-input"><select id="en-act">${ACTIVITY.map(([v, t], i) => `<option value="${v}"${i === 1 ? ' selected' : ''}>${t}</option>`).join('')}</select></span></label>`,
            tr('חילוף החומרים במנוחה מחושב בנוסחת Mifflin-St Jeor (1990), ומוכפל במקדם פעילות מקובל. זו הערכה ממוצעת: הצריכה בפועל משתנה מאדם לאדם, ולכן הסטייה יכולה להגיע למאות קלוריות.', 'Resting metabolism is calculated with the Mifflin-St Jeor equation (1990) and multiplied by a standard activity factor. This is an average estimate: actual needs vary from person to person, so the difference can reach several hundred calories.'))}
          ${card('calc-whr', '📏', tr('יחס מותניים-ירכיים', 'Waist-to-hip ratio'),
            tr('היקף המותניים חלקי היקף הירכיים. מעיד על פיזור השומן בגוף.', 'Waist circumference divided by hip circumference. It reflects how fat is distributed in the body.'),
            sexField('whr-sex') +
            field('whr-waist', tr('היקף מותניים', 'Waist circumference'), 'min="40" max="200" step="0.5" placeholder="80"', CM) +
            field('whr-hip', tr('היקף ירכיים', 'Hip circumference'), 'min="50" max="200" step="0.5" placeholder="100"', CM),
            tr('לפי ארגון הבריאות העולמי, יחס של 0.90 ומעלה בגברים ושל 0.85 ומעלה בנשים נקשר לסיכון מוגבר למחלות לב וסוכרת. מודדים את המותניים באמצע בין הצלע התחתונה לעצם האגן, ואת הירכיים בנקודה הרחבה ביותר.', 'According to the World Health Organization, a ratio of 0.90 or more in men and 0.85 or more in women is linked to an increased risk of heart disease and diabetes. Measure your waist midway between the lowest rib and the hip bone, and your hips at their widest point.'))}
        </div>
        <section class="prose-card disclaimer calc-disclaimer">
          <h2>${tr('⚠️ חשוב לדעת', '⚠️ Good to know')}</h2>
          <p>${tr('המחשבונים נותנים הערכה כללית למבוגרים בריאים, ולא אבחנה. הם לא מחליפים רופא או דיאטנית, ולא מתאימים לילדים, לנשים בהיריון או למי שמתמודד עם מצב רפואי.', 'These calculators give a general estimate for healthy adults, not a diagnosis. They don\'t replace a doctor or dietitian, and aren\'t suitable for children, pregnant women or anyone dealing with a medical condition.')}</p>
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
      <p class="calc-big">${tr(`${fmt(tsp)} כפיות סוכר`, `${fmt(tsp)} ${fmt(tsp) === '1' ? 'teaspoon' : 'teaspoons'} of sugar`)}</p>
      ${spoons ? `<p class="calc-spoons" aria-hidden="true">${spoons}</p>` : ''}
      <p>${tr(`במנה הזו יש ${fmt(grams)} גרם סוכרים, שהם ${fmt(pct, 0)}% מהתקרה היומית של 50 גרם.`, `This serving has ${fmt(grams)} g of sugars, which is ${fmt(pct, 0)}% of the 50 g daily limit.`)}</p>`, tone);
  },
  'calc-bmi'() {
    const w = num('bmi-weight'), h = num('bmi-height');
    if (!(w >= 30 && w <= 300 && h >= 120 && h <= 230)) return invalid('calc-bmi-out');
    const b = bmi(w, h), [name, tone] = bmiCategory(b), m = h / 100;
    show('calc-bmi-out', `
      <p class="calc-big">${fmt(b)}</p>
      <p><strong>${name}</strong>. ${tr(`הטווח התקין הוא 18.5 עד 24.9, ובגובה שלכם זה ${fmt(18.5 * m * m, 0)} עד ${fmt(24.9 * m * m, 0)} ק"ג.`, `The normal range is 18.5 to 24.9, which for your height is ${fmt(18.5 * m * m, 0)} to ${fmt(24.9 * m * m, 0)} kg.`)}</p>`, tone);
  },
  'calc-energy'() {
    const age = num('en-age'), w = num('en-weight'), h = num('en-height'), act = parseFloat(val('en-act'));
    if (!(age >= 18 && age <= 100 && w >= 30 && w <= 300 && h >= 120 && h <= 230)) return invalid('calc-energy-out');
    const rest = bmr(val('en-sex'), w, h, age), total = rest * act;
    show('calc-energy-out', `
      <p class="calc-big">${tr(`כ-${fmt(Math.round(total / 10) * 10, 0)} קלוריות ביום`, `About ${fmt(Math.round(total / 10) * 10, 0)} calories a day`)}</p>
      <p>${tr(`מתוכן כ-${fmt(Math.round(rest / 10) * 10, 0)} קלוריות הגוף שורף במנוחה מוחלטת, והשאר בתנועה ובפעילות.`, `Of these, your body burns about ${fmt(Math.round(rest / 10) * 10, 0)} calories at complete rest, and the rest through movement and activity.`)}</p>`, 'ok');
  },
  'calc-whr'() {
    const waist = num('whr-waist'), hip = num('whr-hip'), sex = val('whr-sex');
    if (!(waist >= 40 && waist <= 200 && hip >= 50 && hip <= 200)) return invalid('calc-whr-out');
    const r = waist / hip, risk = whrRisk(sex, r), limit = sex === 'm' ? '0.90' : '0.85';
    show('calc-whr-out', `
      <p class="calc-big">${r.toFixed(2)}</p>
      <p>${risk ? tr(`מעל הסף של ${limit}, שנקשר לסיכון בריאותי מוגבר. כדאי להתייעץ עם רופא.`, `Above the ${limit} threshold, which is linked to an increased health risk. It's worth talking to a doctor.`) : tr(`מתחת לסף של ${limit}.`, `Below the ${limit} threshold.`)}</p>`, risk ? 'warn' : 'ok');
  },
};

export function initCalculators() {
  document.querySelectorAll('form[data-calc]').forEach(form => {
    form.addEventListener('submit', e => { e.preventDefault(); HANDLERS[form.dataset.calc]?.(); });
  });
}
