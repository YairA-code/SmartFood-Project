// ============================================================
// Tavitly — קומפוננטות רינדור
// ============================================================

import { categories, products, getStats } from './data.js?v=48';
import { escapeHtml } from './utils.js?v=48';
import { productArt } from './art.js?v=48';
import { toolCards, TOOLS, facts } from './widgets.js?v=48';
import { scanButton } from './scan.js?v=48';
import { NOVA_GROUPS, getNova, novaReason, lookupIngredient, getScore, getAlternatives } from './nova.js?v=48';
import { PHOTOS } from './photos.js?v=48';
import { redFlags } from './verdict.js?v=48';
import { avoidHTML } from './personal.js?v=48';
import { attachProducts, allTerms, findTerms, termSearchText } from './glossary.js?v=48';
import { tr, EN, loc } from './i18n.js?v=48';

const CAT_HUE = { snacks: 38, sweets: 18, dairy: 205, drinks: 188, bread: 32, canned: 85, cereals: 46, spreads: 12, meat: 355, frozen: 198, instant: 26, fruits: 130 };
export const RISK = {
  safe: { label: tr('בטוח', 'Safe'), cls: 'risk-safe' },
  caution: { label: tr('במידה', 'In moderation'), cls: 'risk-caution' },
  danger: { label: tr('בעייתי', 'Problematic'), cls: 'risk-danger' },
};
export const ROLE = {
  whole: tr('מזון בסיסי', 'Whole food'),
  culinary: tr('רכיב בישול', 'Culinary ingredient'),
  processed: tr('רכיב מעובד', 'Processed ingredient'),
  additive: tr('תוסף', 'Additive'),
  marker: tr('סמן NOVA 4', 'NOVA 4 marker'),
};

const activeCategories = () => categories.filter(c => products.some(p => p.category === c.id));
export const catOf = p => categories.find(c => c.id === p.category) || { name: '', icon: '' };
export const ingLink = name => `#/ingredient/${encodeURIComponent(name)}`;
const nProducts = n => `${n} ${tr('מוצרים', n === 1 ? 'product' : 'products')}`;

// ——————————————————————————————————————
// רכיבים קטנים
// ——————————————————————————————————————
export function novaBadge(product, size = '') {
  const n = getNova(product);
  return `<span class="nova-badge ${size}" style="--nova:${n.color};--nova-bg:${n.bg}" title="${n.name}">NOVA ${n.group} · ${n.short}</span>`;
}

export function scoreChip(product) {
  const s = getScore(product);
  const level = s <= 2 ? 'low' : s <= 5 ? 'mid' : 'high';
  return `<span class="score-chip score-${level}" title="${tr('ציון עיבוד', 'Processing score')}">${tr('ציון', 'Score')} ${s}/10</span>`;
}

export function art(product, cls = '') {
  return productArt(product, cls);
}

// ——————————————————————————————————————
// Header / Footer
// ——————————————————————————————————————
export function renderHeader() {
  return `
    <a class="skip-link" href="#page-wrapper">${tr('דלג לתוכן', 'Skip to content')}</a>
    <header class="main-header" id="main-header">
      <div class="header-inner">
        <a href="#/" class="logo" aria-label="${tr('Tavitly, דף הבית', 'Tavitly, home page')}">
          <img src="img/art/herb.webp" alt="" class="logo-mark" width="36" height="36">
          <span class="logo-text">Tavit<span class="logo-highlight">ly</span></span>
        </a>
        <nav class="main-nav" id="main-nav" aria-label="${tr('ניווט ראשי', 'Main navigation')}">
          <a href="#/" class="nav-link" data-page="home">${tr('דף הבית', 'Home')}</a>
          <a href="#/categories" class="nav-link" data-page="categories">${tr('קטגוריות', 'Categories')}</a>
          <a href="#/compare" class="nav-link" data-page="compare">${tr('השוואות', 'Comparisons')}</a>
          <a href="#/tools" class="nav-link" data-page="tools">${tr('כלים', 'Tools')}</a>
          <a href="#/ingredients" class="nav-link" data-page="ingredients">${tr('מילון רכיבים', 'Ingredient glossary')}</a>
          <a href="#/nova" class="nav-link" data-page="nova">${tr('מדד NOVA', 'NOVA scale')}</a>
          <a href="#/team" class="nav-link" data-page="team">${tr('צוות', 'Team')}</a>
          <a href="#/about" class="nav-link" data-page="about">${tr('אודות', 'About')}</a>
        </nav>
        <div class="header-actions">
          <a href="#/basket" class="icon-btn basket-btn" id="basket-btn" aria-label="${tr('הסל שלי', 'My basket')}">🛒<span class="basket-count" id="basket-count" hidden>0</span></a>
          <button class="icon-btn lang-toggle" id="lang-toggle" aria-label="${tr('Switch to English', 'מעבר לעברית')}" lang="${tr('en', 'he')}">${tr('EN', 'עב')}</button>
          <button class="icon-btn theme-toggle" id="theme-toggle" aria-label="${tr('מעבר בין מצב בהיר לכהה', 'Switch between light and dark mode')}">
            <span class="theme-icon-light" aria-hidden="true">☀️</span>
            <span class="theme-icon-dark" aria-hidden="true">🌙</span>
          </button>
          <button class="icon-btn mobile-menu-btn" id="mobile-menu-btn" aria-label="${tr('פתיחת תפריט', 'Open menu')}" aria-expanded="false" aria-controls="main-nav">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </header>
    <nav class="tabbar" aria-label="${tr('ניווט מהיר', 'Quick navigation')}">
      <a href="#/" class="tab-link" data-page="home"><span class="tab-ico" aria-hidden="true">🏠</span>${tr('בית', 'Home')}</a>
      <a href="#/products" class="tab-link" data-page="products"><span class="tab-ico" aria-hidden="true">🛒</span>${tr('מוצרים', 'Products')}</a>
      <a href="#/scan" class="tab-link tab-scan" data-page="scan" aria-label="${tr('סריקת ברקוד', 'Scan a barcode')}"><span class="tab-fab" aria-hidden="true"><span class="scan-ico"></span></span>${tr('סריקה', 'Scan')}</a>
      <a href="#/tools" class="tab-link" data-page="tools"><span class="tab-ico" aria-hidden="true">🧰</span>${tr('כלים', 'Tools')}</a>
      <a href="#/ingredients" class="tab-link" data-page="ingredients"><span class="tab-ico" aria-hidden="true">📖</span>${tr('מילון', 'Glossary')}</a>
    </nav>
  `;
}

export function renderFooter() {
  return `
    <footer class="main-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <a href="#/" class="logo">
            <img src="img/art/herb.webp" alt="" class="logo-mark" width="32" height="32">
            <span class="logo-text">Tavit<span class="logo-highlight">ly</span></span>
          </a>
          <p>${tr('מה באמת יש בתווית: ניתוח של מוצרי מזון מהסופר בישראל לפי מדד NOVA, עם הסבר פשוט לכל רכיב. המידע כללי ואינו ייעוץ רפואי או תזונתי.', "What's really on the label: an analysis of Israeli supermarket food products using the NOVA scale, with a simple explanation of every ingredient. The information is general and is not medical or nutritional advice.")}</p>
          <p class="footer-mail">${tr('חסר מוצר? כתבו לנו:', 'Missing a product? Write to us:')} <a data-mail href="#/team">${tr('צרו קשר', 'Contact us')}</a></p>
        </div>
        <div class="footer-col">
          <h2 class="footer-h">${tr('קטגוריות', 'Categories')}</h2>
          <ul>${activeCategories().slice(0, 6).map(c => `<li><a href="#/category/${c.id}">${c.icon} ${c.name}</a></li>`).join('')}</ul>
        </div>
        <div class="footer-col">
          <p class="footer-h" aria-hidden="true">&nbsp;</p>
          <ul>${activeCategories().slice(6).map(c => `<li><a href="#/category/${c.id}">${c.icon} ${c.name}</a></li>`).join('')}</ul>
        </div>
        <div class="footer-col">
          <h2 class="footer-h">${tr('לגלות עוד', 'Explore more')}</h2>
          <ul>
            <li><a href="#/scan">${tr('סריקת ברקוד', 'Scan a barcode')}</a></li>
            <li><a href="#/products">${tr('כל המוצרים', 'All products')}</a></li>
            <li><a href="#/compare">${tr('מעובד מול פשוט', 'Processed vs. simple')}</a></li>
            <li><a href="#/tools">${tr('כלים', 'Tools')}</a></li>
            <li><a href="#/team">${tr('הצוות', 'The team')}</a></li>
            <li><a href="#/nova">${tr('מה זה מדד NOVA?', 'What is the NOVA scale?')}</a></li>
            <li><a href="#/ingredients">${tr('מילון רכיבים', 'Ingredient glossary')}</a></li>
            <li><a href="#/calculators">${tr('מחשבונים', 'Calculators')}</a></li>
            <li><a href="#/about">${tr('אודות', 'About')}</a></li>
            <li><a href="#/legal">${tr('תנאי שימוש ופרטיות', 'Terms of use and privacy')}</a></li>
            <li><a href="#/legal">${tr('הצהרת נגישות', 'Accessibility statement')}</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© ${new Date().getFullYear()} Tavitly · ${tr('כל הזכויות שמורות · שמות המוצרים והמותגים שייכים לבעליהם, והאתר אינו קשור ליצרנים · איורים: Microsoft Fluent Emoji (רישיון MIT)', 'All rights reserved · Product and brand names belong to their owners, and the site is not affiliated with the manufacturers · Illustrations: Microsoft Fluent Emoji (MIT license)')}</p>
      </div>
    </footer>
  `;
}

