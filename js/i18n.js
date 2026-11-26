// ============================================================
// Tavitly — שפת האתר (עברית / English)
// השפה נשמרת במכשיר ונקבעת לפני שהמודולים נטענים, כך שכל טקסט
// יכול לבחור את הגרסה שלו כבר בזמן הטעינה. החלפת שפה טוענת את
// הדף מחדש.
// ============================================================

const KEY = 'smart-food-lang';

export const LANG = (() => {
  try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'he'; } catch (e) { return 'he'; }
})();
export const EN = LANG === 'en';

// tr('טקסט בעברית', 'English text')
export const tr = (he, en) => (EN ? en : he);

export function setLang(lang) {
  try { localStorage.setItem(KEY, lang === 'en' ? 'en' : 'he'); } catch (e) {}
  location.reload();
}

// מילון תרגום לנתונים (שמות רכיבים, סוגים, הסברים). מתמלא באנגלית
// בלבד, לפני הציור הראשון. הנתונים המקוריים נשארים בעברית, כי הניתוח
// נשען עליהם.
export const DICT = new Map();
export const loc = s => (EN && DICT.get(s)) || s;
