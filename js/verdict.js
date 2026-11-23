// ============================================================
// Smart Food — השורה התחתונה: עד שלושה דגלים אדומים לכל מוצר
// הדגלים נגזרים רק מרשימת הרכיבים, ומנוסחים כעובדה ("מכיל…"),
// כדי שבסופר אפשר יהיה להבין את המוצר בשתי שניות.
// ============================================================

import { termsOf } from './glossary.js?v=38';

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
  if (danger.length) add(10, `מכיל ${danger.slice(0, 2).map(t => short(t.name)).join(' ו')}`);

  const notDanger = t => t.risk !== 'danger';
  const preserv = of(/משמר/).filter(notDanger);
  if (preserv.length) add(preserv.length > 1 ? 8 : 4, plural(preserv.length, 'חומר משמר', 'חומרים משמרים'));
  const sweet = of(/ממתיק מלאכותי/);
  if (sweet.length) add(7, plural(sweet.length, 'ממתיק מלאכותי', 'ממתיקים מלאכותיים'));
  if (of(/מוקשה/).length) add(7, 'שומן מוקשה');
  const enhancer = of(/מחזק טעם/);
  if (enhancer.length) add(6, plural(enhancer.length, 'מחזק טעם', 'מחזקי טעם'));
  const colors = of(/צבע/).filter(notDanger);
  if (colors.length) add(5, plural(colors.length, 'צבע מאכל', 'צבעי מאכל'));
  const first = items[0];
  if (first && /^(סוכר|סירופ|גלוקוז)/.test(first.name || first.key || '')) add(6, 'סוכר הוא הרכיב הראשון');
  if (nova && nova.group === 4 && !flags.length && nova.markers && nova.markers.length) {
    add(3, `${plural(nova.markers.length, 'רכיב', 'רכיבים')} של עיבוד תעשייתי`);
  }
  return flags.sort((a, b) => b.weight - a.weight).slice(0, 3).map(f => f.text);
}
