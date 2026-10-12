// ============================================================
// Smart Food — כלים: בודק תווית, השוואה חופשית, חידון, הסל שלי,
// תובנות מהמאגר, ודף הצוות
// ============================================================

import { products, categories } from './data.js?v=13';
import { INGREDIENTS, getIngredient, canonicalName } from './ingredients.js?v=13';
import { NOVA_GROUPS, getNova, getScore, getAlternatives, lookupIngredient, classifyItems, scoreItems, novaReason } from './nova.js?v=13';
import { escapeHtml } from './utils.js?v=13';
import { art, breadcrumb, novaBadge, scoreChip, renderProductCard, RISK, ROLE, catOf, ingLink } from './components.js?v=13';

const byId = id => products.find(p => p.id === id);
const pageHero = (icon, title, text) => `
  <section class="page-hero">
    <span class="page-hero-icon" aria-hidden="true">${icon}</span>
    <h1>${title}</h1>
    <p>${text}</p>
  </section>`;

// ——————————————————————————————————————
// מרכז הכלים
// ——————————————————————————————————————
export const TOOLS = [
  { href: '#/label', icon: '🔬', title: 'בודק התווית', text: 'מדביקים רשימת רכיבים מכל מוצר, ומקבלים סיווג NOVA, ציון עיבוד והסבר לכל רכיב.' },
  { href: '#/vs', icon: '⚖️', title: 'השוואה חופשית', text: 'בוחרים שני מוצרים מהמאגר ורואים אותם זה לצד זה, רכיב מול רכיב.' },
  { href: '#/quiz', icon: '🎯', title: 'חידון NOVA', text: 'עשר שאלות: נחשו כמה מעובד כל מוצר, ובדקו כמה טוב אתם מכירים את המדף.' },
  { href: '#/basket', icon: '🛒', title: 'הסל שלי', text: 'מוסיפים מוצרים לסל ומקבלים ציון עיבוד לכל הסל, עם הצעות להחלפה.' },
  { href: '#/insights', icon: '📊', title: 'תובנות מהמאגר', text: 'גרפים על כל המאגר: איזו קטגוריה הכי מעובדת, ואילו תוספים הכי נפוצים.' },
  { href: '#/random', icon: '🎲', title: 'מוצר אקראי', text: 'לא יודעים מאיפה להתחיל? קחו מוצר אקראי מהמאגר.' },
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
      ${breadcrumb([['כלים']])}
      ${pageHero('🧰', 'כלים', 'כלים קטנים שעוזרים להבין מה יש באוכל: לבדוק תווית, להשוות, לשחק וללמוד')}
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
    if (r) return { name, type: r[0], risk: r[1], nova: r[2], reason: `זוהה לפי מספר E${e[1]}: ${r[0]}.`, how: 'enum' };
  }
  for (const [re, type, risk, nova] of KEYWORDS) {
    if (re.test(clean)) return { name, type, risk, nova, reason: `זוהה לפי מילת מפתח: ${type}.`, how: 'keyword' };
  }
  // רכיב שמכיל שם מהמילון (המילה הארוכה ביותר)
  let best = null;
  for (const [k, plain] of plainKeys()) if (plain.length >= 3 && clean.includes(plain) && (!best || plain.length > best[1].length)) best = [k, plain];
  if (best) return { name, ...INGREDIENTS[best[0]], key: best[0], how: 'partial' };
  return { name, type: 'לא מזוהה', risk: 'caution', nova: 'whole', reason: 'הרכיב לא נמצא במילון שלנו. הוא נספר כמזון בסיסי, ולכן כדאי לבדוק אותו בעצמכם.', how: 'unknown' };
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
      ${breadcrumb([['כלים', '#/tools'], ['בודק התווית']])}
      ${pageHero('🔬', 'בודק התווית', 'העתיקו את רשימת הרכיבים מאריזה של מוצר כלשהו, וקבלו סיווג NOVA, ציון עיבוד והסבר לכל רכיב')}
      <div class="container narrow">
        <div class="label-box">
          <label for="label-input" class="label-title">רשימת הרכיבים, כפי שהיא כתובה על האריזה</label>
          <textarea id="label-input" rows="5" placeholder="לדוגמה: ${LABEL_EXAMPLE}"></textarea>
          <div class="label-actions">
            <button class="btn btn-primary" id="label-run">בדיקה</button>
            <button class="btn btn-ghost" id="label-example">דוגמה</button>
            <button class="btn btn-ghost" id="label-clear">ניקוי</button>
          </div>
          <p class="muted small">הניתוח נעשה בדפדפן, לפי מילון הרכיבים שלנו וחוקי NOVA. רכיב שלא זוהה מסומן, וכדאי לבדוק אותו בעצמכם.</p>
        </div>
        <div id="label-result" aria-live="polite"></div>
      </div>
    </main>`;
}

function labelResultHTML(r) {
  if (!r) return '<div class="empty-note">לא נמצאו רכיבים. הדביקו רשימה שהרכיבים בה מופרדים בפסיקים.</div>';
  const { items, nova, score } = r;
  const C = 2 * Math.PI * 54;
  const level = score <= 2 ? 'low' : score <= 5 ? 'mid' : 'high';
  const unknown = items.filter(i => i.how === 'unknown').length;
  const counts = { safe: 0, caution: 0, danger: 0 };
  items.forEach(i => counts[i.risk]++);
  const reason = nova.group === 4
    ? `נמצאו ${nova.markers.length === 1 ? 'רכיב אחד' : nova.markers.length + ' רכיבים'} שמאפיינים עיבוד תעשייתי: ${nova.markers.join(', ')}.`
    : nova.group === 3 ? 'מזון בסיסי עם מלח, סוכר, שמן או תוספים לשימור, בלי רכיבים שמאפיינים עיבוד תעשייתי.'
    : nova.group === 2 ? 'רכיבי בישול בלבד.' : 'כל הרכיבים שזוהו הם מזון בסיסי.';
  return `
    <div class="label-summary nova-panel" style="--nova:${nova.color};--nova-bg:${nova.bg}">
      <div class="nova-panel-num" aria-hidden="true">${nova.group}</div>
      <div class="nova-panel-body">
        <p class="eyebrow">תוצאה</p>
        <h2 class="nova-panel-title">NOVA ${nova.group}: ${nova.name}</h2>
        <p class="nova-panel-text">${escapeHtml(reason)}</p>
        <div class="risk-summary">
          <span class="count-badge risk-safe">${counts.safe} בטוחים</span>
          <span class="count-badge risk-caution">${counts.caution} במידה</span>
          <span class="count-badge risk-danger">${counts.danger} בעייתיים</span>
          ${unknown ? `<span class="count-badge unknown">${unknown} לא זוהו</span>` : ''}
        </div>
      </div>
      <div class="gauge small score-${level}" aria-label="ציון עיבוד ${score} מתוך 10">
        <svg viewBox="0 0 120 120" class="gauge-svg" aria-hidden="true"><circle class="gauge-bg" cx="60" cy="60" r="54"/><circle class="gauge-fill" cx="60" cy="60" r="54" style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - score / 10)}"/></svg>
        <div class="gauge-center"><span class="gauge-number">${score}</span><span class="gauge-max">/10</span></div>
        <span class="gauge-label">ציון עיבוד</span>
      </div>
    </div>
    <ol class="ing-list">
      ${items.map(i => `
        <li class="ing-row ${RISK[i.risk].cls} ${i.how === 'unknown' ? 'is-unknown' : ''}">
          <span class="ing-risk ${RISK[i.risk].cls}">${i.how === 'unknown' ? '?' : RISK[i.risk].label}</span>
          <div class="ing-main">
            ${i.key ? `<a class="ing-name" href="${ingLink(i.key)}">${escapeHtml(i.name)}</a>` : `<span class="ing-name">${escapeHtml(i.name)}</span>`}
            <span class="ing-type">${escapeHtml(i.type)}${i.how !== 'unknown' ? ` · ${ROLE[i.nova]}` : ''}</span>
            ${i.nova === 'marker' ? '<span class="nova-marker">סמן NOVA 4</span>' : ''}
          </div>
          <p class="ing-reason">${escapeHtml(i.reason)}</p>
        </li>`).join('')}
    </ol>
    <p class="source-note">זו הערכה אוטומטית לפי רשימת הרכיבים בלבד, ולא סיווג רשמי. מידע לימודי ולא ייעוץ תזונתי.</p>`;
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
      <option value="">בחרו מוצר…</option>
      ${categories.filter(c => products.some(p => p.category === c.id)).map(c => `
        <optgroup label="${c.name}">
          ${products.filter(p => p.category === c.id).sort((a, b) => a.name.localeCompare(b.name, 'he')).map(p => `<option value="${p.id}" ${p.id === selected ? 'selected' : ''}>${escapeHtml(p.name)} · ${escapeHtml(p.brand)}</option>`).join('')}
        </optgroup>`).join('')}
    </select>`;
}

