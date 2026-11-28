// ============================================================
// Tavitly — כלים: בודק תווית, השוואה חופשית, חידון, הסל שלי,
// תובנות מהמאגר, ודף הצוות
// ============================================================

import { products, categories } from './data.js?v=51';
import { INGREDIENTS, getIngredient, canonicalName } from './ingredients.js?v=51';
import { NOVA_GROUPS, getNova, getScore, getAlternatives, lookupIngredient, classifyItems, scoreItems, novaReason } from './nova.js?v=51';
import { escapeHtml } from './utils.js?v=51';
import { art, breadcrumb, novaBadge, scoreChip, renderProductCard, RISK, ROLE, catOf, ingLink } from './components.js?v=51';
import { renderCalculators, initCalculators } from './calculators.js?v=51';
import { tr, EN, loc } from './i18n.js?v=51';

const byId = id => products.find(p => p.id === id);
const pageHero = (icon, title, text) => `
  <section class="page-hero">
    <span class="page-hero-icon" aria-hidden="true">${icon}</span>
    <h1>${title}</h1>
    <p>${text}</p>
  </section>`;

const TOOLS_CRUMB = [tr('כלים', 'Tools'), '#/tools'];

// ——————————————————————————————————————
// מרכז הכלים
// ——————————————————————————————————————
export const TOOLS = [
  { href: '#/scan', icon: '📷', title: tr('סריקת ברקוד', 'Barcode scan'), text: tr('סורקים את הברקוד שעל האריזה במצלמת הטלפון, ומגיעים ישר לדף המוצר.', 'Scan the barcode on the package with your phone camera and go straight to the product page.') },
  { href: '#/prefs', icon: '⚙️', title: tr('ההעדפות שלי', 'My preferences'), text: tr('בוחרים ממה רוצים להימנע (ממתיקים, צבעי מאכל, שמן דקלים…), ובכל מוצר רואים מיד אם הוא מתאים.', 'Choose what you want to avoid (sweeteners, food colorings, palm oil…), and see right away whether each product fits.') },
  { href: '#/label', icon: '🔬', title: tr('בודק התווית', 'Label checker'), text: tr('מדביקים רשימת רכיבים מכל מוצר, ומקבלים סיווג NOVA, ציון עיבוד והסבר לכל רכיב.', 'Paste a Hebrew ingredient list from any product and get a NOVA classification, a processing score and an explanation for every ingredient.') },
  { href: '#/calculators', icon: '🧮', title: tr('מחשבונים', 'Calculators'), text: tr('כפיות סוכר במוצר, BMI, צריכת קלוריות יומית ויחס מותניים-ירכיים, לפי נוסחאות מקובלות.', 'Teaspoons of sugar in a product, BMI, daily calorie needs and waist-to-hip ratio, using standard formulas.') },
  { href: '#/vs', icon: '⚖️', title: tr('השוואה חופשית', 'Compare any two'), text: tr('בוחרים שני מוצרים מהמאגר ורואים אותם זה לצד זה, רכיב מול רכיב.', 'Pick two products from the database and see them side by side, ingredient by ingredient.') },
  { href: '#/quiz', icon: '🎯', title: tr('חידון NOVA', 'NOVA quiz'), text: tr('עשר שאלות: נחשו כמה מעובד כל מוצר, ובדקו כמה טוב אתם מכירים את המדף.', 'Ten questions: guess how processed each product is, and see how well you know the shelf.') },
  { href: '#/basket', icon: '🛒', title: tr('הסל שלי', 'My basket'), text: tr('מוסיפים מוצרים לסל ומקבלים ציון עיבוד לכל הסל, עם הצעות להחלפה.', 'Add products to your basket and get a processing score for the whole basket, with swap suggestions.') },
  { href: '#/insights', icon: '📊', title: tr('תובנות מהמאגר', 'Database insights'), text: tr('גרפים על כל המאגר: איזו קטגוריה הכי מעובדת, ואילו תוספים הכי נפוצים.', 'Charts on the whole database: which category is the most processed, and which additives are the most common.') },
  { href: '#/random', icon: '🎲', title: tr('מוצר אקראי', 'Random product'), text: tr('לא יודעים מאיפה להתחיל? קחו מוצר אקראי מהמאגר.', 'Not sure where to start? Grab a random product from the database.') },
];

export function toolCards(list = TOOLS) {
  return `<div class="tools-grid">${list.map(t => `
    <a class="tool-card animate-item" href="${t.href}">
      <span class="tool-icon" aria-hidden="true">${t.icon}</span>
      <h3>${t.title}</h3>
      <p>${t.text}</p>
      <span class="tool-go" aria-hidden="true">←</span>
    </a>`).join('')}</div>`;
}

export function renderTools() {
  return `
    <main class="page" id="page-content">
      ${breadcrumb([[tr('כלים', 'Tools')]])}
      ${pageHero('🧰', tr('כלים', 'Tools'), tr('כלים קטנים שעוזרים להבין מה יש באוכל: לבדוק תווית, להשוות, לשחק וללמוד', 'Small tools that help you understand what\'s in your food: check a label, compare, play and learn'))}
      <div class="container">${toolCards()}</div>
    </main>`;
}

// ——————————————————————————————————————
// בודק התווית
// ——————————————————————————————————————

// תפקיד לפי מספר E, כשהרכיב לא נמצא במילון
function roleByENumber(code) {
  const n = parseInt(code, 10);
  if (n === 322) return ['מתחלב', 'safe', 'marker'];
  if (n >= 100 && n < 200) return ['צבע מאכל', 'caution', 'marker'];
  if (n >= 200 && n < 300) return ['חומר משמר', n === 250 || n === 251 || n === 252 ? 'danger' : 'caution', 'additive'];
  if (n >= 300 && n < 400) return ['נוגד חמצון / מווסת חומציות', 'safe', 'additive'];
  if (n >= 400 && n < 500) return ['מסמיך / מתחלב / מייצב', 'caution', 'marker'];
  if (n >= 500 && n < 600) return ['מווסת חומציות / חומר תפיחה', 'safe', 'additive'];
  if (n >= 600 && n < 700) return ['מחזק טעם', 'caution', 'marker'];
  if (n >= 900 && n < 910) return ['חומר הברקה', 'safe', 'marker'];
  if (n >= 950 && n < 970) return ['ממתיק', 'caution', 'marker'];
  if (n >= 920 && n < 950) return ['חומר עזר', 'safe', 'additive'];
  if (n >= 1400 && n < 1500) return ['עמילן מעובד', 'safe', 'marker'];
  if (n === 1520 || n === 1505 || n === 1518) return ['חומר הלחה', 'safe', 'marker'];
  return null;
}

