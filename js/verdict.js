// ============================================================
// Tavitly — השורה התחתונה: עד שלושה דגלים אדומים לכל מוצר
// הדגלים נגזרים רק מרשימת הרכיבים, ומנוסחים כעובדה ("מכיל…"),
// כדי שבסופר אפשר יהיה להבין את המוצר בשתי שניות.
// ============================================================

import { termsOf } from './glossary.js?v=43';
import { tr, loc } from './i18n.js?v=43';

const plural = (n, one, many) => (n === 1 ? one : `${n} ${many}`);
const short = name => String(name).replace(/\s*\(.*\)$/, '');

// items: רכיבים מנותחים ({ name, key, type, risk, nova }), nova: תוצאת הסיווג
// כל רכיב בתווית → החומרים שהוא מכיל, בלי כפילויות
export function collectTerms(items) {
  const seen = new Map();
  for (const i of items) {
    const list = i.key ? termsOf(i.key).filter(Boolean) : [];
    if (list.length) list.forEach(t => seen.set(t.id, t));
    else if (i.type) seen.set('raw:' + (i.name || i.key), { id: 'raw', name: i.name || i.key, type: i.type, risk: i.risk, nova: i.nova });
  }
  return [...seen.values()];
}

export function redFlags(items, nova) {
  const terms = collectTerms(items);
  const of = re => terms.filter(t => re.test(t.type || ''));
  const flags = [];
  const add = (weight, text) => { if (text && !flags.some(f => f.text === text)) flags.push({ weight, text }); };

  // חומרים שמסומנים כבעייתיים במילון (ניטריט, צבעי אזו, BHA, טיטניום דו-חמצני…)
  const danger = terms.filter(t => t.risk === 'danger');
  if (danger.length) add(10, tr(`מכיל ${danger.slice(0, 2).map(t => short(t.name)).join(' ו')}`, `Contains ${danger.slice(0, 2).map(t => short(loc(t.name))).join(' and ')}`));

  const notDanger = t => t.risk !== 'danger';
  const preserv = of(/משמר/).filter(notDanger);
  if (preserv.length) add(preserv.length > 1 ? 8 : 4, plural(preserv.length, tr('חומר משמר', 'Preservative'), tr('חומרים משמרים', 'preservatives')));
  const sweet = of(/ממתיק מלאכותי/);
  if (sweet.length) add(7, plural(sweet.length, tr('ממתיק מלאכותי', 'Artificial sweetener'), tr('ממתיקים מלאכותיים', 'artificial sweeteners')));
  if (of(/מוקשה/).length) add(7, tr('שומן מוקשה', 'Hydrogenated fat'));
  const enhancer = of(/מחזק טעם/);
  if (enhancer.length) add(6, plural(enhancer.length, tr('מחזק טעם', 'Flavor enhancer'), tr('מחזקי טעם', 'flavor enhancers')));
  const colors = of(/צבע/).filter(notDanger);
  if (colors.length) add(5, plural(colors.length, tr('צבע מאכל', 'Food coloring'), tr('צבעי מאכל', 'food colorings')));
  const first = items[0];
  if (first && /^(סוכר|סירופ|גלוקוז)/.test(first.name || first.key || '')) add(6, tr('סוכר הוא הרכיב הראשון', 'Sugar is the first ingredient'));
  if (nova && nova.group === 4 && !flags.length && nova.markers && nova.markers.length) {
    add(3, tr(`${plural(nova.markers.length, 'רכיב', 'רכיבים')} של עיבוד תעשייתי`,
      nova.markers.length === 1 ? 'One industrial-processing ingredient' : `${nova.markers.length} industrial-processing ingredients`));
  }
  return flags.sort((a, b) => b.weight - a.weight).slice(0, 3).map(f => f.text);
}
