// מדפיס את המוצרים כ-JSON לבדיקה היומית: מזהה, שם, מותג, ברקודים, רכיבים ומקור
import path from 'path'; import { pathToFileURL } from 'url';
const { products } = await import(pathToFileURL(path.resolve('js/data.js')));
console.log(JSON.stringify(products.map(p => ({
  id: p.id, name: p.name, brand: p.brand, barcodes: p.barcodes || [], ingredients: p.ingredients,
  source: p.source ? p.source.url : '', unverified: !!p.unverified,
}))));