// מילות מפתח, כשהרכיב לא נמצא במילון
const KEYWORDS = [
  [/צבע|קרוטן|כורכומין|אנאטו/, 'צבע מאכל', 'caution', 'marker'],
  [/טעם וריח|חומרי טעם|חומר טעם|ונילין|ארומה/, 'חומרי טעם', 'caution', 'marker'],
  [/גלוטמט|מחזק|מחזקי|הידרוליזט|תמצית שמרים|ריבונוקלאוטיד|אינוזינאט|גואנילאט/, 'מחזק טעם', 'caution', 'marker'],
  [/מתחלב|לציטין|מונו ודי/, 'מתחלב', 'safe', 'marker'],
  [/מייצב|מסמיך|גאם|קרגינן|פקטין|ג'לטין|אגר|צלולוז/, 'מייצב / מסמיך', 'safe', 'marker'],
  [/סוכרלוז|אספרטיים|אצסולפם|סטיביה|סכרין|ציקלמט|ממתיק|מלטיטול|סורביטול|אריתריטול|קסיליטול/, 'ממתיק', 'caution', 'marker'],
  [/סירופ|גלוקוז|דקסטרוז|פרוקטוז|מלטודקסטרין|סוכר אינברטי|אינוורט/, 'סוכר תעשייתי', 'caution', 'marker'],
  [/עמילן מעובד|עמילן מותאם/, 'עמילן מעובד', 'safe', 'marker'],
  [/מוקשה|מרגרינה|שומן צמחי מוצק/, 'שומן מוקשה', 'caution', 'marker'],
  [/איזולט|מבודד|חלבון מי גבינה|קזאינט|גלוטן חיטה/, 'חלבון מבודד', 'safe', 'marker'],
  [/משמר|ניטריט|ניטרט|סורבט|בנזואט|פרופיונאט|סולפיט/, 'חומר משמר', 'caution', 'additive'],
  [/ויטמין|מינרל|ברזל|סידן|אבץ|העשרה|חומצה פולית/, 'העשרה', 'safe', 'additive'],
  [/חומצ|מווסת|ציטרט|ציטראט|לקטט|חומר תפיחה|מתפיח|סודה לשתייה|ביקרבונט|מעכב חמצון|נוגד חמצון|פחמן דו/, 'תוסף טכנולוגי', 'safe', 'additive'],
  [/שמן|סוכר|מלח|חמאה|דבש|חומץ/, 'רכיב בישול', 'caution', 'culinary'],
  [/גבינה|לחם|ביסקוויט|שוקולד|נקניק|בצק/, 'רכיב מעובד', 'caution', 'processed'],
];

// תצוגה באנגלית לסוגים שהבודק מייצר בעצמו (הסוג עצמו נשאר בעברית, כי הניתוח נשען עליו)
const TYPE_EN = {
  'מתחלב': 'Emulsifier',
  'צבע מאכל': 'Food coloring',
  'חומר משמר': 'Preservative',
  'נוגד חמצון / מווסת חומציות': 'Antioxidant / acidity regulator',
  'מסמיך / מתחלב / מייצב': 'Thickener / emulsifier / stabilizer',
  'מווסת חומציות / חומר תפיחה': 'Acidity regulator / raising agent',
  'מחזק טעם': 'Flavor enhancer',
  'חומר הברקה': 'Glazing agent',
  'ממתיק': 'Sweetener',
  'חומר עזר': 'Processing aid',
  'עמילן מעובד': 'Modified starch',
  'חומר הלחה': 'Humectant',
  'חומרי טעם': 'Flavorings',
  'מייצב / מסמיך': 'Stabilizer / thickener',
  'סוכר תעשייתי': 'Industrial sugar',
  'שומן מוקשה': 'Hydrogenated fat',
  'חלבון מבודד': 'Protein isolate',
  'העשרה': 'Fortification',
  'תוסף טכנולוגי': 'Technical additive',
  'רכיב בישול': 'Culinary ingredient',
  'רכיב מעובד': 'Processed ingredient',
  'לא מזוהה': 'Unrecognized',
};
const showType = t => (EN && TYPE_EN[t]) || loc(t);

const plainKeys = () => Object.keys(INGREDIENTS).map(k => [k, k.replace(/\s*\(.*\)\s*$/, '').trim()]);

export function identifyIngredient(raw) {
  const name = raw.trim();
  const hit = getIngredient(name);
  if (hit) return { name, ...hit, key: INGREDIENTS[name] ? name : canonicalName(name), how: 'exact' };
  const clean = canonicalName(name);
  // התאמה לפי מילון בלי סוגריים
  const base = clean.replace(/\s*\(.*\)\s*$/, '').trim();
  for (const [k, plain] of plainKeys()) if (plain === base || k === base) return { name, ...INGREDIENTS[k], key: k, how: 'dict' };
  // מספר E
  const e = clean.match(/E\s*-?\s*(\d{3,4})/i);
  if (e) {
    const r = roleByENumber(e[1]);
    if (r) return { name, type: r[0], risk: r[1], nova: r[2], reason: tr(`זוהה לפי מספר E${e[1]}: ${r[0]}.`, `Identified by its E-number, E${e[1]}: ${showType(r[0]).toLowerCase()}.`), how: 'enum' };
  }
  for (const [re, type, risk, nova] of KEYWORDS) {
    if (re.test(clean)) return { name, type, risk, nova, reason: tr(`זוהה לפי מילת מפתח: ${type}.`, `Identified by a keyword: ${showType(type).toLowerCase()}.`), how: 'keyword' };
  }
  // רכיב שמכיל שם מהמילון (המילה הארוכה ביותר)
  let best = null;
  for (const [k, plain] of plainKeys()) if (plain.length >= 3 && clean.includes(plain) && (!best || plain.length > best[1].length)) best = [k, plain];
  if (best) return { name, ...INGREDIENTS[best[0]], key: best[0], how: 'partial' };
  return { name, type: 'לא מזוהה', risk: 'caution', nova: 'whole', reason: tr('הרכיב לא נמצא במילון שלנו. הוא נספר כמזון בסיסי, ולכן כדאי לבדוק אותו בעצמכם.', 'This ingredient isn\'t in our dictionary. It\'s counted as a basic food, so it\'s worth checking it yourself.'), how: 'unknown' };
}

// פיצול רשימת רכיבים לפי פסיקים, בלי לפצל בתוך סוגריים
export function splitIngredients(text) {
  let t = String(text || '').replace(/\r/g, '');
  t = t.replace(/^\s*(רכיבים|מרכיבים)\s*[:：]\s*/, '');
  t = t.split(/(עלול להכיל|יכול להכיל|מכיל\s*:|ערכים תזונתיים|אלרגנים)/)[0];
  const out = []; let depth = 0, cur = '';
  for (const ch of t) {
    if ('([{'.includes(ch)) depth++;
    if (')]}'.includes(ch)) depth = Math.max(0, depth - 1);
    if (depth === 0 && /[,،;\n]/.test(ch)) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map(s => s.replace(/^[\s.\-–•*]+|[\s.]+$/g, '').trim()).filter(s => s.length > 1);
}

export function analyzeLabel(text) {
  const items = splitIngredients(text).map(identifyIngredient);
  if (!items.length) return null;
  const nova = classifyItems(items);
  const score = scoreItems(items, nova);
  return { items, nova, score };
}

const LABEL_EXAMPLE = 'קמח חיטה, סוכר, שמן דקלים, אבקת קקאו (5%), סירופ גלוקוז, מלח, מתחלב (לציטין סויה), חומרי תפיחה (E500, E503), חומרי טעם וריח';

export function renderLabel() {
  return `
    <main class="page" id="page-content">
      ${breadcrumb([TOOLS_CRUMB, [tr('בודק התווית', 'Label checker')]])}
      ${pageHero('🔬', tr('בודק התווית', 'Label checker'), tr('העתיקו את רשימת הרכיבים מאריזה של מוצר כלשהו, וקבלו סיווג NOVA, ציון עיבוד והסבר לכל רכיב', 'The checker reads ingredient lists written in Hebrew, as on Israeli labels. Copy the list from any product\'s package and get a NOVA classification, a processing score and an explanation for every ingredient'))}
      <div class="container narrow">
        <div class="label-box">
          <label for="label-input" class="label-title">${tr('רשימת הרכיבים, כפי שהיא כתובה על האריזה', 'The ingredient list in Hebrew, exactly as written on the package')}</label>
          <textarea id="label-input" rows="5" placeholder="${tr('לדוגמה', 'For example')}: ${LABEL_EXAMPLE}"></textarea>
          <div class="label-actions">
            <button class="btn btn-primary" id="label-run">${tr('בדיקה', 'Check')}</button>
            <button class="btn btn-ghost" id="label-example">${tr('דוגמה', 'Example')}</button>
            <button class="btn btn-ghost" id="label-clear">${tr('ניקוי', 'Clear')}</button>
          </div>
          <p class="muted small">${tr('הניתוח נעשה בדפדפן, לפי מילון הרכיבים שלנו וחוקי NOVA. רכיב שלא זוהה מסומן, וכדאי לבדוק אותו בעצמכם.', 'The analysis runs in your browser, using our ingredient dictionary and the NOVA rules. It works on Hebrew ingredient lists only. Unrecognized ingredients are flagged, so it\'s worth checking them yourself.')}</p>
        </div>
        <div id="label-result" aria-live="polite"></div>
      </div>
    </main>`;
}

export function labelResultHTML(r) {
  if (!r) return `<div class="empty-note">${tr('לא נמצאו רכיבים. הדביקו רשימה שהרכיבים בה מופרדים בפסיקים.', 'No ingredients found. Paste a list with the ingredients separated by commas.')}</div>`;
  const { items, nova, score } = r;
  const C = 2 * Math.PI * 54;
  const level = score <= 2 ? 'low' : score <= 5 ? 'mid' : 'high';
  const unknown = items.filter(i => i.how === 'unknown').length;
  const counts = { safe: 0, caution: 0, danger: 0 };
  items.forEach(i => counts[i.risk]++);
  const reason = nova.group === 4
    ? tr(`נמצאו ${nova.markers.length === 1 ? 'רכיב אחד' : nova.markers.length + ' רכיבים'} שמאפיינים עיבוד תעשייתי: ${nova.markers.join(', ')}.`,
      `Found ${nova.markers.length === 1 ? 'one ingredient' : nova.markers.length + ' ingredients'} typical of industrial processing: ${nova.markers.map(loc).join(', ')}.`)
    : nova.group === 3 ? tr('מזון בסיסי עם מלח, סוכר, שמן או תוספים לשימור, בלי רכיבים שמאפיינים עיבוד תעשייתי.', 'Basic food with salt, sugar, oil or preserving additives, and no ingredients typical of industrial processing.')
    : nova.group === 2 ? tr('רכיבי בישול בלבד.', 'Culinary ingredients only.') : tr('כל הרכיבים שזוהו הם מזון בסיסי.', 'All the recognized ingredients are basic foods.');
  return `
    <div class="label-summary nova-panel" style="--nova:${nova.color};--nova-bg:${nova.bg}">
      <div class="nova-panel-num" aria-hidden="true">${nova.group}</div>
      <div class="nova-panel-body">
        <p class="eyebrow">${tr('תוצאה', 'Result')}</p>
        <h2 class="nova-panel-title">NOVA ${nova.group}: ${nova.name}</h2>
        <p class="nova-panel-text">${escapeHtml(reason)}</p>
        <div class="risk-summary">
          <span class="count-badge risk-safe">${counts.safe} ${tr('בטוחים', 'safe')}</span>
          <span class="count-badge risk-caution">${counts.caution} ${tr('במידה', 'in moderation')}</span>
          <span class="count-badge risk-danger">${counts.danger} ${tr('בעייתיים', 'problematic')}</span>
          ${unknown ? `<span class="count-badge unknown">${unknown} ${tr('לא זוהו', 'unrecognized')}</span>` : ''}
        </div>
      </div>
      <div class="gauge small score-${level}" aria-label="${tr(`ציון עיבוד ${score} מתוך 10`, `Processing score ${score} out of 10`)}">
        <svg viewBox="0 0 120 120" class="gauge-svg" aria-hidden="true"><circle class="gauge-bg" cx="60" cy="60" r="54"/><circle class="gauge-fill" cx="60" cy="60" r="54" style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - score / 10)}"/></svg>
        <div class="gauge-center"><span class="gauge-number">${score}</span><span class="gauge-max">/10</span></div>
        <span class="gauge-label">${tr('ציון עיבוד', 'Processing score')}</span>
      </div>
    </div>
    <ol class="ing-list">
      ${items.map(i => `
        <li class="ing-row ${RISK[i.risk].cls} ${i.how === 'unknown' ? 'is-unknown' : ''}">
          <span class="ing-risk ${RISK[i.risk].cls}">${i.how === 'unknown' ? '?' : RISK[i.risk].label}</span>
          <div class="ing-main">
            ${i.key ? `<a class="ing-name" href="${ingLink(i.key)}">${escapeHtml(loc(i.name))}</a>` : `<span class="ing-name">${escapeHtml(loc(i.name))}</span>`}
            <span class="ing-type">${escapeHtml(showType(i.type))}${i.how !== 'unknown' ? ` · ${ROLE[i.nova]}` : ''}</span>
            ${i.nova === 'marker' ? `<span class="nova-marker">${tr('סמן NOVA 4', 'NOVA 4 marker')}</span>` : ''}
          </div>
          <p class="ing-reason">${escapeHtml(loc(i.reason))}</p>
        </li>`).join('')}
    </ol>
    <p class="source-note">${tr('זו הערכה אוטומטית לפי רשימת הרכיבים בלבד, ולא סיווג רשמי. מידע כללי ולא ייעוץ תזונתי.', 'This is an automatic estimate based on the ingredient list only, not an official classification. General information, not nutritional advice.')}</p>`;
}

export function initLabel() {
  const input = document.getElementById('label-input');
  const out = document.getElementById('label-result');
  if (!input) return;
  const run = () => { out.innerHTML = labelResultHTML(analyzeLabel(input.value)); };
  document.getElementById('label-run').addEventListener('click', run);
  document.getElementById('label-example').addEventListener('click', () => { input.value = LABEL_EXAMPLE; run(); });
  document.getElementById('label-clear').addEventListener('click', () => { input.value = ''; out.innerHTML = ''; input.focus(); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run(); });
}

// ——————————————————————————————————————
// השוואה חופשית
// ——————————————————————————————————————
function productSelect(id, selected) {
  return `
    <select id="${id}" class="vs-select">
      <option value="">${tr('בחרו מוצר…', 'Choose a product…')}</option>
      ${categories.filter(c => products.some(p => p.category === c.id)).map(c => `
        <optgroup label="${c.name}">
          ${products.filter(p => p.category === c.id).sort((a, b) => a.name.localeCompare(b.name, 'he')).map(p => `<option value="${p.id}" ${p.id === selected ? 'selected' : ''}>${escapeHtml(p.name)} · ${escapeHtml(p.brand)}</option>`).join('')}
        </optgroup>`).join('')}
    </select>`;
}

function vsColumn(p) {
  if (!p) return `<div class="vs-col vs-empty"><span aria-hidden="true">➕</span><p>${tr('בחרו מוצר מהרשימה', 'Choose a product from the list')}</p></div>`;
  const n = getNova(p);
  const items = p.ingredients.map(i => ({ name: i, ...lookupIngredient(i) }));
  const counts = { safe: 0, caution: 0, danger: 0 };
  items.forEach(i => counts[i.risk]++);
  return `
    <div class="vs-col">
      <a href="#/product/${p.id}" class="vs-head">
        ${art(p, 'art-card')}
        <h3>${escapeHtml(p.name)}</h3>
        <p class="card-brand">${escapeHtml(p.brand)}</p>
      </a>
      <div class="card-badges">${novaBadge(p)}${scoreChip(p)}</div>
      <dl class="vs-stats">
        <div><dt>${tr('רכיבים', 'Ingredients')}</dt><dd>${p.ingredients.length}</dd></div>
        <div><dt>${tr('סמני עיבוד', 'Processing markers')}</dt><dd>${n.markers.length}</dd></div>
        <div><dt>${tr('בעייתיים', 'Problematic')}</dt><dd>${counts.danger}</dd></div>
      </dl>
      <ul class="vs-ings">
        ${items.map(i => `<li class="${i.nova === 'marker' ? 'is-marker' : ''}"><span class="dot ${RISK[i.risk].cls}" aria-hidden="true"></span><a href="${ingLink(i.key)}">${escapeHtml(loc(i.name))}</a>${i.nova === 'marker' ? `<span class="nova-marker">${tr('סמן', 'marker')}</span>` : ''}</li>`).join('')}
      </ul>
    </div>`;
}

export function renderVs(a, b) {
  const pa = byId(a), pb = byId(b);
  let verdict = '';
  if (pa && pb && pa !== pb) {
    const sa = getScore(pa), sb = getScore(pb), na = getNova(pa).group, nb = getNova(pb).group;
    if (na === nb && sa === sb) verdict = tr(`לשני המוצרים אותה דרגת עיבוד (NOVA ${na}, ציון ${sa}/10).`, `Both products are equally processed (NOVA ${na}, score ${sa}/10).`);
    else {
      const [win, lose] = (na < nb || (na === nb && sa < sb)) ? [pa, pb] : [pb, pa];
      verdict = tr(`<strong>${escapeHtml(win.name)}</strong> מעובד פחות: NOVA ${getNova(win).group} וציון ${getScore(win)}/10, לעומת NOVA ${getNova(lose).group} וציון ${getScore(lose)}/10.`,
        `<strong>${escapeHtml(win.name)}</strong> is less processed: NOVA ${getNova(win).group} with a score of ${getScore(win)}/10, vs. NOVA ${getNova(lose).group} with a score of ${getScore(lose)}/10.`);
    }
  }
  return `
    <main class="page" id="page-content">
      ${breadcrumb([TOOLS_CRUMB, [tr('השוואה חופשית', 'Compare any two')]])}
      ${pageHero('⚖️', tr('השוואה חופשית', 'Compare any two'), tr('בחרו שני מוצרים מכל המאגר ורואים אותם זה לצד זה', 'Pick any two products from the database and see them side by side'))}
      <div class="container">
        <div class="vs-pickers">
          <label><span>${tr('מוצר ראשון', 'First product')}</span>${productSelect('vs-a', a)}</label>
          <button class="icon-btn" id="vs-swap" aria-label="${tr('החלפת הצדדים', 'Swap sides')}" title="${tr('החלפת הצדדים', 'Swap sides')}">⇄</button>
          <label><span>${tr('מוצר שני', 'Second product')}</span>${productSelect('vs-b', b)}</label>
        </div>
        ${verdict ? `<p class="vs-verdict">⚖️ ${verdict}</p>` : ''}
        <div class="vs-grid">${vsColumn(pa)}${vsColumn(pb)}</div>
      </div>
    </main>`;
}

export function initVs() {
  const A = document.getElementById('vs-a'), B = document.getElementById('vs-b');
  if (!A) return;
  const go = () => { location.hash = `#/vs/${A.value || '-'}/${B.value || '-'}`; };
  A.addEventListener('change', go);
  B.addEventListener('change', go);
  document.getElementById('vs-swap').addEventListener('click', () => { [A.value, B.value] = [B.value, A.value]; go(); });
}

// ——————————————————————————————————————
// חידון NOVA
// ——————————————————————————————————————
const quiz = { list: [], i: 0, score: 0, answered: false };

function newQuiz() {
  const pool = [...products];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  // לפחות שני מוצרים מכל קבוצה כשאפשר, כדי שהחידון לא יהיה רק "4"
  const pick = [];
  [1, 2, 3, 4].forEach(g => pick.push(...pool.filter(p => getNova(p).group === g).slice(0, g === 4 ? 4 : 2)));
  for (let i = pick.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pick[i], pick[j]] = [pick[j], pick[i]]; }
  Object.assign(quiz, { list: pick.slice(0, 10), i: 0, score: 0, answered: false });
}

function quizCard() {
  if (quiz.i >= quiz.list.length) {
    const s = quiz.score, n = quiz.list.length;
    const msg = s === n ? tr('מושלם. אתם מכירים את המדף בעל פה.', 'Perfect. You know the shelf by heart.')
      : s >= n * 0.7 ? tr('יפה מאוד, עין חדה לתוויות.', 'Very nice, you have a sharp eye for labels.')
      : s >= n * 0.4 ? tr('לא רע. שווה להציץ בדף מדד NOVA.', 'Not bad. It\'s worth a look at the NOVA scale page.')
      : tr('זה מפתיע הרבה אנשים. הדף על מדד NOVA יעזור.', 'This surprises a lot of people. The page on the NOVA scale will help.');
    return `
      <div class="quiz-card quiz-end">
        <span class="quiz-big" aria-hidden="true">${s >= n * 0.7 ? '🏆' : '🎯'}</span>
        <h2>${tr(`${s} מתוך ${n}`, `${s} out of ${n}`)}</h2>
        <p>${msg}</p>
        <div class="label-actions center"><button class="btn btn-primary" id="quiz-again">${tr('משחק חדש', 'New game')}</button><a class="btn btn-ghost" href="#/nova">${tr('מה זה מדד NOVA?', 'What is the NOVA scale?')}</a></div>
      </div>`;
  }
  const p = quiz.list[quiz.i];
  return `
    <div class="quiz-card">
      <div class="quiz-progress" aria-label="${tr(`שאלה ${quiz.i + 1} מתוך ${quiz.list.length}`, `Question ${quiz.i + 1} of ${quiz.list.length}`)}">
        ${quiz.list.map((_, k) => `<span class="${k < quiz.i ? 'done' : k === quiz.i ? 'now' : ''}"></span>`).join('')}
      </div>
      <p class="muted">${tr(`שאלה ${quiz.i + 1} מתוך ${quiz.list.length} · ניקוד: ${quiz.score}`, `Question ${quiz.i + 1} of ${quiz.list.length} · Score: ${quiz.score}`)}</p>
      <div class="quiz-product">${art(p, 'art-card')}<h2>${escapeHtml(p.name)}</h2><p class="card-brand">${escapeHtml(p.brand)}</p></div>
      <p class="quiz-q">${tr('באיזו קבוצת NOVA המוצר הזה?', 'Which NOVA group is this product in?')}</p>
      <div class="quiz-options" role="group" aria-label="${tr('תשובות', 'Answers')}">
        ${[1, 2, 3, 4].map(g => `<button class="quiz-opt" data-g="${g}" style="--nova:${NOVA_GROUPS[g].color};--nova-bg:${NOVA_GROUPS[g].bg}"><strong>${g}</strong><span>${NOVA_GROUPS[g].short}</span></button>`).join('')}
      </div>
      <div id="quiz-feedback" aria-live="polite"></div>
    </div>`;
}

export function renderQuiz() {
  if (!quiz.list.length || quiz.i >= quiz.list.length) newQuiz();
  return `
    <main class="page" id="page-content">
      ${breadcrumb([TOOLS_CRUMB, [tr('חידון NOVA', 'NOVA quiz')]])}
      ${pageHero('🎯', tr('חידון NOVA', 'NOVA quiz'), tr('עשרה מוצרים מהמאגר. נחשו כמה כל אחד מעובד', 'Ten products from the database. Guess how processed each one is'))}
      <div class="container narrow" id="quiz-root">${quizCard()}</div>
    </main>`;
}

export function initQuiz() {
  const root = document.getElementById('quiz-root');
  if (!root) return;
  root.addEventListener('click', e => {
    if (e.target.closest('#quiz-again')) { newQuiz(); root.innerHTML = quizCard(); return; }
    if (e.target.closest('#quiz-next')) { quiz.i++; quiz.answered = false; root.innerHTML = quizCard(); root.querySelector('.quiz-card')?.scrollIntoView({ block: 'nearest' }); return; }
    const opt = e.target.closest('.quiz-opt');
    if (!opt || quiz.answered) return;
    quiz.answered = true;
    const p = quiz.list[quiz.i];
    const right = getNova(p).group;
    const ok = Number(opt.dataset.g) === right;
    if (ok) quiz.score++;
    root.querySelectorAll('.quiz-opt').forEach(b => {
      b.disabled = true;
      if (Number(b.dataset.g) === right) b.classList.add('correct');
      else if (b === opt) b.classList.add('wrong');
    });
    document.getElementById('quiz-feedback').innerHTML = `
      <div class="quiz-feedback ${ok ? 'ok' : 'no'}">
        <strong>${ok ? tr('נכון.', 'Correct.') : tr(`לא בדיוק. התשובה: NOVA ${right}`, `Not quite. The answer: NOVA ${right}`)}</strong>
        <p>${escapeHtml(novaReason(p))}</p>
        <div class="label-actions"><button class="btn btn-primary" id="quiz-next">${quiz.i + 1 < quiz.list.length ? tr('לשאלה הבאה', 'Next question') : tr('לתוצאה', 'See result')}</button><a class="btn btn-ghost" href="#/product/${p.id}">${tr('לדף המוצר', 'Product page')}</a></div>
      </div>`;
  });
}

// ——————————————————————————————————————
// הסל שלי (נשמר בדפדפן)
// ——————————————————————————————————————
const KEY = 'smart-food-basket';
let basket = [];
try { basket = JSON.parse(localStorage.getItem(KEY) || '[]').filter(byId); } catch (e) { basket = []; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(basket)); } catch (e) {} };
const listeners = new Set();
export const onBasket = fn => listeners.add(fn);
export const inBasket = id => basket.includes(id);
export const basketCount = () => basket.length;
export function toggleBasket(id) {
  basket = inBasket(id) ? basket.filter(x => x !== id) : [...basket, id];
  save(); listeners.forEach(fn => fn());
  return inBasket(id);
}
function setBasket(list) { basket = list; save(); listeners.forEach(fn => fn()); }

