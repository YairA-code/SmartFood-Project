// ============================================================
// Smart Food — נתונים: קטגוריות, מוצרים ומילון רכיבים
// ============================================================

import { products } from './products.js?v=13';
import { INGREDIENTS } from './ingredients.js?v=13';

export { products };
export const ingredientDB = INGREDIENTS;

export const categories = [
  { id: 'snacks', name: 'חטיפים', icon: '🍿', description: 'חטיפים מלוחים מתירס, חיטה ותפוחי אדמה' },
  { id: 'sweets', name: 'ממתקים ושוקולד', icon: '🍫', description: 'שוקולדים, ופלים, סוכריות ועוגות' },
  { id: 'dairy', name: 'מוצרי חלב', icon: '🥛', description: 'חלב, יוגורטים, גבינות, חמאה ומעדנים' },
  { id: 'drinks', name: 'משקאות', icon: '🥤', description: 'משקאות קלים, מיצים, מים ומשקאות חלב' },
  { id: 'bread', name: 'לחם ומאפים', icon: '🍞', description: 'פיתות, לחמים, חלות וטורטיות' },
  { id: 'canned', name: 'מזווה', icon: '🥫', description: 'שימורים, פסטה, אורז, קטניות ושמנים' },
  { id: 'cereals', name: 'דגני בוקר', icon: '🥣', description: 'קורנפלקס, כריות ושיבולת שועל' },
  { id: 'spreads', name: 'ממרחים ורטבים', icon: '🫙', description: 'חומוס, טחינה, ממרחים מתוקים, קטשופ ומיונז' },
  { id: 'meat', name: 'בשר, עוף וביצים', icon: '🍗', description: 'עוף טרי, ביצים, נקניקים ונקניקיות' },
  { id: 'frozen', name: 'קפואים', icon: '🧊', description: 'ירקות, שניצלים, צ\'יפס, מאפים ופיצה' },
  { id: 'instant', name: 'מזון מהיר', icon: '🍜', description: 'מנות מוכנות, אבקות מרק ופירה' },
  { id: 'fruits', name: 'פירות וירקות', icon: '🥕', description: 'פירות וירקות טריים, הבסיס של מזון לא מעובד' },
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
