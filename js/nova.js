// ============================================================
// Smart Food — סיווג NOVA, ציון עיבוד והתאמת רכיבים
// הסיווג נקבע לפי רשימת הרכיבים ולפי ההגדרות של מערכת NOVA
// (Monteiro ועמיתיו, אוניברסיטת סאו פאולו). כל רכיב במילון מסומן
// בתפקידו: מזון בסיסי, רכיב בישול, רכיב מעובד, תוסף, או סמן לעיבוד תעשייתי.
// ============================================================

import { products } from './data.js?v=14';
import { INGREDIENTS, getIngredient, canonicalName } from './ingredients.js?v=14';

export const NOVA_GROUPS = {
  1: {
    num: 1, name: 'לא מעובד או מעובד מינימלית', short: 'טבעי',
    color: '#0f7a4f', on: '#ffffff', bg: '#dcfce7',
    desc: 'מזון כפי שהוא בטבע, או אחרי עיבוד פשוט כמו ניקוי, ייבוש, קירור, טחינה, פסטור או התססה.',
    examples: 'ירקות, פירות, ביצים, קטניות, אורז, חלב, בשר טרי',
  },
  2: {
    num: 2, name: 'רכיבי בישול מעובדים', short: 'רכיב בישול',
    color: '#a8a210', on: '#1c1a00', bg: '#f7f7c9',
    desc: 'חומרים שמפיקים ממזון טבעי ומשמשים לבישול ולתיבול, ולא נאכלים לבד.',
    examples: 'שמן זית, חמאה, סוכר, מלח, דבש',
  },
  3: {
    num: 3, name: 'מזון מעובד', short: 'מעובד',
    color: '#e86a12', on: '#1f0b00', bg: '#ffedd5',
    desc: 'מזון טבעי שהוסיפו לו מלח, סוכר, שמן או חומר משמר, כדי להאריך חיי מדף או לשפר טעם.',
    examples: 'שימורים, גבינות, לחם פשוט, טונה בשמן',
  },
  4: {
    num: 4, name: 'מזון אולטרה-מעובד', short: 'אולטרה-מעובד',
    color: '#b42318', on: '#ffffff', bg: '#fee2e2',
    desc: 'מוצר תעשייתי שמכיל רכיבים שלא משתמשים בהם במטבח הביתי: צבעי מאכל, חומרי טעם, מחזקי טעם, מתחלבים, מייצבים, ממתיקים, עמילן מעובד וחלבונים מבודדים.',
    examples: 'חטיפים, משקאות ממותקים, נקניקיות, מנות מוכנות',
  },
};

const FALLBACK = { type: 'לא מסווג', risk: 'caution', nova: 'whole', reason: 'אין עדיין הסבר לרכיב הזה.' };

export function lookupIngredient(raw) {
  const hit = getIngredient(raw) || FALLBACK;
  return { ...hit, novaClass: hit.nova, matched: hit !== FALLBACK, key: INGREDIENTS[raw] ? raw : canonicalName(raw) };
}

// ——————————————————————————————————————
// סיווג NOVA
// ——————————————————————————————————————
const novaCache = new Map();

// סיווג רשימת רכיבים (משמש גם את "בודק התווית")
export function classifyItems(items) {
  const has = c => items.some(x => x.nova === c);
  // ויטמינים ומינרלים שהוספו להעשרה לא משנים את דרגת העיבוד
  const enrich = x => x.nova === 'additive' && /העשרה|תוסף תזונה|ויטמין/.test(x.type);
  const tech = items.some(x => x.nova === 'additive' && !enrich(x));
  let group;
  if (has('marker')) group = 4;
  else if (has('processed')) group = 3;
  else if (has('whole') && (has('culinary') || tech)) group = 3;
  else if (has('culinary') || tech) group = 2;
  else group = 1;
  const markers = items.filter(x => x.nova === 'marker').map(x => x.name);
  return { group, markers, ...NOVA_GROUPS[group] };
}

export function scoreItems(items, n) {
  let score;
  if (n.group === 1) score = 1;
  else if (n.group === 2) score = 2;
  else if (n.group === 3) {
    score = 3;
    if (items.some(x => x.nova === 'culinary' && x.type === 'ממתיק')) score += 1;
    if (items.some(x => x.type === 'חומר משמר')) score += 1;
  } else {
    score = 6 + Math.min(3, Math.floor((n.markers.length - 1) / 2));
    if (items.some(x => x.risk === 'danger')) score += 1;
  }
  return Math.min(10, score);
}

export function getNova(product) {
  if (novaCache.has(product.id)) return novaCache.get(product.id);
  const items = product.ingredients.map(i => ({ name: i, ...lookupIngredient(i) }));
  const result = classifyItems(items);
  novaCache.set(product.id, result);
  return result;
}

export function novaReason(product) {
  const n = getNova(product);
  if (n.group === 4) return `המוצר מכיל ${n.markers.length === 1 ? 'רכיב אחד' : n.markers.length + ' רכיבים'} שמאפיינים עיבוד תעשייתי: ${n.markers.join(', ')}.`;
  if (n.group === 3) return 'מזון בסיסי שהוסיפו לו מלח, סוכר, שמן או תוספים לשימור. אין בו רכיבים שמאפיינים עיבוד תעשייתי.';
  if (n.group === 2) return 'רכיב בישול בסיסי, שמשמש להכנת אוכל ולא נאכל לבד.';
  return 'כל הרכיבים טבעיים או עברו עיבוד מינימלי בלבד.';
}

// ——————————————————————————————————————
// ציון עיבוד (1 עד 10)
// NOVA 1 = 1, NOVA 2 = 2
// NOVA 3 = 3, ועוד נקודה על סוכר מוסף ועוד נקודה על חומר משמר (עד 5)
// NOVA 4 = 6, ועוד נקודה על כל שני סמנים נוספים (עד 3),
//          ועוד נקודה אם יש רכיב בדרגת סיכון "בעייתי" (עד 10)
// ——————————————————————————————————————
const scoreCache = new Map();

export function getScore(product) {
  if (scoreCache.has(product.id)) return scoreCache.get(product.id);
  const items = product.ingredients.map(lookupIngredient);
  const score = scoreItems(items, getNova(product));
  scoreCache.set(product.id, score);
  return score;
}

// ——————————————————————————————————————
// חלופות: מאותה קטגוריה, מעובדות פחות
// ——————————————————————————————————————
export function getAlternatives(product, limit = 3) {
  const n = getNova(product).group;
  const s = getScore(product);
  const kinds = product.kinds || [];
  const related = p => kinds.length ? (p.kinds || []).some(k => kinds.includes(k)) : p.category === product.category;
  return products
    .filter(p => p.id !== product.id && related(p))
    .filter(p => getNova(p).group < n || (getNova(p).group === n && getScore(p) < s))
    .sort((a, b) => getNova(a).group - getNova(b).group || getScore(a) - getScore(b))
    .slice(0, limit);
}