export function renderBasket() {
  const list = basket.map(byId).filter(Boolean);
  const head = `
    ${breadcrumb([TOOLS_CRUMB, [tr('הסל שלי', 'My basket')]])}
    ${pageHero('🛒', tr('הסל שלי', 'My basket'), tr('הוסיפו מוצרים מכל דף מוצר בכפתור "הוספה לסל", וקבלו תמונה של כל הסל', 'Add products from any product page with the "Add to basket" button, and get the full picture of your basket'))}`;
  if (!list.length) {
    return `<main class="page" id="page-content">${head}
      <div class="container narrow"><div class="empty-note big">
        <span class="quiz-big" aria-hidden="true">🛒</span>
        <p>${tr('הסל ריק. אפשר להתחיל מאחת הקטגוריות, או למלא את הסל בדוגמה.', 'Your basket is empty. Start from one of the categories, or fill the basket with an example.')}</p>
        <div class="label-actions center"><a class="btn btn-primary" href="#/categories">${tr('לקטגוריות', 'Browse categories')}</a><button class="btn btn-ghost" id="basket-demo">${tr('סל לדוגמה', 'Example basket')}</button></div>
      </div></div></main>`;
  }
  const groups = [1, 2, 3, 4].map(g => list.filter(p => getNova(p).group === g).length);
  const avg = list.reduce((s, p) => s + getScore(p), 0) / list.length;
  const ultraShare = Math.round((groups[3] / list.length) * 100);
  const swaps = list.filter(p => getNova(p).group >= 3).map(p => ({ p, alt: getAlternatives(p, 1)[0] })).filter(x => x.alt);
  const level = avg <= 2.5 ? 'low' : avg <= 5.5 ? 'mid' : 'high';
  return `
    <main class="page" id="page-content">${head}
      <div class="container">
        <div class="basket-summary">
          <div class="stat-tile"><span class="stat-number">${list.length}</span><span class="stat-label">${tr('מוצרים בסל', list.length === 1 ? 'product in basket' : 'products in basket')}</span></div>
          <div class="stat-tile score-${level}"><span class="stat-number">${avg.toFixed(1)}</span><span class="stat-label">${tr('ציון עיבוד ממוצע (מתוך 10)', 'Average processing score (out of 10)')}</span></div>
          <div class="stat-tile"><span class="stat-number">${ultraShare}%</span><span class="stat-label">${tr('אולטרה-מעובדים', 'ultra-processed')}</span></div>
        </div>
        <div class="nova-bar" role="img" aria-label="${[1, 2, 3, 4].map(g => `NOVA ${g}: ${groups[g - 1]}`).join(', ')}">
          ${[1, 2, 3, 4].map(g => groups[g - 1] ? `<span class="nova-bar-seg" style="flex:${groups[g - 1]};background:${NOVA_GROUPS[g].color};color:${NOVA_GROUPS[g].on}" title="NOVA ${g}: ${groups[g - 1]} ${tr('מוצרים', groups[g - 1] === 1 ? 'product' : 'products')}"><span>${groups[g - 1]}</span></span>` : '').join('')}
        </div>
        <div class="nova-legend">${[1, 2, 3, 4].map(g => `<span class="nova-legend-item"><span class="nova-dot" style="background:${NOVA_GROUPS[g].color};color:${NOVA_GROUPS[g].on}"></span>NOVA ${g} · ${NOVA_GROUPS[g].short}</span>`).join('')}</div>

        ${swaps.length ? `
          <div class="section-head start"><h2 class="section-title">${tr('הצעות להחלפה', 'Swap suggestions')}</h2><p class="section-subtitle">${tr('חלופה מעובדת פחות מאותו סוג, לכל מוצר שאפשר', 'A less processed alternative of the same kind, wherever there is one')}</p></div>
          <div class="swap-list">
            ${swaps.map(({ p, alt }) => `
              <div class="swap-row">
                <a href="#/product/${p.id}" class="swap-side">${art(p, 'art-xs')}<span>${escapeHtml(p.name)}</span>${novaBadge(p)}</a>
                <span class="teaser-arrow" aria-hidden="true">${tr('←', '→')}</span>
                <a href="#/product/${alt.id}" class="swap-side">${art(alt, 'art-xs')}<span>${escapeHtml(alt.name)}</span>${novaBadge(alt)}</a>
                <button class="btn btn-ghost btn-sm" data-swap="${p.id}" data-to="${alt.id}">${tr('החלפה בסל', 'Swap in basket')}</button>
              </div>`).join('')}
          </div>` : ''}

        <div class="section-head start"><h2 class="section-title">${tr('המוצרים בסל', 'Products in your basket')}</h2></div>
        <div class="products-grid">${list.map(p => `<div class="basket-item">${renderProductCard(p)}<button class="basket-remove" data-remove="${p.id}" aria-label="${tr(`הסרת ${escapeHtml(p.name)} מהסל`, `Remove ${escapeHtml(p.name)} from basket`)}">✕</button></div>`).join('')}</div>
        <div class="center-cta"><button class="btn btn-ghost" id="basket-clear">${tr('ריקון הסל', 'Empty basket')}</button></div>
      </div>
    </main>`;
}