function vsColumn(p) {
  if (!p) return '<div class="vs-col vs-empty"><span aria-hidden="true">➕</span><p>בחרו מוצר מהרשימה</p></div>';
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
        <div><dt>רכיבים</dt><dd>${p.ingredients.length}</dd></div>
        <div><dt>סמני עיבוד</dt><dd>${n.markers.length}</dd></div>
        <div><dt>בעייתיים</dt><dd>${counts.danger}</dd></div>
      </dl>
      <ul class="vs-ings">
        ${items.map(i => `<li class="${i.nova === 'marker' ? 'is-marker' : ''}"><span class="dot ${RISK[i.risk].cls}" aria-hidden="true"></span><a href="${ingLink(i.key)}">${escapeHtml(i.name)}</a>${i.nova === 'marker' ? '<span class="nova-marker">סמן</span>' : ''}</li>`).join('')}
      </ul>
    </div>`;
}

export function renderVs(a, b) {
  const pa = byId(a), pb = byId(b);
  let verdict = '';
  if (pa && pb && pa !== pb) {
    const sa = getScore(pa), sb = getScore(pb), na = getNova(pa).group, nb = getNova(pb).group;
    if (na === nb && sa === sb) verdict = `לשני המוצרים אותה דרגת עיבוד (NOVA ${na}, ציון ${sa}/10).`;
    else {
      const [win, lose] = (na < nb || (na === nb && sa < sb)) ? [pa, pb] : [pb, pa];
      verdict = `<strong>${escapeHtml(win.name)}</strong> מעובד פחות: NOVA ${getNova(win).group} וציון ${getScore(win)}/10, לעומת NOVA ${getNova(lose).group} וציון ${getScore(lose)}/10.`;
    }
  }
  return `
    <main class="page" id="page-content">
      ${breadcrumb([['כלים', '#/tools'], ['השוואה חופשית']])}
      ${pageHero('⚖️', 'השוואה חופשית', 'בחרו שני מוצרים מכל המאגר ורואים אותם זה לצד זה')}
      <div class="container">
        <div class="vs-pickers">
          <label><span>מוצר ראשון</span>${productSelect('vs-a', a)}</label>
          <button class="icon-btn" id="vs-swap" aria-label="החלפת הצדדים" title="החלפת הצדדים">⇄</button>
          <label><span>מוצר שני</span>${productSelect('vs-b', b)}</label>
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
    const msg = s === n ? 'מושלם. אתם מכירים את המדף בעל פה.' : s >= n * 0.7 ? 'יפה מאוד, עין חדה לתוויות.' : s >= n * 0.4 ? 'לא רע. שווה להציץ בדף מדד NOVA.' : 'זה מפתיע הרבה אנשים. הדף על מדד NOVA יעזור.';
    return `
      <div class="quiz-card quiz-end">
        <span class="quiz-big" aria-hidden="true">${s >= n * 0.7 ? '🏆' : '🎯'}</span>
        <h2>${s} מתוך ${n}</h2>
        <p>${msg}</p>
        <div class="label-actions center"><button class="btn btn-primary" id="quiz-again">משחק חדש</button><a class="btn btn-ghost" href="#/nova">מה זה מדד NOVA?</a></div>
      </div>`;
  }
  const p = quiz.list[quiz.i];
  return `
    <div class="quiz-card">
      <div class="quiz-progress" aria-label="שאלה ${quiz.i + 1} מתוך ${quiz.list.length}">
        ${quiz.list.map((_, k) => `<span class="${k < quiz.i ? 'done' : k === quiz.i ? 'now' : ''}"></span>`).join('')}
      </div>
      <p class="muted">שאלה ${quiz.i + 1} מתוך ${quiz.list.length} · ניקוד: ${quiz.score}</p>
      <div class="quiz-product">${art(p, 'art-card')}<h2>${escapeHtml(p.name)}</h2><p class="card-brand">${escapeHtml(p.brand)}</p></div>
      <p class="quiz-q">באיזו קבוצת NOVA המוצר הזה?</p>
      <div class="quiz-options" role="group" aria-label="תשובות">
        ${[1, 2, 3, 4].map(g => `<button class="quiz-opt" data-g="${g}" style="--nova:${NOVA_GROUPS[g].color};--nova-bg:${NOVA_GROUPS[g].bg}"><strong>${g}</strong><span>${NOVA_GROUPS[g].short}</span></button>`).join('')}
      </div>
      <div id="quiz-feedback" aria-live="polite"></div>
    </div>`;
}

