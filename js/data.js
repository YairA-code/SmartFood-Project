// ============================================================
// Tavitly — נתונים: קטגוריות, מוצרים ומילון רכיבים
// ============================================================

import { products } from './products.js?v=46';
import { INGREDIENTS } from './ingredients.js?v=46';
import { tr } from './i18n.js?v=46';

export { products };

// מוצר כללי (פרי, ירק, מצרך יסוד): הסימון נשמר כדגל, כי שם המותג מתורגם באנגלית
products.forEach(p => { p.generic = p.brand === 'מוצר כללי'; });
export const ingredientDB = INGREDIENTS;

export const categories = [
  { id: 'snacks', name: tr('חטיפים', 'Snacks'), icon: '🍿', description: tr('חטיפים מלוחים מתירס, חיטה ותפוחי אדמה', 'Salty snacks made from corn, wheat and potatoes') },
  { id: 'sweets', name: tr('ממתקים ושוקולד', 'Sweets & chocolate'), icon: '🍫', description: tr('שוקולדים, ופלים, סוכריות ועוגות', 'Chocolate, wafers, candy and cakes') },
  { id: 'dairy', name: tr('מוצרי חלב', 'Dairy'), icon: '🥛', description: tr('חלב, יוגורטים, גבינות, חמאה ומעדנים', 'Milk, yogurt, cheese, butter and desserts') },
  { id: 'drinks', name: tr('משקאות', 'Drinks'), icon: '🥤', description: tr('משקאות קלים, מיצים, מים ומשקאות חלב', 'Soft drinks, juices, water and milk drinks') },
  { id: 'bread', name: tr('לחם ומאפים', 'Bread & bakery'), icon: '🍞', description: tr('פיתות, לחמים, חלות וטורטיות', 'Pita, bread, challah and tortillas') },
  { id: 'canned', name: tr('מזווה', 'Pantry'), icon: '🥫', description: tr('שימורים, פסטה, אורז, קטניות ושמנים', 'Canned goods, pasta, rice, legumes and oils') },
  { id: 'cereals', name: tr('דגני בוקר', 'Breakfast cereals'), icon: '🥣', description: tr('קורנפלקס, כריות ושיבולת שועל', 'Cornflakes, filled pillows and oats') },
  { id: 'spreads', name: tr('ממרחים ורטבים', 'Spreads & sauces'), icon: '🫙', description: tr('חומוס, טחינה, ממרחים מתוקים, קטשופ ומיונז', 'Hummus, tahini, sweet spreads, ketchup and mayonnaise') },
  { id: 'meat', name: tr('בשר, עוף וביצים', 'Meat, chicken & eggs'), icon: '🍗', description: tr('עוף טרי, ביצים, נקניקים ונקניקיות', 'Fresh chicken, eggs, cold cuts and sausages') },
  { id: 'frozen', name: tr('קפואים', 'Frozen'), icon: '🧊', description: tr('ירקות, שניצלים, צ\'יפס, מאפים ופיצה', 'Vegetables, schnitzels, fries, pastries and pizza') },
  { id: 'instant', name: tr('מזון מהיר', 'Quick meals'), icon: '🍜', description: tr('מנות מוכנות, אבקות מרק ופירה', 'Ready meals, soup powders and mashed potatoes') },
  { id: 'fruits', name: tr('פירות וירקות', 'Fruits & vegetables'), icon: '🥕', description: tr('פירות וירקות טריים, הבסיס של מזון לא מעובד', 'Fresh fruits and vegetables, the basis of unprocessed food') },
];

export function getStats() {
  const unique = new Set();
  products.forEach(p => p.ingredients.forEach(i => unique.add(i.replace(/\s*\(\d+(\.\d+)?%\)/g, '').trim())));
  return {
    totalProducts: products.length,
    totalIngredients: unique.size,
    totalCategories: categories.filter(c => products.some(p => p.category === c.id)).length,
  };
}