export function initBasket(rerender) {
  const root = document.getElementById('page-content');
  if (!root) return;
  root.addEventListener('click', e => {
    const rm = e.target.closest('[data-remove]');
    const sw = e.target.closest('[data-swap]');
    if (rm) { e.preventDefault(); toggleBasket(rm.dataset.remove); rerender(); }
    else if (sw) { setBasket(basket.map(x => x === sw.dataset.swap ? sw.dataset.to : x).filter((x, i, a) => a.indexOf(x) === i)); rerender(); }
    else if (e.target.closest('#basket-clear')) { setBasket([]); rerender(); }
    else if (e.target.closest('#basket-demo')) { setBasket(['bamba_nougat', 'cola', 'hot_dogs', 'cornflakes', 'white_cheese', 'apple', 'pita', 'hummus']); rerender(); }
  });
}

// ——————————————————————————————————————
// תובנות מהמאגר
// ——————————————————————————————————————
export function renderInsights() {
  const cats = categories.filter(c => products.some(p => p.category === c.id)).map(c => {
    const list = products.filter(p => p.category === c.id);
    const g = [1, 2, 3, 4].map(n => list.filter(p => getNova(p).group === n).length);
    return { c, list, g, ultra: g[3] / list.length };
  }).sort((a, b) => b.ultra - a.ultra);

  // הסמנים הנפוצים ביותר, לפי משפחה
  const FAMILY = [
    [tr('חומרי טעם וריח', 'Flavorings'), /טעם וריח|חומרי טעם|חומר טעם|ונילין/],
    [tr('מחזקי טעם', 'Flavor enhancers'), /גלוטמט|E6\d\d|תמצית שמרים|הידרוליזט|חלבון צמחי מפורק/],
    [tr('מתחלבים', 'Emulsifiers'), /לציטין|מתחלב|E47\d|E4[78]\d/],
    [tr('סוכרים תעשייתיים', 'Industrial sugars'), /סירופ גלוקוז|גלוקוז|דקסטרוז|פרוקטוז|מלטודקסטרין/],
    [tr('צבעי מאכל', 'Food colorings'), /צבע/],
    [tr('מייצבים ומסמיכים', 'Stabilizers and thickeners'), /מייצב|מסמיך|גאם|קרגינן|E4[0-6]\d|תאית/],
    [tr('עמילן מעובד', 'Modified starch'), /עמילן מעובד/],
    [tr('שומן מוקשה או מרגרינה', 'Hydrogenated fat or margarine'), /מוקשה|מרגרינה/],
    [tr('ממתיקים מלאכותיים', 'Artificial sweeteners'), /אספרטיים|אצסולפם|סוכרלוז/],
  ];
  const fam = FAMILY.map(([label, re]) => ({
    label,
    n: products.filter(p => p.ingredients.some(i => lookupIngredient(i).nova === 'marker' && re.test(i))).length,
  })).filter(x => x.n).sort((a, b) => b.n - a.n);
  const maxFam = Math.max(...fam.map(x => x.n));

  const avgIngs = [1, 2, 3, 4].map(g => {
    const l = products.filter(p => getNova(p).group === g);
    return l.length ? l.reduce((s, p) => s + p.ingredients.length, 0) / l.length : 0;
  });
  const maxAvg = Math.max(...avgIngs);
  const most = [...products].sort((a, b) => b.ingredients.length - a.ingredients.length)[0];

  return `
    <main class="page" id="page-content">
      ${breadcrumb([TOOLS_CRUMB, [tr('תובנות מהמאגר', 'Database insights')]])}
      ${pageHero('📊', tr('תובנות מהמאגר', 'Database insights'), tr(`מה אפשר ללמוד מ-${products.length} המוצרים שבדקנו`, `What we can learn from the ${products.length} products we checked`))}
      <div class="container">
        <section class="chart-card">
          <h2>${tr('כמה מעובדת כל קטגוריה?', 'How processed is each category?')}</h2>
          <p class="muted">${tr('חלוקת המוצרים בכל קטגוריה לפי קבוצת NOVA, מהקטגוריה עם הכי הרבה מוצרים אולטרה-מעובדים', 'Products in each category by NOVA group, starting with the category with the most ultra-processed products')}</p>
          <div class="nova-legend start">${[1, 2, 3, 4].map(g => `<span class="nova-legend-item"><span class="nova-dot" style="background:${NOVA_GROUPS[g].color};color:${NOVA_GROUPS[g].on}"></span>NOVA ${g} · ${NOVA_GROUPS[g].short}</span>`).join('')}</div>
          <div class="hbar-chart">
            ${cats.map(({ c, list, g }) => `
              <a class="hbar-row" href="#/category/${c.id}">
                <span class="hbar-label">${c.icon} ${c.name}</span>
                <span class="hbar-track stacked">
                  ${g.map((n, k) => n ? `<span class="hbar-seg" style="flex:${n};background:${NOVA_GROUPS[k + 1].color};color:${NOVA_GROUPS[k + 1].on}" title="NOVA ${k + 1}: ${tr(`${n} מתוך ${list.length}`, `${n} of ${list.length}`)}">${n}</span>` : '').join('')}
                </span>
                <span class="hbar-value">${Math.round((g[3] / list.length) * 100)}%</span>
              </a>`).join('')}
          </div>
          <p class="muted small">${tr('המספר משמאל: אחוז המוצרים האולטרה-מעובדים בקטגוריה.', 'The percentage next to each bar: the share of ultra-processed products in the category.')}</p>
        </section>

        <div class="chart-pair">
          <section class="chart-card">
            <h2>${tr('התוספים הנפוצים ביותר', 'The most common additives')}</h2>
            <p class="muted">${tr('בכמה מוצרים מופיע כל סוג של סמן עיבוד תעשייתי', 'How many products contain each type of industrial processing marker')}</p>
            <div class="hbar-chart">
              ${fam.map(x => `
                <div class="hbar-row" title="${x.label}: ${x.n} ${tr('מוצרים', x.n === 1 ? 'product' : 'products')}">
                  <span class="hbar-label">${x.label}</span>
                  <span class="hbar-track"><span class="hbar-fill" style="width:${(x.n / maxFam) * 100}%"></span></span>
                  <span class="hbar-value">${x.n}</span>
                </div>`).join('')}
            </div>
          </section>
          <section class="chart-card">
            <h2>${tr('כמה רכיבים יש במוצר?', 'How many ingredients does a product have?')}</h2>
            <p class="muted">${tr('ממוצע מספר הרכיבים בכל קבוצת NOVA', 'Average number of ingredients in each NOVA group')}</p>
            <div class="hbar-chart">
              ${avgIngs.map((v, k) => v ? `
                <div class="hbar-row" title="NOVA ${k + 1}: ${tr(`${v.toFixed(1)} רכיבים בממוצע`, `${v.toFixed(1)} ingredients on average`)}">
                  <span class="hbar-label">NOVA ${k + 1} · ${NOVA_GROUPS[k + 1].short}</span>
                  <span class="hbar-track"><span class="hbar-fill" style="width:${(v / maxAvg) * 100}%;background:${NOVA_GROUPS[k + 1].color};color:${NOVA_GROUPS[k + 1].on}"></span></span>
                  <span class="hbar-value">${v.toFixed(1)}</span>
                </div>` : '').join('')}
            </div>
            <p class="insight-note">💡 ${tr('הכי ארוכה במאגר:', 'Longest list in the database:')} <a href="#/product/${most.id}">${escapeHtml(most.name)}</a>${tr(`, עם ${most.ingredients.length} רכיבים.`, `, with ${most.ingredients.length} ingredients.`)}</p>
          </section>
        </div>
      </div>
    </main>`;
}