export function renderQuiz() {
  if (!quiz.list.length || quiz.i >= quiz.list.length) newQuiz();
  return `
    <main class="page" id="page-content">
      ${breadcrumb([['כלים', '#/tools'], ['חידון NOVA']])}
      ${pageHero('🎯', 'חידון NOVA', 'עשרה מוצרים מהמאגר. נחשו כמה כל אחד מעובד')}
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
        <strong>${ok ? 'נכון.' : `לא בדיוק. התשובה: NOVA ${right}`}</strong>
        <p>${escapeHtml(novaReason(p))}</p>
        <div class="label-actions"><button class="btn btn-primary" id="quiz-next">${quiz.i + 1 < quiz.list.length ? 'לשאלה הבאה' : 'לתוצאה'}</button><a class="btn btn-ghost" href="#/product/${p.id}">לדף המוצר</a></div>
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
    ${breadcrumb([['כלים', '#/tools'], ['הסל שלי']])}
    ${pageHero('🛒', 'הסל שלי', 'הוסיפו מוצרים מכל דף מוצר בכפתור "הוספה לסל", וקבלו תמונה של כל הסל')}`;
  if (!list.length) {
    return `<main class="page" id="page-content">${head}
      <div class="container narrow"><div class="empty-note big">
        <span class="quiz-big" aria-hidden="true">🛒</span>
        <p>הסל ריק. אפשר להתחיל מאחת הקטגוריות, או למלא את הסל בדוגמה.</p>
        <div class="label-actions center"><a class="btn btn-primary" href="#/categories">לקטגוריות</a><button class="btn btn-ghost" id="basket-demo">סל לדוגמה</button></div>
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
          <div class="stat-tile"><span class="stat-number">${list.length}</span><span class="stat-label">מוצרים בסל</span></div>
          <div class="stat-tile score-${level}"><span class="stat-number">${avg.toFixed(1)}</span><span class="stat-label">ציון עיבוד ממוצע (מתוך 10)</span></div>
          <div class="stat-tile"><span class="stat-number">${ultraShare}%</span><span class="stat-label">אולטרה-מעובדים</span></div>
        </div>
        <div class="nova-bar" role="img" aria-label="${[1, 2, 3, 4].map(g => `NOVA ${g}: ${groups[g - 1]}`).join(', ')}">
          ${[1, 2, 3, 4].map(g => groups[g - 1] ? `<span class="nova-bar-seg" style="flex:${groups[g - 1]};background:${NOVA_GROUPS[g].color};color:${NOVA_GROUPS[g].on}" title="NOVA ${g}: ${groups[g - 1]} מוצרים"><span>${groups[g - 1]}</span></span>` : '').join('')}
        </div>
        <div class="nova-legend">${[1, 2, 3, 4].map(g => `<span class="nova-legend-item"><span class="nova-dot" style="background:${NOVA_GROUPS[g].color};color:${NOVA_GROUPS[g].on}"></span>NOVA ${g} · ${NOVA_GROUPS[g].short}</span>`).join('')}</div>

        ${swaps.length ? `
          <div class="section-head start"><h2 class="section-title">הצעות להחלפה</h2><p class="section-subtitle">חלופה מעובדת פחות מאותו סוג, לכל מוצר שאפשר</p></div>
          <div class="swap-list">
            ${swaps.map(({ p, alt }) => `
              <div class="swap-row">
                <a href="#/product/${p.id}" class="swap-side">${art(p, 'art-xs')}<span>${escapeHtml(p.name)}</span>${novaBadge(p)}</a>
                <span class="teaser-arrow" aria-hidden="true">←</span>
                <a href="#/product/${alt.id}" class="swap-side">${art(alt, 'art-xs')}<span>${escapeHtml(alt.name)}</span>${novaBadge(alt)}</a>
                <button class="btn btn-ghost btn-sm" data-swap="${p.id}" data-to="${alt.id}">החלפה בסל</button>
              </div>`).join('')}
          </div>` : ''}

        <div class="section-head start"><h2 class="section-title">המוצרים בסל</h2></div>
        <div class="products-grid">${list.map(p => `<div class="basket-item">${renderProductCard(p)}<button class="basket-remove" data-remove="${p.id}" aria-label="הסרת ${escapeHtml(p.name)} מהסל">✕</button></div>`).join('')}</div>
        <div class="center-cta"><button class="btn btn-ghost" id="basket-clear">ריקון הסל</button></div>
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
    ['חומרי טעם וריח', /טעם וריח|חומרי טעם|חומר טעם|ונילין/],
    ['מחזקי טעם', /גלוטמט|E6\d\d|תמצית שמרים|הידרוליזט|חלבון צמחי מפורק/],
    ['מתחלבים', /לציטין|מתחלב|E47\d|E4[78]\d/],
    ['סוכרים תעשייתיים', /סירופ גלוקוז|גלוקוז|דקסטרוז|פרוקטוז|מלטודקסטרין/],
    ['צבעי מאכל', /צבע/],
    ['מייצבים ומסמיכים', /מייצב|מסמיך|גאם|קרגינן|E4[0-6]\d|תאית/],
    ['עמילן מעובד', /עמילן מעובד/],
    ['שומן מוקשה או מרגרינה', /מוקשה|מרגרינה/],
    ['ממתיקים מלאכותיים', /אספרטיים|אצסולפם|סוכרלוז/],
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
      ${breadcrumb([['כלים', '#/tools'], ['תובנות מהמאגר']])}
      ${pageHero('📊', 'תובנות מהמאגר', `מה אפשר ללמוד מ-${products.length} המוצרים שבדקנו`)}
      <div class="container">
        <section class="chart-card">
          <h2>כמה מעובדת כל קטגוריה?</h2>
          <p class="muted">חלוקת המוצרים בכל קטגוריה לפי קבוצת NOVA, מהקטגוריה עם הכי הרבה מוצרים אולטרה-מעובדים</p>
          <div class="nova-legend start">${[1, 2, 3, 4].map(g => `<span class="nova-legend-item"><span class="nova-dot" style="background:${NOVA_GROUPS[g].color};color:${NOVA_GROUPS[g].on}"></span>NOVA ${g} · ${NOVA_GROUPS[g].short}</span>`).join('')}</div>
          <div class="hbar-chart">
            ${cats.map(({ c, list, g }) => `
              <a class="hbar-row" href="#/category/${c.id}">
                <span class="hbar-label">${c.icon} ${c.name}</span>
                <span class="hbar-track stacked">
                  ${g.map((n, k) => n ? `<span class="hbar-seg" style="flex:${n};background:${NOVA_GROUPS[k + 1].color};color:${NOVA_GROUPS[k + 1].on}" title="NOVA ${k + 1}: ${n} מתוך ${list.length}">${n}</span>` : '').join('')}
                </span>
                <span class="hbar-value">${Math.round((g[3] / list.length) * 100)}%</span>
              </a>`).join('')}
          </div>
          <p class="muted small">המספר משמאל: אחוז המוצרים האולטרה-מעובדים בקטגוריה.</p>
        </section>

        <div class="chart-pair">
          <section class="chart-card">
            <h2>התוספים הנפוצים ביותר</h2>
            <p class="muted">בכמה מוצרים מופיע כל סוג של סמן עיבוד תעשייתי</p>
            <div class="hbar-chart">
              ${fam.map(x => `
                <div class="hbar-row" title="${x.label}: ${x.n} מוצרים">
                  <span class="hbar-label">${x.label}</span>
                  <span class="hbar-track"><span class="hbar-fill" style="width:${(x.n / maxFam) * 100}%"></span></span>
                  <span class="hbar-value">${x.n}</span>
                </div>`).join('')}
            </div>
          </section>
          <section class="chart-card">
            <h2>כמה רכיבים יש במוצר?</h2>
            <p class="muted">ממוצע מספר הרכיבים בכל קבוצת NOVA</p>
            <div class="hbar-chart">
              ${avgIngs.map((v, k) => v ? `
                <div class="hbar-row" title="NOVA ${k + 1}: ${v.toFixed(1)} רכיבים בממוצע">
                  <span class="hbar-label">NOVA ${k + 1} · ${NOVA_GROUPS[k + 1].short}</span>
                  <span class="hbar-track"><span class="hbar-fill" style="width:${(v / maxAvg) * 100}%;background:${NOVA_GROUPS[k + 1].color};color:${NOVA_GROUPS[k + 1].on}"></span></span>
                  <span class="hbar-value">${v.toFixed(1)}</span>
                </div>` : '').join('')}
            </div>
            <p class="insight-note">💡 הכי ארוכה במאגר: <a href="#/product/${most.id}">${escapeHtml(most.name)}</a>, עם ${most.ingredients.length} רכיבים.</p>
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
    `${ultra} מתוך ${n} המוצרים במאגר מסווגים כאולטרה-מעובדים (NOVA 4).`,
    `"חומרי טעם וריח" מופיעים ב-${flavor} מוצרים. היצרן לא חייב לפרט מה הם.`,
    `מונוסודיום גלוטמט (E621) נמצא ב-${msg} מוצרים במאגר, בעיקר בחטיפים מלוחים ובמנות מוכנות.`,
    `ל-${single} מוצרים במאגר יש רכיב אחד בלבד, כמו חלב, עדשים ודבש.`,
    'אבקת "מרק בטעם עוף" של אסם לא מכילה עוף: הרכיב הראשון שלה הוא מלח.',
    'גם שוקולד מריר 70% מסווג כאולטרה-מעובד אם הוסיפו לו ונילין, חומר טעם תעשייתי.',
  ];
}

// ——————————————————————————————————————
// הצוות
// ——————————————————————————————————————
const TEAM = [
  { name: 'יאיר פנחס אברישמן', role: 'Founder & CEO', initials: 'יא', hue: 145 },
  { name: 'ליאם כהן', role: 'Co-Founder & VP', initials: 'לכ', hue: 205 },
  { name: 'אוהד קראוזמן', role: 'Co-Founder & COO', initials: 'אק', hue: 28 },
  { name: 'נעה אברהמי', role: 'Head of Product Sourcing & Deputy Inventor', initials: 'נא', hue: 330 },
];

export function renderTeam() {
  return `
    <main class="page" id="page-content">
      ${breadcrumb([['הצוות']])}
      ${pageHero('👥', 'הצוות', 'האנשים שמאחורי Smart Food')}
      <div class="container">
        <div class="team-grid">
          ${TEAM.map(m => `
            <article class="team-card animate-item" style="--h:${m.hue}">
              <div class="team-avatar" aria-hidden="true">${m.initials}</div>
              <h2 class="team-name">${m.name}</h2>
              <p class="team-role" dir="ltr" lang="en">${m.role}</p>
            </article>`).join('')}
        </div>
        <section class="prose-card team-about">
          <h2>על הפרויקט</h2>
          <p>Smart Food נבנה כפרויקט סיום בקורס "מבוא לבינה מלאכותית", במסגרת התואר BSc במערכות מידע. המטרה: להפוך את תווית הרכיבים למשהו שכל אחד יכול להבין.</p>
          <p class="muted">חסר לכם מוצר באתר? כתבו לנו: <a data-mail href="#/team">צרו קשר</a></p>
        </section>
      </div>
    </main>`;
}
