// ============================================================
// Tavitly — טעינת התרגום לאנגלית של הנתונים
// נטען רק במצב אנגלית, לפני הציור הראשון. שמות, תיאורים והסברים
// מוחלפים לתצוגה. רשימות הרכיבים, המפתחות והסוגים נשארים בעברית,
// כי הניתוח (NOVA, דגלים, מילון) נשען עליהם, ומתורגמים בתצוגה עם loc().
// ============================================================

import { EN, DICT } from './i18n.js?v=51';
import { products } from './data.js?v=51';
import { INGREDIENTS } from './ingredients.js?v=51';
import { localizeTerms } from './glossary.js?v=51';

export async function loadEnglish() {
  if (!EN) return;
  try {
    const res = await fetch('data/i18n/en.json?v=51', { credentials: 'omit' });
    if (!res.ok) return;
    for (const [he, en] of Object.entries(await res.json())) DICT.set(he, en);
  } catch (e) { return; }
  const t = s => (s && DICT.get(s)) || s;
  for (const p of products) {
    p.he = { name: p.name, brand: p.brand };
    p.name = t(p.name); p.brand = t(p.brand); p.summary = t(p.summary);
    if (p.short) p.short = t(p.short);
    if (p.source && p.source.label) p.source = { ...p.source, label: t(p.source.label) };
  }
  for (const v of Object.values(INGREDIENTS)) if (v.reason) v.reason = t(v.reason);
  localizeTerms(t);
}