// ——————————————————————————————————————
// הידעת? — עובדות שמחושבות מהמאגר
// ——————————————————————————————————————
export function facts() {
  const n = products.length;
  const cnt = re => products.filter(p => p.ingredients.some(i => re.test(i))).length;
  const ultra = products.filter(p => getNova(p).group === 4).length;
  const flavor = cnt(/טעם וריח|חומרי טעם|חומר טעם/);
  const msg = cnt(/גלוטמט/);
  const single = products.filter(p => p.ingredients.length === 1).length;
  return [
    tr(`${ultra} מתוך ${n} המוצרים במאגר מסווגים כאולטרה-מעובדים (NOVA 4).`, `${ultra} of the ${n} products in the database are classified as ultra-processed (NOVA 4).`),
    tr(`"חומרי טעם וריח" מופיעים ב-${flavor} מוצרים. היצרן לא חייב לפרט מה הם.`, `"Flavorings" appear in ${flavor} products. Manufacturers don't have to say what they are.`),
    tr(`מונוסודיום גלוטמט (E621) נמצא ב-${msg} מוצרים במאגר, בעיקר בחטיפים מלוחים ובמנות מוכנות.`, `Monosodium glutamate (E621) is found in ${msg} products in the database, mostly in salty snacks and ready meals.`),
    tr(`ל-${single} מוצרים במאגר יש רכיב אחד בלבד, כמו חלב, עדשים ודבש.`, `${single} products in the database have just one ingredient, like milk, lentils and honey.`),
    tr('לפי רשימת הרכיבים, באבקת "מרק בטעם עוף" של אסם אין עוף, והרכיב הראשון הוא מלח.', 'According to its ingredient list, Osem\'s "chicken-flavored soup" powder contains no chicken, and its first ingredient is salt.'),
    tr('גם שוקולד מריר 70% מסווג כאולטרה-מעובד אם הוסיפו לו ונילין, חומר טעם תעשייתי.', 'Even 70% dark chocolate is classified as ultra-processed if vanillin, an industrial flavoring, was added.'),
  ];
}