// ——————————————————————————————————————
// כרטיס מוצר
// ——————————————————————————————————————
export function renderProductCard(product) {
  const cat = catOf(product);
  return `
    <a class="product-card animate-item" href="#/product/${product.id}">
      ${art(product, 'art-card')}
      <div class="card-body">
        <span class="card-cat">${cat.icon} ${cat.name}</span>
        <h3 class="card-title">${escapeHtml(product.name)}</h3>
        <p class="card-brand">${escapeHtml(product.brand)}</p>
        <div class="card-badges">${novaBadge(product)}${scoreChip(product)}</div>
      </div>
    </a>
  `;
}

// ——————————————————————————————————————
// דף הבית
// ——————————————————————————————————————
export function renderHome() {
  const stats = getStats();
  const novaCounts = [1, 2, 3, 4].map(g => products.filter(p => getNova(p).group === g).length);
  const byScore = [...products].sort((a, b) => getScore(b) - getScore(a) || b.ingredients.length - a.ingredients.length);
  const topProcessed = byScore.slice(0, 4);
  const teaser = comparePairs.slice(0, 3).map(x => ({ ...x, pa: products.find(p => p.id === x.a), pb: products.find(p => p.id === x.b) })).filter(x => x.pa && x.pb);

  return `
    <main class="page page-home" id="page-content">
      <section class="hero">
        <div class="hero-inner">
          <div class="hero-text">
            <p class="eyebrow">${tr('ניתוח מוצרי מזון לפי מדד NOVA', 'Food products analyzed with the NOVA scale')}</p>
            <h1 class="hero-title">${tr('מה באמת יש <span class="hl">בתווית?</span>', 'What\'s really on <span class="hl">the label?</span>')}</h1>
            <p class="hero-subtitle">${tr(`בדקנו ${stats.totalProducts} מוצרים מהסופר, רכיב אחרי רכיב. לכל מוצר תמצאו את דרגת העיבוד שלו, הסבר פשוט לכל רכיב וחלופה פשוטה יותר.`, `We checked ${stats.totalProducts} supermarket products, ingredient by ingredient. For each product you'll find its processing level, a simple explanation of every ingredient and a simpler alternative.`)}</p>
            <div class="hero-search" id="hero-search">
              <label for="global-search" class="visually-hidden">${tr('חיפוש מוצר, מותג או רכיב', 'Search for a product, brand or ingredient')}</label>
              <div class="search-wrapper">
                <span class="search-icon" aria-hidden="true">🔍</span>
                <input type="search" id="global-search" class="search-input" placeholder="${tr('חפשו מוצר, מותג, רכיב או ברקוד', 'Search a product, brand, ingredient or barcode')}" autocomplete="off" />
              </div>
              <div class="search-results" id="search-results" role="listbox"></div>
            </div>
          </div>
          <div class="hero-art" aria-hidden="true">
            <span class="hero-glow"></span>
            <span class="float f1"><img src="img/art/red_apple.webp" alt="" width="256" height="256" fetchpriority="high"></span>
            <span class="float f2"><img src="img/art/avocado.webp" alt="" width="256" height="256"></span>
            <span class="float f3"><img src="img/art/carrot.webp" alt="" width="256" height="256"></span>
            <span class="float f4"><img src="img/art/broccoli.webp" alt="" width="256" height="256"></span>
            <span class="float f5"><img src="img/art/banana.webp" alt="" width="256" height="256"></span>
            <span class="float f6"><img src="img/art/strawberry.webp" alt="" width="256" height="256"></span>
            <span class="float f7"><img src="img/art/tomato.webp" alt="" width="256" height="256"></span>
          </div>
        </div>
      </section>

      <section class="action-wrap" aria-label="${tr('סריקה ומספרים', 'Scan and numbers')}">
        <div class="action-card">
            <div class="hero-scan">
              ${scanButton()}
              <span class="hero-scan-hint">${tr('עומדים מול המדף? סרקו את האריזה וקבלו תשובה מיד', 'Standing at the shelf? Scan the package and get an answer right away')}<span id="catalog-count"></span></span>
            </div>
          <div class="stats-bar" aria-label="${tr('המאגר במספרים', 'Our database in numbers')}">
        <a class="stat-item" href="#/products"><span class="stat-number">${stats.totalProducts}</span><span class="stat-label">${tr('מוצרים', 'products')}</span></a>
        <a class="stat-item" href="#/ingredients"><span class="stat-number">${stats.totalIngredients}</span><span class="stat-label">${tr('רכיבים מוסברים', 'ingredients explained')}</span></a>
        <a class="stat-item" href="#/categories"><span class="stat-number">${stats.totalCategories}</span><span class="stat-label">${tr('קטגוריות', 'categories')}</span></a>
        <a class="stat-item" href="#/nova"><span class="stat-number danger-color">${novaCounts[3]}</span><span class="stat-label">${tr('מוצרים אולטרה-מעובדים', 'ultra-processed products')}</span></a>
      </div>
        </div>
        <div class="hero-links">
              <a href="#/products" class="btn btn-ghost btn-sm">🛒 ${tr('כל המוצרים', 'All products')}</a>
              <a href="#/random" class="btn btn-ghost btn-sm">🎲 ${tr('מוצר אקראי', 'Random product')}</a>
              <a href="#/label" class="btn btn-ghost btn-sm">🔬 ${tr('בדיקת תווית', 'Check a label')}</a>
              <a href="#/quiz" class="btn btn-ghost btn-sm">🎯 ${tr('חידון', 'Quiz')}</a>
            </div>
      </section>

      <section class="section section-rail">
        <div class="section-head start rail-head">
          <h2 class="section-title">${tr('מכל מדף במאגר', 'A taste of every aisle')}</h2>
          <a href="#/products" class="text-link">${tr('לכל המוצרים', 'All products')}</a>
        </div>
        <div class="product-rail">${railPicks().map(renderProductCard).join('')}</div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">${tr('קטגוריות', 'Categories')}</h2>
          <p class="section-subtitle">${tr('בחרו קטגוריה וגלו מה יש במוצרים שאתם קונים', "Pick a category and find out what's in the products you buy")}</p>
        </div>
        ${renderCategoryGrid()}
      </section>

      <section class="section section-alt">
        <div class="section-head">
          <h2 class="section-title">${tr('איך זה עובד', 'How it works')}</h2>
          <p class="section-subtitle">${tr('שלושה צעדים מהמדף להחלטה', 'Three steps from the shelf to a decision')}</p>
        </div>
        <div class="steps">
          <div class="step-card"><span class="step-num">1</span><h3>${tr('בוחרים מוצר', 'Pick a product')}</h3><p>${tr('מחפשים לפי שם, מותג או רכיב, או עוברים בין הקטגוריות.', 'Search by name, brand or ingredient, or browse the categories.')}</p></div>
          <div class="step-card"><span class="step-num">2</span><h3>${tr('מבינים את הרכיבים', 'Understand the ingredients')}</h3><p>${tr('כל רכיב מוסבר בשפה פשוטה, והרכיבים שקבעו את דרגת העיבוד מסומנים.', 'Every ingredient is explained in plain language, and the ingredients that set the processing level are highlighted.')}</p></div>
          <div class="step-card"><span class="step-num">3</span><h3>${tr('בוחרים חלופה', 'Choose an alternative')}</h3><p>${tr('לכל מוצר מעובד מוצעת חלופה פשוטה יותר מאותו סוג.', 'Every processed product comes with a simpler alternative of the same kind.')}</p></div>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">${tr('כלים חכמים', 'Smart tools')}</h2>
          <p class="section-subtitle">${tr('לבדוק תווית, להשוות, לשחק ולבנות סל קניות', 'Check a label, compare, play and build a shopping basket')}</p>
        </div>
        ${toolCards(TOOLS.slice(0, 4))}
        <div class="fact-box" id="fact-box">
          <span class="fact-icon" aria-hidden="true">💡</span>
          <div><strong>${tr('הידעת?', 'Did you know?')}</strong> <span id="fact-text">${escapeHtml(facts()[0])}</span></div>
          <button class="icon-btn" id="fact-next" aria-label="${tr('עובדה נוספת', 'Another fact')}" title="${tr('עובדה נוספת', 'Another fact')}">↻</button>
        </div>
      </section>

      <section class="section section-alt">
        <div class="section-head">
          <h2 class="section-title">${tr('כמה מעובד המאגר שלנו?', 'How processed is our database?')}</h2>
          <p class="section-subtitle">${tr('כל מוצר מסווג לפי מדד NOVA הבינלאומי, לפי רשימת הרכיבים שלו', 'Every product is classified on the international NOVA scale, based on its ingredient list')}</p>
        </div>
        <div class="nova-bar" role="img" aria-label="${[1, 2, 3, 4].map(g => `NOVA ${g}: ${nProducts(novaCounts[g - 1])}`).join(', ')}">
          ${[1, 2, 3, 4].map(g => novaCounts[g - 1] ? `<a href="#/nova" class="nova-bar-seg" style="flex:${novaCounts[g - 1]};background:${NOVA_GROUPS[g].color};color:${NOVA_GROUPS[g].on}" title="NOVA ${g}: ${NOVA_GROUPS[g].name}"><span>${novaCounts[g - 1]}</span></a>` : '').join('')}
        </div>
        <div class="nova-legend">
          ${[1, 2, 3, 4].map(g => `<span class="nova-legend-item"><span class="nova-dot" style="background:${NOVA_GROUPS[g].color};color:${NOVA_GROUPS[g].on}"></span>NOVA ${g} · ${NOVA_GROUPS[g].short}</span>`).join('')}
        </div>
        <div class="center-cta"><a href="#/nova" class="btn btn-ghost">${tr('מה זה מדד NOVA?', 'What is the NOVA scale?')}</a></div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">${tr('מעובד מול פשוט', 'Processed vs. simple')}</h2>
          <p class="section-subtitle">${tr('אותו צורך, רשימת רכיבים אחרת לגמרי', 'Same need, a completely different ingredient list')}</p>
        </div>
        <div class="compare-teaser">
          ${teaser.map(x => `
            <a class="teaser-card animate-item" href="#/compare">
              <div class="teaser-side">${art(x.pa, 'art-mini')}<span>${escapeHtml(x.pa.name)}</span>${novaBadge(x.pa)}</div>
              <span class="teaser-arrow" aria-hidden="true">${tr('←', '→')}</span>
              <div class="teaser-side">${art(x.pb, 'art-mini')}<span>${escapeHtml(x.pb.name)}</span>${novaBadge(x.pb)}</div>
            </a>`).join('')}
        </div>
        <div class="center-cta"><a href="#/compare" class="btn btn-primary">${tr(`לכל ${comparePairs.length} ההשוואות`, `See all ${comparePairs.length} comparisons`)}</a></div>
      </section>

      <section class="section section-alt">
        <div class="section-head">
          <h2 class="section-title">${tr('הכי מעובדים במאגר', 'Most processed in our database')}</h2>
          <p class="section-subtitle">${tr('המוצרים עם ציון העיבוד הגבוה ביותר', 'The products with the highest processing score')}</p>
        </div>
        <div class="products-grid">${topProcessed.map(renderProductCard).join('')}</div>
      </section>
    </main>
  `;
}

// מוצר אחד או שניים מכל קטגוריה, לשורה הנגללת בדף הבית
function railPicks() {
  return activeCategories().flatMap(c => products.filter(p => p.category === c.id).slice(0, 1)).slice(0, 12);
}

function renderCategoryGrid() {
  return `
    <div class="categories-grid">
      ${activeCategories().map(c => {
        const list = products.filter(p => p.category === c.id);
        const ultra = list.filter(p => getNova(p).group === 4).length;
        return `
          <a href="#/category/${c.id}" class="category-card animate-item" style="--h:${CAT_HUE[c.id] ?? 120}">
            <span class="category-icon" aria-hidden="true">${c.icon}</span>
            <h3 class="category-name">${c.name}</h3>
            <p class="category-desc">${c.description}</p>
            <span class="category-count">${nProducts(list.length)}</span>
            ${ultra ? `<span class="category-ultra">${ultra} ${tr('אולטרה-מעובדים', 'ultra-processed')}</span>` : ''}
          </a>`;
      }).join('')}
    </div>`;
}

// ——————————————————————————————————————
// קטגוריות
// ——————————————————————————————————————
export function renderCategoriesPage() {
  const nCats = activeCategories().length;
  return `
    <main class="page" id="page-content">
      ${breadcrumb([[tr('כל הקטגוריות', 'All categories')]])}
      <section class="page-hero">
        <h1>${tr('כל הקטגוריות', 'All categories')}</h1>
        <p>${tr(`${products.length} מוצרים ב-${nCats} קטגוריות`, `${nProducts(products.length)} in ${nCats} ${nCats === 1 ? 'category' : 'categories'}`)}</p>
        <a href="#/products" class="btn btn-primary">${tr('לכל המוצרים, עם חיפוש וסינון', 'All products, with search and filters')}</a>
      </section>
      <div class="container">${renderCategoryGrid()}</div>
    </main>
  `;
}

export function renderCategory(categoryId) {
  const cat = categories.find(c => c.id === categoryId);
  if (!cat) return renderNotFound();
  const list = products.filter(p => p.category === categoryId).sort((a, b) => getNova(a).group - getNova(b).group || getScore(a) - getScore(b));
  const groups = [1, 2, 3, 4].filter(g => list.some(p => getNova(p).group === g));

  return `
    <main class="page page-category" id="page-content">
      ${breadcrumb([[tr('קטגוריות', 'Categories'), '#/categories'], [cat.name]])}
      <section class="page-hero">
        <span class="page-hero-icon" aria-hidden="true">${cat.icon}</span>
        <h1>${cat.name}</h1>
        <p>${cat.description} · ${nProducts(list.length)}</p>
      </section>
      <div class="container">
        <div class="toolbar">
          <div class="filters" role="group" aria-label="${tr('סינון לפי NOVA', 'Filter by NOVA')}">
            <button class="filter-btn active" data-filter="all">${tr('הכל', 'All')}</button>
            ${groups.map(g => `<button class="filter-btn filter-nova" data-filter="nova${g}" style="--nova:${NOVA_GROUPS[g].color}">NOVA ${g}</button>`).join('')}
          </div>
          <label class="sorting">${tr('מיון:', 'Sort:')}
            <select id="sort-select">
              <option value="nova-asc">${tr('הכי פחות מעובד', 'Least processed')}</option>
              <option value="nova-desc">${tr('הכי מעובד', 'Most processed')}</option>
              <option value="name">${tr('א-ב', 'A–Z')}</option>
            </select>
          </label>
        </div>
        <div class="products-grid" id="products-grid">${list.map(renderProductCard).join('')}</div>
      </div>
    </main>
  `;
}

// ——————————————————————————————————————
// כל המוצרים
// ——————————————————————————————————————
export function renderAllProducts() {
  const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name, 'he'));
  return `
    <main class="page" id="page-content">
      ${breadcrumb([[tr('קטגוריות', 'Categories'), '#/categories'], [tr('כל המוצרים', 'All products')]])}
      <section class="page-hero">
        <span class="page-hero-icon" aria-hidden="true">🛒</span>
        <h1>${tr('כל המוצרים', 'All products')}</h1>
        <p>${tr(`${products.length} מוצרים. חפשו, סננו לפי קטגוריה ודרגת עיבוד, ומיינו.`, `${nProducts(products.length)}. Search, filter by category and processing level, and sort.`)}</p>
      </section>
      <div class="container">
        <div class="toolbar toolbar-all">
          <label class="search-inline"><span class="visually-hidden">${tr('חיפוש מוצר', 'Search for a product')}</span>
            <input type="search" id="all-search" placeholder="${tr('חפשו מוצר או מותג', 'Search a product or brand')}" autocomplete="off">
          </label>
          <label class="sorting">${tr('קטגוריה:', 'Category:')}
            <select id="all-cat">
              <option value="">${tr('כל הקטגוריות', 'All categories')}</option>
              ${activeCategories().map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </label>
          <div class="filters" role="group" aria-label="${tr('סינון לפי NOVA', 'Filter by NOVA')}">
            <button class="filter-btn active" data-nova="all" aria-pressed="true">${tr('הכל', 'All')}</button>
            ${[1, 2, 3, 4].map(g => `<button class="filter-btn filter-nova" data-nova="${g}" aria-pressed="false" style="--nova:${NOVA_GROUPS[g].color}">NOVA ${g}</button>`).join('')}
          </div>
          <label class="sorting">${tr('מיון:', 'Sort:')}
            <select id="all-sort">
              <option value="name">${tr('א-ב', 'A–Z')}</option>
              <option value="nova-asc">${tr('הכי פחות מעובד', 'Least processed')}</option>
              <option value="nova-desc">${tr('הכי מעובד', 'Most processed')}</option>
              <option value="ings">${tr('הכי מעט רכיבים', 'Fewest ingredients')}</option>
            </select>
          </label>
        </div>
        <p class="muted" id="all-count" aria-live="polite">${nProducts(products.length)}</p>
        <div class="products-grid" id="all-grid">${sorted.map(renderProductCard).join('')}</div>
        <div class="empty-note" id="all-empty" hidden>${tr('לא נמצאו מוצרים. נסו לשנות את החיפוש או את הסינון.', 'No products found. Try changing your search or filters.')}</div>
      </div>
    </main>
  `;
}

// ——————————————————————————————————————
// דף מוצר
// ——————————————————————————————————————
export function renderProduct(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return renderNotFound();
  const cat = catOf(product);
  const nova = getNova(product);
  const score = getScore(product);
  const items = product.ingredients.map(i => ({ name: i, ...lookupIngredient(i) }));
  const counts = { safe: 0, caution: 0, danger: 0 };
  items.forEach(i => counts[i.risk]++);

  const pair = comparePairs.find(x => x.a === product.id);
  const pairProduct = pair && products.find(p => p.id === pair.b);
  const alts = getAlternatives(product).filter(p => !pairProduct || p.id !== pairProduct.id);
  const altList = [pairProduct, ...alts].filter(Boolean).slice(0, 3);

  const level = score <= 2 ? 'low' : score <= 5 ? 'mid' : 'high';
  const C = 2 * Math.PI * 54;
  const flags = redFlags(items, nova);
  const better = alts[0];

  return `
    <main class="page page-product" id="page-content">
      ${breadcrumb([[cat.name, `#/category/${product.category}`], [product.name]])}

      <section class="container product-hero">
        ${art(product, 'art-hero')}
        <div class="product-hero-info">
          <span class="card-cat">${cat.icon} ${cat.name}</span>
          <h1 class="product-title">${escapeHtml(product.name)}</h1>
          <p class="product-brand">${escapeHtml(product.brand)}</p>
          <div class="card-badges">${novaBadge(product, 'lg')}</div>
          <p class="product-summary">${escapeHtml(product.summary)}</p>
          <div class="product-actions">
            <button class="btn btn-primary btn-sm" id="basket-toggle" data-id="${product.id}" aria-pressed="false">🛒 ${tr('הוספה לסל', 'Add to basket')}</button>
            <a class="btn btn-ghost btn-sm" href="#/vs/${product.id}/${altList[0] ? altList[0].id : '-'}">⚖️ ${tr('השוואה למוצר אחר', 'Compare with another product')}</a>
            <button class="btn btn-ghost btn-sm" id="copy-link">🔗 ${tr('העתקת קישור', 'Copy link')}</button>
          </div>
        </div>
        <div class="gauge score-${level}" aria-label="${tr(`ציון עיבוד ${score} מתוך 10`, `Processing score ${score} out of 10`)}">
          <svg viewBox="0 0 120 120" class="gauge-svg" aria-hidden="true">
            <circle class="gauge-bg" cx="60" cy="60" r="54"/>
            <circle class="gauge-fill" cx="60" cy="60" r="54" style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - score / 10)}"/>
          </svg>
          <div class="gauge-center"><span class="gauge-number">${score}</span><span class="gauge-max">/10</span></div>
          <span class="gauge-label">${tr('ציון עיבוד', 'Processing score')}</span>
        </div>
      </section>

      <section class="container">
        <div class="verdict" id="verdict">
          <div class="verdict-main">
            <p class="eyebrow">${tr('בשורה התחתונה', 'The bottom line')}</p>
            ${flags.length
              ? `<ul class="verdict-flags">${flags.map(f => `<li><span aria-hidden="true">🚩</span> ${escapeHtml(f)}</li>`).join('')}</ul>`
              : `<p class="verdict-ok"><span aria-hidden="true">✅</span> ${tr('לפי רשימת הרכיבים, אין כאן תוספים שמסומנים אצלנו כבעייתיים.', "Based on the ingredient list, there are no additives here that we flag as problematic.")}</p>`}
            ${avoidHTML(items, nova)}
            ${better ? `<a class="verdict-alt" href="#/product/${better.id}"><span>${tr('חלופה מעובדת פחות:', 'Less processed alternative:')}</span> <strong>${escapeHtml(better.name)}</strong> ${novaBadge(better)}</a>` : ''}
          </div>
          <button class="btn btn-primary btn-sm verdict-share" id="share-card" data-id="${product.id}">📤 ${tr('שיתוף בוואטסאפ', 'Share on WhatsApp')}</button>
        </div>
      </section>

      <section class="container">
        <div class="nova-panel" style="--nova:${nova.color};--nova-bg:${nova.bg}">
          <div class="nova-panel-num" aria-hidden="true">${nova.group}</div>
          <div class="nova-panel-body">
            <p class="eyebrow">${tr('סיווג NOVA', 'NOVA classification')}</p>
            <h2 class="nova-panel-title">NOVA ${nova.group}: ${nova.name}</h2>
            <p class="nova-panel-text">${escapeHtml(novaReason(product))}</p>
            <div class="nova-scale" aria-hidden="true">
              ${[1, 2, 3, 4].map(g => `<span class="nova-scale-step ${g === nova.group ? 'current' : ''}" style="background:${NOVA_GROUPS[g].color};color:${NOVA_GROUPS[g].on}">${g}</span>`).join('')}
            </div>
            <a href="#/nova" class="text-link">${tr('מה זה מדד NOVA ואיך הוא מחושב? ←', 'What is the NOVA scale and how is it calculated? →')}</a>
          </div>
        </div>
      </section>

      <section class="container">
        <div class="section-head start">
          <h2 class="section-title">${tr('ניתוח הרכיבים', 'Ingredient analysis')}</h2>
          <p class="section-subtitle">${tr(`${items.length} רכיבים, לפי הסדר שבתווית (מהכמות הגדולה לקטנה)`, `${items.length} ${items.length === 1 ? 'ingredient' : 'ingredients'}, in label order (largest amount first)`)}</p>
        </div>
        ${product.unverified ? `<p class="unverified-note" role="note">${tr('<strong>לא אומת מול מקור עדכני.</strong> רשימת הרכיבים מבוססת על התווית כפי שהופיעה בעבר, ולא מצאנו מקור פתוח כדי לאמת אותה. ייתכן שהמתכון השתנה, ולכן התווית שעל האריזה היא הקובעת.', '<strong>Not verified against an up-to-date source.</strong> The ingredient list is based on the label as it appeared in the past, and we did not find an open source to verify it. The recipe may have changed, so the label on the package is the binding version.')}</p>` : ''}
        <div class="risk-summary">
          <span class="count-badge risk-safe">${counts.safe} ${tr('בטוחים', 'safe')}</span>
          <span class="count-badge risk-caution">${counts.caution} ${tr('במידה', 'in moderation')}</span>
          <span class="count-badge risk-danger">${counts.danger} ${tr('בעייתיים', 'problematic')}</span>
        </div>
        <ol class="ing-list">
          ${items.map(i => `
            <li class="ing-row ${RISK[i.risk].cls}">
              <span class="ing-risk ${RISK[i.risk].cls}">${RISK[i.risk].label}</span>
              <div class="ing-main">
                <a class="ing-name" href="${ingLink(i.key)}">${escapeHtml(loc(i.name))}</a>
                <span class="ing-type">${escapeHtml(loc(i.type))}</span>
                ${i.nova === 'marker' ? `<span class="nova-marker">${tr('סמן NOVA 4', 'NOVA 4 marker')}</span>` : ''}
              </div>
              <p class="ing-reason">${escapeHtml(loc(i.reason))}</p>
            </li>`).join('')}
        </ol>
        ${EN ? '<p class="muted small translation-note">Ingredient list translated from the Hebrew label by Tavitly. The label on the package is the binding version.</p>' : ''}
        ${PHOTOS[product.id] ? `<p class="source-note">${tr('תמונת המוצר: מתנדבי', 'Product photo: volunteers of')} <a href="https://world.openfoodfacts.org/product/${escapeHtml(PHOTOS[product.id])}" target="_blank" rel="noopener noreferrer">Open Food Facts</a>, ${tr('ברישיון CC BY-SA 3.0. האריזה בחנות עשויה להיראות אחרת.', 'under the CC BY-SA 3.0 license. The package in the store may look different.')}</p>` : ''}
        <p class="source-note">${product.source
          ? `${tr('מקור רשימת הרכיבים:', 'Ingredient list source:')} ${product.source.url ? `<a href="${/^https:\/\//.test(product.source.url) ? escapeHtml(product.source.url) : '#'}" target="_blank" rel="noopener noreferrer">${escapeHtml(product.source.label)}</a>` : escapeHtml(product.source.label)}. ${tr('יצרנים מעדכנים מתכונים מדי פעם, ולכן כדאי לבדוק תמיד את התווית שעל האריזה.', "Manufacturers update recipes from time to time, so it's always worth checking the label on the package.")}`
          : product.generic
            ? tr('מוצר כללי: רשימת הרכיבים מתארת את המוצר הבסיסי, בלי מותג מסוים.', 'Generic product: the ingredient list describes the basic product, without a specific brand.')
            : tr('רשימת הרכיבים מבוססת על התווית של היצרן כפי שהופיעה בעבר, ועוד לא אומתה מול מקור פתוח עדכני. מצאתם הבדל? כתבו לנו ונתקן.', "The ingredient list is based on the manufacturer's label as it appeared in the past, and hasn't yet been verified against an up-to-date open source. Found a difference? Write to us and we'll fix it.")}</p>
      </section>

      <section class="container">
        <div class="section-head start">
          <h2 class="section-title">${tr('חלופות פשוטות יותר', 'Simpler alternatives')}</h2>
          <p class="section-subtitle">${altList.length ? tr('מוצרים מאותו סוג, עם פחות עיבוד', 'Products of the same kind, with less processing') : ''}</p>
        </div>
        ${altList.length ? `
          ${pair && pairProduct ? `<p class="pair-note">💡 ${escapeHtml(pair.note)}</p>` : ''}
          <div class="products-grid">${altList.map(renderProductCard).join('')}</div>
        ` : `
          <div class="empty-note">${nova.group <= 2
            ? tr('המוצר הזה כבר נמצא בדרגת העיבוד הנמוכה ביותר בקבוצה שלו. בחירה טובה.', 'This product is already at the lowest processing level in its group. Good choice.')
            : tr('אין במאגר שלנו חלופה מעובדת פחות מאותו סוג. אפשר לחפש בסופר מוצר עם רשימת רכיבים קצרה יותר, בלי צבעי מאכל, חומרי טעם ומתחלבים.', "Our database has no less processed alternative of the same kind. At the supermarket, look for a product with a shorter ingredient list, without food coloring, flavorings or emulsifiers.")}</div>
        `}
      </section>
    </main>
  `;
}

// ——————————————————————————————————————
// מעובד מול פשוט
// ——————————————————————————————————————
export const comparePairs = [
  { a: 'bamba_nougat', b: 'bamba', note: tr('אותה במבה, בלי קרם הנוגט, המתחלב וחומרי הטעם', 'The same Bamba, without the nougat cream, emulsifier and flavorings') },
  { a: 'bisli_grill', b: 'tapuchips', note: tr('חטיף מלוח משלושה רכיבים בלבד, בלי מחזקי טעם', 'A salty snack with just three ingredients, no flavor enhancers') },
  { a: 'doritos', b: 'corn_canned', note: tr('תירס אמיתי במקום חטיף תירס עם שלושה מחזקי טעם', 'Real corn instead of a corn snack with three flavor enhancers') },
  { a: 'milki', b: 'yogurt_greek', note: tr('מעדן חלבי בלי סוכר, עמילן מעובד וקרגינן', 'A dairy treat without sugar, modified starch or carrageenan') },
  { a: 'daniela', b: 'eshel', note: tr('מוצר חלב מותסס מרכיב אחד בלבד', 'A fermented dairy product with just one ingredient') },
  { a: 'emek', b: 'white_cheese', note: tr('גבינה מחלב ומלח, בלי צבע מאכל וחומר משמר', 'Cheese made from milk and salt, without food coloring or preservatives') },
  { a: 'cola', b: 'water_mineral', note: tr('בלי סוכר, צבע קרמל וקפאין', 'No sugar, caramel color or caffeine') },
  { a: 'cola_zero', b: 'orange_juice', note: tr('מיץ סחוט במקום ממתיקים מלאכותיים', 'Fresh-squeezed juice instead of artificial sweeteners') },
  { a: 'kariot', b: 'quaker', note: tr('דגן מלא אחד במקום קרם נוגט ושמן מוקשה', 'A single whole grain instead of nougat cream and hydrogenated oil') },
  { a: 'hot_dogs', b: 'chicken_breast', note: tr('בשר אמיתי, בלי חלבון סויה, ניטריט וצבעי מאכל', 'Real meat, without soy protein, nitrite or food coloring') },
  { a: 'pastrami', b: 'sardines', note: tr('מילוי לכריך: דג, שמן זית ומלח בלבד', 'A sandwich filling of just fish, olive oil and salt') },
  { a: 'corn_schnitzel', b: 'peas', note: tr('ירק קפוא בלי ציפוי ובלי חלבון חיטה', 'A frozen vegetable with no coating and no wheat protein') },
  { a: 'noodles', b: 'pasta_whole', note: tr('חיטה מלאה בלבד, בלי ארבעה מחזקי טעם ומלטודקסטרין', 'Just whole wheat, without four flavor enhancers and maltodextrin') },
  { a: 'mayo', b: 'tahini', note: tr('ממרח מרכיב אחד: שומשום טחון', 'A one-ingredient spread: ground sesame') },
  { a: 'gummy', b: 'apple', note: tr('מתוק טבעי, בלי סירופ גלוקוז וצבעי מאכל', 'Naturally sweet, without glucose syrup or food coloring') },
  { a: 'mekupelet', b: 'banana', note: tr('חטיף מתוק ומשביע, בלי סוכר מוסף', 'A sweet, filling snack with no added sugar') },
  { a: 'cheetos', b: 'rice_cakes', note: tr('חטיף פריך משני רכיבים: אורז מלא ומלח', 'A crunchy snack with two ingredients: brown rice and salt') },
  { a: 'neviot_grape', b: 'water_mineral', note: tr('אותם מים, בלי פרוקטוז וחומרי טעם וריח', 'The same water, without fructose or flavorings') },
  { a: 'salami', b: 'eggs', note: tr('חלבון לכריך, בלי ניטריט, פוספטים ומחזקי טעם', 'Protein for a sandwich, without nitrite, phosphates or flavor enhancers') },
  { a: 'mashed', b: 'potato', note: tr('תפוח אדמה אמיתי. בבית מוסיפים רק חלב, חמאה ומלח', 'A real potato. At home, just add milk, butter and salt') },
  { a: 'chicken_soup', b: 'lentils', note: tr('מרק עדשים ביתי מרכיב בסיסי אחד, בלי אבקת מרק', 'Homemade lentil soup from one basic ingredient, no soup powder') },
  { a: 'cornflakes', b: 'cornflakes_whole', note: tr('קורנפלקס מתירס מלא, בלי חומרי טעם וריח', 'Cornflakes made from whole corn, without flavorings') },
  { a: 'danone_pro_vanilla', b: 'danone_pro', note: tr('אותו יוגורט חלבון, מחלב בלבד, בלי ממתיקים מלאכותיים ועמילן מעובד', 'The same protein yogurt, made from milk only, without artificial sweeteners or modified starch') },
];

function compareSide(p, kind) {
  const n = getNova(p);
  return `
    <a href="#/product/${p.id}" class="compare-side ${kind}">
      ${art(p, 'art-mini')}
      <div class="compare-side-body">
        <span class="compare-kind">${kind === 'processed' ? tr('המוצר המעובד', 'The processed product') : tr('החלופה הפשוטה', 'The simple alternative')}</span>
        <h3>${escapeHtml(p.name)}</h3>
        <p class="card-brand">${escapeHtml(p.brand)}</p>
        <div class="card-badges">${novaBadge(p)}${scoreChip(p)}</div>
        <p class="compare-ings"><strong>${p.ingredients.length}</strong> ${p.ingredients.length === 1 ? tr('רכיב', 'ingredient') : tr('רכיבים', 'ingredients')}${n.markers.length ? ` · <strong>${n.markers.length}</strong> ${tr('סמני עיבוד תעשייתי', n.markers.length === 1 ? 'industrial processing marker' : 'industrial processing markers')}` : ''}</p>
      </div>
    </a>`;
}

export function renderCompare() {
  const pairs = comparePairs.map(x => ({ ...x, pa: products.find(p => p.id === x.a), pb: products.find(p => p.id === x.b) })).filter(x => x.pa && x.pb);
  return `
    <main class="page" id="page-content">
      ${breadcrumb([[tr('מעובד מול פשוט', 'Processed vs. simple')]])}
      <section class="page-hero">
        <span class="page-hero-icon" aria-hidden="true">⚖️</span>
        <h1>${tr('מעובד מול פשוט', 'Processed vs. simple')}</h1>
        <p>${tr(`${pairs.length} השוואות בין מוצר מעובד לחלופה פשוטה שממלאת את אותו צורך. לחצו על מוצר כדי לראות את כל הרכיבים.`, `${pairs.length} ${pairs.length === 1 ? 'comparison' : 'comparisons'} between a processed product and a simple alternative that meets the same need. Tap a product to see all its ingredients.`)}</p>
      </section>
      <div class="container compare-list">
        ${pairs.map(x => `
          <article class="compare-row animate-item">
            ${compareSide(x.pa, 'processed')}
            <div class="compare-vs" aria-hidden="true">${tr('←', '→')}</div>
            ${compareSide(x.pb, 'simple')}
            <p class="compare-note">💡 ${escapeHtml(x.note)}</p>
          </article>`).join('')}
      </div>
    </main>
  `;
}

// ——————————————————————————————————————
// מדד NOVA
// ——————————————————————————————————————
export function renderNova() {
  return `
    <main class="page" id="page-content">
      ${breadcrumb([[tr('מדד NOVA', 'The NOVA scale')]])}
      <section class="page-hero">
        <span class="page-hero-icon" aria-hidden="true">🧭</span>
        <h1>${tr('מה זה מדד NOVA?', 'What is the NOVA scale?')}</h1>
        <p>${tr('סיווג בינלאומי שמחלק את כל המזון לארבע קבוצות לפי מידת העיבוד התעשייתי, ולא לפי קלוריות', 'An international classification that sorts all food into four groups by degree of industrial processing, not by calories')}</p>
      </section>
      <div class="container">
        <div class="nova-groups">
          ${[1, 2, 3, 4].map(g => {
            const G = NOVA_GROUPS[g];
            const list = products.filter(p => getNova(p).group === g);
            return `
              <section class="nova-group-card animate-item" style="--nova:${G.color};--nova-bg:${G.bg}">
                <div class="nova-group-head">
                  <span class="nova-group-num">${g}</span>
                  <div><h2>${G.name}</h2><p class="muted">${tr(`${list.length} מוצרים באתר`, `${nProducts(list.length)} on the site`)}</p></div>
                </div>
                <p>${G.desc}</p>
                <p class="muted"><strong>${tr('דוגמאות:', 'Examples:')}</strong> ${G.examples}</p>
                ${list.length ? `<div class="chips">${list.map(p => `<a href="#/product/${p.id}" class="chip">${escapeHtml(p.name)}</a>`).join('')}</div>` : ''}
              </section>`;
          }).join('')}
        </div>

        <section class="prose-card">
          <h2>${tr('איך אנחנו מחשבים את הסיווג?', 'How do we calculate the classification?')}</h2>
          <p>${tr('כל רכיב במילון הרכיבים שלנו מסומן לפי התפקיד שלו, והסיווג של המוצר נקבע לפי הרכיבים:', "Every ingredient in our glossary is tagged by its role, and a product's classification is determined by its ingredients:")}</p>
          <ul>
            <li><strong>NOVA 4</strong>: ${tr('יש לפחות רכיב אחד שמאפיין עיבוד תעשייתי, כמו צבעי מאכל, חומרי טעם וריח, מחזקי טעם, מתחלבים, מייצבים, ממתיקים, סירופ גלוקוז, מלטודקסטרין, עמילן מעובד או חלבון מבודד.', 'there is at least one ingredient typical of industrial processing, such as food coloring, flavorings, flavor enhancers, emulsifiers, stabilizers, sweeteners, glucose syrup, maltodextrin, modified starch or protein isolate.')}</li>
            <li><strong>NOVA 3</strong>: ${tr('מזון בסיסי שהוסיפו לו מלח, סוכר, שמן או חומר משמר.', 'a basic food with added salt, sugar, oil or a preservative.')}</li>
            <li><strong>NOVA 2</strong>: ${tr('רכיב בישול בלבד, כמו שמן או סוכר.', 'a culinary ingredient only, such as oil or sugar.')}</li>
            <li><strong>NOVA 1</strong>: ${tr('כל הרכיבים טבעיים או עברו עיבוד מינימלי, כמו ייבוש, הקפאה, פסטור או התססה. ויטמינים ומינרלים שהוספו להעשרה לא משנים את הדרגה.', "all ingredients are natural or minimally processed, for example dried, frozen, pasteurized or fermented. Vitamins and minerals added for fortification don't change the group.")}</li>
          </ul>
          <h3>${tr('ציון העיבוד (1 עד 10)', 'The processing score (1 to 10)')}</h3>
          <p>${tr('כדי להבדיל בין מוצרים באותה קבוצה, לכל מוצר יש גם ציון עיבוד: NOVA 1 מקבל 1, ו-NOVA 2 מקבל 2. NOVA 3 מקבל 3 עד 5, לפי תוספת סוכר וחומר משמר. NOVA 4 מקבל 6 עד 10, לפי מספר הסמנים התעשייתיים ולפי נוכחות רכיב בדרגת סיכון "בעייתי".', 'To tell apart products in the same group, every product also gets a processing score: NOVA 1 gets 1, and NOVA 2 gets 2. NOVA 3 gets 3 to 5, depending on added sugar and preservatives. NOVA 4 gets 6 to 10, depending on the number of industrial markers and on whether there is an ingredient rated "Problematic".')}</p>
          <p class="muted">${tr('מקור ההגדרות: מערכת NOVA שפותחה באוניברסיטת סאו פאולו (Monteiro ועמיתיו). הסיווג באתר מחושב מרשימת הרכיבים, ולכן הוא הערכה ולא סיווג רשמי.', "Source of the definitions: the NOVA system developed at the University of São Paulo (Monteiro and colleagues). The classification on this site is calculated from the ingredient list, so it's an estimate, not an official classification.")}</p>
        </section>
      </div>
    </main>
  `;
}

// ——————————————————————————————————————
// מילון רכיבים
// ——————————————————————————————————————
let termsReady = false;
function terms() {
  if (!termsReady) { attachProducts(products); termsReady = true; }
  return allTerms().sort((a, b) => a.name.localeCompare(b.name, 'he'));
}
const eLabel = t => t.e.length ? (t.e.length > 3 ? `${t.e[0]}–${t.e[t.e.length - 1]}` : t.e.join(', ')) : '';
const countLabel = n => tr(`מופיע ב-${n} ${n === 1 ? 'מוצר' : 'מוצרים'}`, `Found in ${n} ${n === 1 ? 'product' : 'products'}`);

function termCard(t, tag = 'h3') {
  return `
    <a class="ing-card animate-item" href="${ingLink(t.id)}" data-role="${t.nova}" data-search="${escapeHtml(termSearchText(t))}">
      <div class="ing-card-head">
        <${tag}>${escapeHtml(t.name)}${t.e.length ? ` <span class="ing-e" dir="ltr">${escapeHtml(eLabel(t))}</span>` : ''}</${tag}>
        <span class="ing-risk ${RISK[t.risk].cls}">${RISK[t.risk].label}</span>
      </div>
      <p class="ing-type">${escapeHtml(loc(t.type))} · ${ROLE[t.nova]}</p>
      <p class="ing-reason">${escapeHtml(t.reason)}</p>
      <p class="muted small">${countLabel(t.products.size)}</p>
    </a>`;
}

export function renderIngredients() {
  const list = terms();
  const roles = ['marker', 'additive', 'culinary', 'processed', 'whole'];
  return `
    <main class="page" id="page-content">
      ${breadcrumb([[tr('מילון רכיבים', 'Ingredient glossary')]])}
      <section class="page-hero">
        <span class="page-hero-icon" aria-hidden="true">📖</span>
        <h1>${tr('מילון רכיבים', 'Ingredient glossary')}</h1>
        <p>${tr(`${list.length} רכיבים מכל המוצרים באתר, כל אחד פעם אחת ועם הסבר פשוט`, `${list.length} ingredients from all the products on the site, each listed once with a simple explanation`)}</p>
      </section>
      <div class="container">
        <div class="toolbar">
          <label class="search-inline"><span class="visually-hidden">${tr('חיפוש רכיב', 'Search for an ingredient')}</span>
            <input type="search" id="ing-search" placeholder="${tr('חפשו רכיב, למשל: לציטין, E471, סוכר', 'Search an ingredient, e.g. lecithin, E471, sugar')}" autocomplete="off">
          </label>
          <div class="filters" role="group" aria-label="${tr('סינון לפי תפקיד', 'Filter by role')}">
            <button class="filter-btn active" data-role="all">${tr('הכל', 'All')}</button>
            ${roles.map(r => `<button class="filter-btn" data-role="${r}">${ROLE[r]}</button>`).join('')}
          </div>
        </div>
        <p class="muted" id="ing-count">${list.length} ${tr('רכיבים', list.length === 1 ? 'ingredient' : 'ingredients')}</p>
        <div class="ing-grid" id="ing-grid">${list.map(t => termCard(t)).join('')}</div>
      </div>
    </main>
  `;
}

export function renderIngredient(key) {
  terms();
  const found = findTerms(key).filter(t => t && t.products.size);
  if (!found.length) return renderNotFound();
  if (found.length > 1) {
    return `
    <main class="page" id="page-content">
      ${breadcrumb([[tr('מילון רכיבים', 'Ingredient glossary'), '#/ingredients'], [loc(key)]])}
      <section class="page-hero">
        <h1>${escapeHtml(loc(key))}</h1>
        <p>${tr(`על התווית כתובים כאן ${found.length} חומרים. לחצו על כל אחד כדי לקרוא עליו.`, `On the label, this name covers ${found.length} different substances. Tap each one to read about it.`)}</p>
      </section>
      <div class="container"><div class="ing-grid">${found.map(t => termCard(t, 'h2')).join('')}</div></div>
    </main>`;
  }
  const t = found[0];
  const list = [...t.products];
  const forms = t.keys.filter(k => k !== t.name).slice(0, 12);
  return `
    <main class="page" id="page-content">
      ${breadcrumb([[tr('מילון רכיבים', 'Ingredient glossary'), '#/ingredients'], [t.name]])}
      <section class="container">
        <div class="prose-card ingredient-detail">
          <div class="ing-card-head">
            <h1>${escapeHtml(t.name)}${t.e.length ? ` <span class="ing-e" dir="ltr">${escapeHtml(t.e.join(', '))}</span>` : ''}</h1>
            <span class="ing-risk ${RISK[t.risk].cls}">${RISK[t.risk].label}</span>
          </div>
          <p class="ing-type">${escapeHtml(loc(t.type))} · ${ROLE[t.nova]}${t.nova === 'marker' ? ` <span class="nova-marker">${tr('מאפיין מזון אולטרה-מעובד', 'Typical of ultra-processed food')}</span>` : ''}</p>
          <p class="lead">${escapeHtml(t.reason)}</p>
          ${forms.length ? `<p class="muted small">${tr('על התוויות הוא מופיע גם כ:', 'On labels it also appears as:')} ${forms.map(k => escapeHtml(loc(k))).join(' · ')}</p>` : ''}
          <p class="muted small">${tr('רמת הסיכון מתייחסת לרכיב בכמויות הרגילות במזון, לפי עמדת רשויות המזון והמחקר הקיים. זה מידע כללי ולא ייעוץ רפואי.', 'The risk level refers to the ingredient in the amounts normally found in food, based on the position of food authorities and existing research. This is general information, not medical advice.')}</p>
        </div>
      </section>
      <section class="container">
        <div class="section-head start"><h2 class="section-title">${countLabel(list.length)}</h2></div>
        <div class="products-grid">${list.map(renderProductCard).join('')}</div>
      </section>
    </main>
  `;
}

// ——————————————————————————————————————
// אודות
// ——————————————————————————————————————
export function renderAbout() {
  const stats = getStats();
  return `
    <main class="page" id="page-content">
      ${breadcrumb([[tr('אודות', 'About')]])}
      <section class="page-hero">
        <span class="page-hero-icon" aria-hidden="true">🥦</span>
        <h1>${tr('אודות Tavitly', 'About Tavitly')}</h1>
        <p>${tr('לדעת מה אנחנו מכניסים לפה, ומה אנחנו נותנים לילדים שלנו', "Knowing what we put in our mouths, and what we give our kids")}</p>
      </section>
      <div class="container about-grid">
        <section class="prose-card about-lead">
          <h2>🎯 ${tr('למה אנחנו כאן', "Why we're here")}</h2>
          <p>${tr('רשימת הרכיבים על האריזה אמורה לספר לנו מה יש באוכל. בפועל היא כתובה באותיות קטנות, מלאה במספרי E ובשמות כימיים, ורובנו מוותרים עליה ומכניסים את המוצר לעגלה.', "The ingredient list on the package is supposed to tell us what's in our food. In practice it's printed in tiny letters, full of E numbers and chemical names, and most of us give up on it and just put the product in the cart.")}</p>
          <p>${tr('הקמנו את Tavitly בגלל הפער הזה. ריכזנו במקום אחד את רוב סוגי החומרים שנמצאים במזון, והסברנו כל אחד מהם בשפה פשוטה, כדי שכל אחד יוכל לדעת מה הוא מכניס לפה שלו ולפה של הילדים שלו.', 'We started Tavitly because of that gap. We gathered most of the kinds of substances found in food in one place and explained each one in plain language, so anyone can know what they are putting in their own mouth and in their kids\' mouths.')}</p>
          <p>${tr('אנחנו לא אומרים לכם מה לאכול. אנחנו רוצים שתבחרו כשאתם יודעים.', "We don't tell you what to eat. We want you to choose knowing what's in it.")}</p>
        </section>
        <section class="prose-card">
          <h2>🛒 ${tr('מה תמצאו כאן', "What you'll find here")}</h2>
          <ul>
            <li><strong>${nProducts(stats.totalProducts)}</strong> ${tr('מהסופר, ולכל אחד רשימת הרכיבים המלאה והסבר לכל רכיב.', 'from the supermarket, each with its full ingredient list and an explanation of every ingredient.')}</li>
            <li><strong>${tr('סריקת ברקוד:', 'Barcode scanning:')}</strong> ${tr('סורקים את האריזה בטלפון ומגיעים ישר לדף המוצר.', 'scan the package with your phone and go straight to the product page.')}</li>
            <li><strong>${tr('מילון רכיבים:', 'Ingredient glossary:')}</strong> ${tr('מה כל חומר עושה במוצר, ומה ידוע עליו.', 'what each substance does in the product, and what is known about it.')}</li>
            <li><strong>${tr('חלופות:', 'Alternatives:')}</strong> ${tr('לכל מוצר מעובד מוצע מוצר פשוט יותר מאותו סוג.', 'every processed product comes with a simpler product of the same kind.')}</li>
            <li><strong>${tr('כלים:', 'Tools:')}</strong> ${tr('בודק תווית לכל מוצר שלא נמצא אצלנו, השוואה בין מוצרים ומחשבונים.', "a label checker for any product we don't have, product comparisons and calculators.")}</li>
          </ul>
        </section>
        <section class="prose-card">
          <h2>🧭 ${tr('שני מדדים לכל מוצר', 'Two measures for every product')}</h2>
          <p>${tr('<strong>מדד NOVA (1 עד 4)</strong> הוא סיווג בינלאומי לפי מידת העיבוד התעשייתי. <a href="#/nova">הסבר מלא</a>.', '<strong>The NOVA scale (1 to 4)</strong> is an international classification by degree of industrial processing. <a href="#/nova">Full explanation</a>.')}</p>
          <p>${tr('<strong>ציון העיבוד (1 עד 10)</strong> מפרט יותר, ומבדיל בין מוצרים באותה קבוצה לפי מספר הסמנים התעשייתיים ולפי רכיבים בעייתיים.', '<strong>The processing score (1 to 10)</strong> is more detailed, and tells apart products in the same group by the number of industrial markers and by problematic ingredients.')}</p>
          <p>${tr('שני המדדים מחושבים מרשימת הרכיבים בלבד. הם הערכה שלנו, ולא סיווג רשמי של גוף כלשהו.', 'Both measures are calculated from the ingredient list only. They are our own estimate, not an official classification by any body.')}</p>
        </section>
        <section class="prose-card">
          <h2>🔎 ${tr('מאיפה המידע', 'Where the information comes from')}</h2>
          <p>${tr('רשימות הרכיבים של המוצרים הממותגים מבוססות על התוויות שהיצרנים מדפיסים על האריזה. כשיש לנו מקור פתוח לבדיקה (המאגר Open Food Facts או אתר היצרן), הקישור מופיע בדף המוצר.', "The ingredient lists of branded products are based on the labels manufacturers print on the package. When we have an open source to check against (the Open Food Facts database or the manufacturer's website), the link appears on the product page.")}</p>
          <p>${tr('חלק מהמוצרים והברקודים מגיעים מהמאגר הפתוח <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a> (רישיון ODbL), שנכתב על ידי מתנדבים. ברקודים נוספים הותאמו מקובצי המחירים שרשתות השיווק מפרסמות לפי חוק שקיפות המחירים.', 'Some of the products and barcodes come from the open database <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a> (ODbL license), which is written by volunteers. Additional barcodes were matched from the price files that supermarket chains publish under the price transparency law.')}</p>
          <p>${tr('ההסברים על הרכיבים מבוססים על עמדות רשויות המזון (כמו רשות הבטיחות במזון האירופית וארגון הבריאות העולמי) ועל המחקר הקיים.', 'The ingredient explanations are based on the positions of food authorities (such as the European Food Safety Authority and the World Health Organization) and on existing research.')}</p>
        </section>
        <section class="prose-card">
          <h2>🤝 ${tr('שקיפות', 'Transparency')}</h2>
          <p>${tr('ההסברים והסיווגים באתר נכתבו בעזרת כלי בינה מלאכותית, על בסיס המקורות שלמעלה. עשינו מאמץ לדייק, אבל ייתכנו טעויות.', 'The explanations and classifications on this site were written with the help of AI tools, based on the sources above. We have made an effort to be accurate, but there may be mistakes.')}</p>
          <p>${tr('יצרנים מעדכנים מתכונים מדי פעם, ולכן <strong>התווית שעל האריזה היא שקובעת</strong>. מצאתם טעות או מוצר שהשתנה? <a data-mail href="#/team">כתבו לנו</a> ונתקן.', 'Manufacturers update recipes from time to time, so <strong>the label on the package is the binding version</strong>. Found a mistake or a product that has changed? <a data-mail href="#/team">Write to us</a> and we\'ll fix it.')}</p>
          <p>${tr('אין באתר פרסומות.', 'There are no ads on this site.')}</p>
        </section>
        <section class="prose-card">
          <h2>👥 ${tr('הצוות', 'The team')}</h2>
          <p>${tr('יאיר אברישמן, ליאם כהן, אוהד קראוזמן ונעה אברהמי.', 'Yair Abrishman, Liam Cohen, Ohad Krauzman and Noa Avrahami.')} <a href="#/team">${tr('לדף הצוות', 'Meet the team')}</a></p>
          <p class="muted small">${tr('האיורים באתר: Microsoft Fluent Emoji, ברישיון MIT.', 'Illustrations on this site: Microsoft Fluent Emoji, under the MIT license.')}</p>
        </section>
        <section class="prose-card">
          <h2>🔒 ${tr('פרטיות', 'Privacy')}</h2>
          <p>${tr('האתר לא אוסף מידע אישי, אין בו הרשמה, עוגיות או מעקב. הסל וערכת הנושא נשמרים רק במכשיר שלכם, והמחשבונים מחשבים במכשיר בלבד.', "The site doesn't collect personal information, and has no registration, cookies or tracking. Your basket and theme are saved only on your device, and the calculators run only on your device.")}</p>
          <p>${tr('תמונת המצלמה בסורק הברקוד מעובדת במכשיר בלבד. כשסורקים מוצר שלא נמצא במאגר שלנו, מספר הברקוד (ורק הוא) נשלח למאגר הפתוח Open Food Facts כדי לחפש את המוצר.', "The camera image in the barcode scanner is processed only on your device. When you scan a product that isn't in our database, the barcode number (and only that) is sent to the open database Open Food Facts to look up the product.")}</p>
        </section>
        <section class="prose-card disclaimer">
          <h2>⚠️ ${tr('הבהרה חשובה', 'Important note')}</h2>
          <p>${tr('המידע באתר הוא <strong>מידע כללי בלבד</strong>, ואינו ייעוץ רפואי או תזונתי. לכל שאלה בריאותית יש לפנות לרופא או לדיאטנית.', 'The information on this site is <strong>general information only</strong>, and is not medical or nutritional advice. For any health question, please consult a doctor or dietitian.')}</p>
        </section>
      </div>
    </main>
  `;
}

// ——————————————————————————————————————
// חיפוש
// ——————————————————————————————————————
export function renderSearchResults(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return '';
  if (/^\d{8,14}$/.test(q)) return `<a href="#/barcode/${q}" class="search-result-item" role="option"><span class="search-ing-icon" aria-hidden="true">📷</span><span class="search-result-info"><span class="search-result-name">${tr(`חיפוש לפי ברקוד ${q}`, `Search by barcode ${q}`)}</span><span class="search-result-brand">${tr('לחצו כדי לבדוק את המוצר', 'Tap to check the product')}</span></span></a>`;
  const starts = products.filter(p => p.name.toLowerCase().startsWith(q));
  const rest = products.filter(p => !starts.includes(p) && (p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.ingredients.some(i => i.toLowerCase().includes(q))));
  const prods = [...starts, ...rest].slice(0, 6);
  const qe = q.replace(/^e[\s-]+(?=\d)/, 'e');
  const ings = terms().filter(t => termSearchText(t).includes(qe)).slice(0, 4);

  if (!prods.length && !ings.length) return `<div class="search-empty">${tr(`לא נמצאו תוצאות עבור "${escapeHtml(query)}"`, `No results for "${escapeHtml(query)}"`)}</div>`;
  return `
    ${prods.map(p => `
      <a href="#/product/${p.id}" class="search-result-item" role="option">
        ${art(p, 'art-xs')}
        <span class="search-result-info"><span class="search-result-name">${escapeHtml(p.name)}</span><span class="search-result-brand">${escapeHtml(p.brand)}</span></span>
        ${novaBadge(p)}
      </a>`).join('')}
    ${ings.length ? `<div class="search-group">${tr('רכיבים', 'Ingredients')}</div>${ings.map(t => `
      <a href="${ingLink(t.id)}" class="search-result-item" role="option">
        <span class="search-ing-icon" aria-hidden="true">🧪</span>
        <span class="search-result-info"><span class="search-result-name">${escapeHtml(t.name)}</span><span class="search-result-brand">${escapeHtml([eLabel(t), loc(t.type)].filter(Boolean).join(' · '))}</span></span>
      </a>`).join('')}` : ''}
  `;
}

// ——————————————————————————————————————
// עזרים
// ——————————————————————————————————————
export function breadcrumb(parts) {
  return `
    <nav class="breadcrumbs container" aria-label="${tr('מיקום באתר', 'Breadcrumb')}">
      <a href="#/">${tr('דף הבית', 'Home')}</a>
      ${parts.map(([label, href]) => `<span aria-hidden="true">›</span>${href ? `<a href="${href}">${escapeHtml(label)}</a>` : `<span aria-current="page">${escapeHtml(label)}</span>`}`).join('')}
    </nav>`;
}

// ——— תנאי שימוש, פרטיות והצהרת נגישות ———
export function renderLegal() {
  return `
    <main class="page" id="page-content">
      ${breadcrumb([[tr('תנאי שימוש, פרטיות ונגישות', 'Terms of use, privacy and accessibility')]])}
      <section class="page-hero">
        <span class="page-hero-icon" aria-hidden="true">📜</span>
        <h1>${tr('תנאי שימוש, פרטיות ונגישות', 'Terms of use, privacy and accessibility')}</h1>
        <p>${tr('עודכן לאחרונה: נובמבר 2026', 'Last updated: November 2026')}</p>
      </section>
      <div class="container narrow legal">
        ${EN ? '<p class="muted small">This English version is a translation; if there is any difference, the Hebrew version prevails.</p>' : ''}
        <section class="prose-card" id="terms">
          <h2>${tr('תנאי שימוש', 'Terms of use')}</h2>
          <p>${tr('<strong>מידע כללי בלבד.</strong> המידע באתר נועד להסביר רשימות רכיבים של מוצרי מזון. הוא אינו ייעוץ רפואי, תזונתי או מקצועי, ואינו תחליף להתייעצות עם רופא או דיאטנית.', '<strong>General information only.</strong> The information on this site is intended to explain the ingredient lists of food products. It is not medical, nutritional or professional advice, and it is not a substitute for consulting a doctor or dietitian.')}</p>
          <p>${tr('<strong>המידע מוצג כמו שהוא.</strong> רשימות הרכיבים מבוססות על תוויות היצרנים במועד הבדיקה, וההסברים והסיווגים נכתבו בעזרת כלי בינה מלאכותית. ייתכנו טעויות או מידע שאינו עדכני, ויצרנים משנים מתכונים מדי פעם. <strong>התווית שעל האריזה היא הקובעת.</strong> השימוש במידע באתר הוא על אחריות המשתמש.', "<strong>The information is provided as is.</strong> The ingredient lists are based on the manufacturers' labels at the time they were checked, and the explanations and classifications were written with the help of AI tools. There may be errors or information that is not up to date, and manufacturers change recipes from time to time. <strong>The label on the package is the binding version.</strong> Use of the information on this site is at the user's own responsibility.")}</p>
          <p>${tr('<strong>הסיווגים הם הערכה.</strong> סיווג NOVA וציון העיבוד מחושבים באתר מרשימת הרכיבים בלבד, לפי שיטה שמוסברת ב<a href="#/nova">דף מדד NOVA</a>. הם מתארים את מידת העיבוד התעשייתי, ואינם קביעה על בטיחות, איכות או חוקיות של מוצר כלשהו. כל המוצרים באתר הם מוצרים שנמכרים כחוק, וכל הרכיבים בהם מותרים לשימוש.', '<strong>The classifications are estimates.</strong> The NOVA classification and the processing score are calculated on this site from the ingredient list only, using a method explained on the <a href="#/nova">NOVA scale page</a>. They describe the degree of industrial processing, and are not a determination about the safety, quality or legality of any product. All products on this site are lawfully sold products, and all of their ingredients are permitted for use.')}</p>
          <p>${tr('<strong>סימני מסחר.</strong> שמות המוצרים, המותגים והיצרנים באתר שייכים לבעליהם, ומופיעים רק כדי לזהות את המוצר. Tavitly אינו קשור ליצרנים, ואינו מקבל מהם מימון או חסות. האיורים באתר הם איורים כלליים שנוצרו לאתר, ואינם תמונות האריזה הרשמיות או לוגו של יצרן.', '<strong>Trademarks.</strong> The product, brand and manufacturer names on this site belong to their owners, and appear only to identify the product. Tavitly is not affiliated with the manufacturers and receives no funding or sponsorship from them. The illustrations on this site are generic illustrations created for the site, and are not official package images or a manufacturer\'s logo.')}</p>
          <p>${tr('<strong>מקורות.</strong> כשיש מקור פתוח לרשימת הרכיבים, הוא מצוין בדף המוצר. מוצרים שרשימת הרכיבים שלהם עוד לא אומתה מול מקור עדכני מסומנים בדף המוצר בהערה בולטת. חלק מהמידע והברקודים מגיע מהמאגר הפתוח <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a> (רישיון ODbL), וחלק מהברקודים מקובצי המחירים שרשתות השיווק מפרסמות לפי חוק קידום התחרות בענף המזון. <strong>המאגר המורחב</strong> (מוצרים שמזוהים בסריקה ואין להם דף מוצר משלהם) מבוסס על קובצי המחירים האלה ועל Open Food Facts, והניתוח שלו אוטומטי ולא נבדק ידנית.', '<strong>Sources.</strong> When there is an open source for an ingredient list, it is cited on the product page. Products whose ingredient list has not yet been verified against an up-to-date source are marked on the product page with a prominent note. Some of the information and barcodes come from the open database <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a> (ODbL license), and some of the barcodes come from the price files that supermarket chains publish under the Israeli Promotion of Competition in the Food Sector Law. <strong>The extended database</strong> (products identified by scanning that have no product page of their own) is based on these price files and on Open Food Facts, and its analysis is automatic and has not been manually reviewed.')}</p>
          <p>${tr('<strong>תיקונים והסרה.</strong> מצאתם טעות? יצרן שמבקש לתקן מידע על מוצר שלו? <a data-mail href="#/legal">כתבו לנו</a>, ונבדוק ונתקן או נסיר את המידע בהקדם.', '<strong>Corrections and removal.</strong> Found a mistake? A manufacturer asking to correct information about one of its products? <a data-mail href="#/legal">Write to us</a>, and we will look into it and correct or remove the information as soon as possible.')}</p>
        </section>
        <section class="prose-card" id="privacy">
          <h2>${tr('פרטיות', 'Privacy')}</h2>
          <ul>
            <li>${tr('האתר לא אוסף מידע אישי. אין בו הרשמה, עוגיות, פרסומות או כלי מעקב וסטטיסטיקה.', 'The site does not collect personal information. It has no registration, cookies, ads, or tracking and analytics tools.')}</li>
            <li>${tr('הסל, ערכת הנושא והגדרות דומות נשמרים רק בדפדפן שלכם (localStorage), ולא נשלחים לשום מקום. אפשר למחוק אותם בכל רגע דרך הגדרות הדפדפן.', 'Your basket, theme and similar settings are saved only in your browser (localStorage), and are not sent anywhere. You can delete them at any time through your browser settings.')}</li>
            <li>${tr('המחשבונים ובודק התווית מחשבים במכשיר שלכם בלבד.', 'The calculators and the label checker run only on your device.')}</li>
            <li>${tr('תמונת המצלמה בסורק הברקוד מעובדת במכשיר בלבד, ולא נשמרת ולא נשלחת.', 'The camera image in the barcode scanner is processed only on your device, and is neither saved nor sent.')}</li>
            <li>${tr('כשמצלמים רשימת רכיבים של מוצר שלא נמצא, הטקסט נקרא מהתמונה במכשיר עצמו (בעזרת Tesseract, שמאוחסן באתר). התמונה לא נשלחת לשום מקום. הטקסט ושם המוצר נשמרים רק בדפדפן שלכם (localStorage), ואפשר למחוק אותם בכל רגע מדף המוצר.', "When you photograph the ingredient list of a product that wasn't found, the text is read from the image on the device itself (using Tesseract, which is hosted on this site). The image is not sent anywhere. The text and the product name are saved only in your browser (localStorage), and you can delete them at any time from the product page.")}</li>
            <li>${tr('כפתור „הוספה למאגר הפתוח” פותח את האתר של Open Food Facts. ההוספה נעשית שם, לפי תנאי השימוש שלהם ועם חשבון משלכם. אנחנו לא שולחים אליהם דבר.', 'The "Add to the open database" button opens the Open Food Facts website. The product is added there, under their terms of use and with your own account. We do not send them anything.')}</li>
            <li>${tr('כרטיס השיתוף לוואטסאפ נוצר במכשיר. הוא נשלח רק אם תבחרו לשתף אותו.', 'The WhatsApp share card is created on your device. It is sent only if you choose to share it.')}</li>
            <li>${tr('כשסורקים ברקוד של מוצר שלא נמצא במאגר שלנו, מספר הברקוד (ורק הוא) נשלח למאגר הפתוח Open Food Facts כדי לחפש את המוצר. הבקשה נשלחת בלי עוגיות ובלי פרטים מזהים.', "When you scan the barcode of a product that isn't in our database, the barcode number (and only that) is sent to the open database Open Food Facts to look up the product. The request is sent without cookies and without identifying details.")}</li>
            <li>${tr('האתר מאוחסן ב-GitHub Pages, שעשויה לשמור יומני גישה טכניים (כמו כתובת IP) לפי <a href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">מדיניות הפרטיות של GitHub</a>.', 'The site is hosted on GitHub Pages, which may keep technical access logs (such as IP addresses) under <a href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">GitHub\'s privacy policy</a>.')}</li>
          </ul>
        </section>
        <section class="prose-card" id="accessibility">
          <h2>${tr('הצהרת נגישות', 'Accessibility statement')}</h2>
          <p>${tr('אנחנו רוצים שכל אחד יוכל להשתמש באתר. עשינו מאמץ להנגיש אותו לפי הנחיות תקן ישראלי 5568 (המבוסס על WCAG 2.0 ברמה AA). בין השאר:', 'We want everyone to be able to use this site. We have made an effort to make it accessible according to the guidelines of Israeli Standard 5568 (based on WCAG 2.0 at level AA). Among other things:')}</p>
          <ul>
            <li>${tr('האתר זמין בעברית (מימין לשמאל) ובאנגלית (משמאל לימין), עם כותרות במבנה היררכי וקישור לדילוג לתוכן הראשי.', 'The site is available in Hebrew (right-to-left) and English (left-to-right), with headings in a hierarchical structure and a link to skip to the main content.')}</li>
            <li>${tr('אפשר לנווט בכל האתר במקלדת, ורכיבים אינטראקטיביים מסומנים בפוקוס ברור.', 'The entire site can be navigated with a keyboard, and interactive elements are marked with a clear focus indicator.')}</li>
            <li>${tr('תמונות ואיורים דקורטיביים מוסתרים מקוראי מסך, ולכפתורים יש תיאור טקסטואלי.', 'Decorative images and illustrations are hidden from screen readers, and buttons have a text description.')}</li>
            <li>${tr('יש מצב כהה, והאתר תומך בהגדלת טקסט של הדפדפן עד 200% בלי לאבד תוכן.', "There is a dark mode, and the site supports enlarging text with the browser's settings up to 200% without losing content.")}</li>
            <li>${tr('האתר מכבד את הגדרת "הפחתת תנועה" של מערכת ההפעלה.', 'The site respects the operating system\'s "reduce motion" setting.')}</li>
          </ul>
          <p>${tr('ייתכן שחלקים באתר עדיין אינם נגישים במלואם. נתקלתם בבעיה? פנו לרכז הנגישות, ונשתדל לתקן בהקדם.', 'Some parts of the site may not yet be fully accessible. Ran into a problem? Contact the accessibility coordinator, and we will try to fix it as soon as possible.')}</p>
          <p><strong>${tr('רכז הנגישות:', 'Accessibility coordinator:')}</strong> ${tr('ליאם כהן, טלפון', 'Liam Cohen, phone')} <a href="tel:+972506714777" dir="ltr">050-671-4777</a>, ${tr('או', 'or')} <a data-mail href="#/legal">${tr('בדואר אלקטרוני', 'by email')}</a>.</p>
        </section>
      </div>
    </main>`;
}

export function renderNotFound() {
  return `
    <main class="page" id="page-content">
      <section class="page-hero">
        <span class="page-hero-icon" aria-hidden="true">🔍</span>
        <h1>${tr('הדף לא נמצא', 'Page not found')}</h1>
        <p>${tr('ייתכן שהקישור שגוי, או שהמוצר כבר לא במאגר.', 'The link may be wrong, or the product may no longer be in our database.')}</p>
        <a href="#/" class="btn btn-primary">${tr('חזרה לדף הבית', 'Back to home page')}</a>
      </section>
    </main>
  `;
}