// ——————————————————————————————————————
// הצוות
// ——————————————————————————————————————
const TEAM = [
  { name: tr('יאיר אברישמן', 'Yair Abrishman'), role: 'CEO', initials: tr('יא', 'YA'), hue: 145 },
  { name: tr('ליאם כהן', 'Liam Cohen'), role: 'Co-Founder', initials: tr('לכ', 'LC'), hue: 205 },
  { name: tr('אוהד קראוזמן', 'Ohad Krauzman'), role: 'Co-Founder', initials: tr('אק', 'OK'), hue: 28 },
  { name: tr('נעה אברהמי', 'Noa Avrahami'), role: tr('מנהלת מוצרים', 'Product Manager'), initials: tr('נא', 'NA'), hue: 330 },
];

export function renderTeam() {
  return `
    <main class="page" id="page-content">
      ${breadcrumb([[tr('הצוות', 'Team')]])}
      ${pageHero('👥', tr('הצוות', 'Our team'), tr('האנשים שמאחורי Tavitly', 'The people behind Tavitly'))}
      <div class="container">
        <div class="team-grid">
          ${TEAM.map(m => `
            <article class="team-card animate-item" style="--h:${m.hue}">
              <div class="team-avatar" aria-hidden="true">${m.initials}</div>
              <h2 class="team-name">${m.name}</h2>
              <p class="team-role">${m.role}</p>
            </article>`).join('')}
        </div>
        <section class="prose-card team-about">
          <h2>${tr('למה הקמנו את Tavitly', 'Why we built Tavitly')}</h2>
          <p>${tr('רובנו לא יודעים מה באמת יש באוכל שאנחנו קונים. הקמנו את Tavitly כדי שכל אחד יוכל לקרוא תווית רכיבים ולהבין אותה, בלי תואר בכימיה.', 'Most of us don\'t know what\'s really in the food we buy. We built Tavitly so anyone can read an ingredient label and understand it, no chemistry degree required.')}</p>
          <p class="muted">${tr('חסר לכם מוצר באתר? מצאתם טעות? כתבו לנו:', 'Missing a product? Found a mistake? Write to us:')} <a data-mail href="#/team">${tr('צרו קשר', 'Contact us')}</a></p>
        </section>
      </div>
    </main>`;
}

// דף המחשבונים (ראו calculators.js)
export const renderCalcPage = () => renderCalculators(breadcrumb, pageHero);
export { initCalculators };
