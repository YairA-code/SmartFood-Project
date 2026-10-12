// ============================================================
// Smart Food — קומפוננטות רינדור
// ============================================================

import { categories, products, getStats } from './data.js?v=14';
import { INGREDIENTS, canonicalName } from './ingredients.js?v=14';
import { escapeHtml } from './utils.js?v=14';
import { productArt } from './art.js?v=14';
import { toolCards, TOOLS, facts } from './widgets.js?v=14';
import { NOVA_GROUPS, getNova, novaReason, lookupIngredient, getScore, getAlternatives } from './nova.js?v=14';

const CAT_HUE = { snacks: 38, sweets: 18, dairy: 205, drinks: 188, bread: 32, canned: 85, cereals: 46, spreads: 12, meat: 355, frozen: 198, instant: 26, fruits: 130 };
export const RISK = {
  safe: { label: 'בטוח', cls: 'risk-safe' },
  caution: { label: 'במידה', cls: 'risk-caution' },
  danger: { label: 'בעייתי', cls: 'risk-danger' },
};
export const ROLE = {
  whole: 'מזון בסיסי',
  culinary: 'רכיב בישול',
  processed: 'רכיב מעובד',
  additive: 'תוסף',
  marker: 'סמן NOVA 4',
};

const activeCategories = () => categories.filter(c => products.some(p => p.category === c.id));
export const catOf = p => categories.find(c => c.id === p.category) || { name: '', icon: '' };
export const ingLink = name => `#/ingredient/${encodeURIComponent(name)}`;

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
  return `<span class="score-chip score-${level}" title="ציון עיבוד">ציון ${s}/10</span>`;
}

export function art(product, cls = '') {
  return productArt(product, cls);
}

// ——————————————————————————————————————
// Header / Footer
// ——————————————————————————————————————
export function renderHeader() {
  return `
    <a class="skip-link" href="#page-wrapper">דלג לתוכן</a>
    <header class="main-header" id="main-header">
      <div class="header-inner">
        <a href="#/" class="logo" aria-label="SmartFood, דף הבית">
          <img src="img/art/herb.webp" alt="" class="logo-mark" width="36" height="36">
          <span class="logo-text">Smart<span class="logo-highlight">Food</span></span>
        </a>
        <nav class="main-nav" id="main-nav" aria-label="ניווט ראשי">
          <a href="#/" class="nav-link" data-page="home">דף הבית</a>
          <a href="#/categories" class="nav-link" data-page="categories">קטגוריות</a>
          <a href="#/compare" class="nav-link" data-page="compare">השוואות</a>
          <a href="#/tools" class="nav-link" data-page="tools">כלים</a>
          <a href="#/ingredients" class="nav-link" data-page="ingredients">מילון רכיבים</a>
          <a href="#/nova" class="nav-link" data-page="nova">מדד NOVA</a>
          <a href="#/team" class="nav-link" data-page="team">צוות</a>
          <a href="#/about" class="nav-link" data-page="about">אודות</a>
        </nav>
        <div class="header-actions">
          <a href="#/basket" class="icon-btn basket-btn" id="basket-btn" aria-label="הסל שלי">🛒<span class="basket-count" id="basket-count" hidden>0</span></a>
          <button class="icon-btn theme-toggle" id="theme-toggle" aria-label="מעבר בין מצב בהיר לכהה">
            <span class="theme-icon-light" aria-hidden="true">☀️</span>
            <span class="theme-icon-dark" aria-hidden="true">🌙</span>
          </button>
          <button class="icon-btn mobile-menu-btn" id="mobile-menu-btn" aria-label="פתיחת תפריט" aria-expanded="false" aria-controls="main-nav">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </header>
  `;
}

export function renderFooter() {
  return `
    <footer class="main-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <a href="#/" class="logo">
            <img src="img/art/herb.webp" alt="" class="logo-mark" width="32" height="32">
            <span class="logo-text">Smart<span class="logo-highlight">Food</span></span>
          </a>
          <p>פרויקט אקדמי שמנתח מוצרי מזון בשוק הישראלי לפי מדד NOVA. המידע לימודי בלבד ואינו ייעוץ רפואי או תזונתי.</p>
          <p class="footer-mail">חסר מוצר? כתבו לנו: <a data-mail href="#/team">צרו קשר</a></p>
        </div>
        <div class="footer-col">
          <h2 class="footer-h">קטגוריות</h2>
          <ul>${activeCategories().slice(0, 6).map(c => `<li><a href="#/category/${c.id}">${c.icon} ${c.name}</a></li>`).join('')}</ul>
        </div>
        <div class="footer-col">
          <p class="footer-h" aria-hidden="true">&nbsp;</p>
          <ul>${activeCategories().slice(6).map(c => `<li><a href="#/category/${c.id}">${c.icon} ${c.name}</a></li>`).join('')}</ul>
        </div>
        <div class="footer-col">
          <h2 class="footer-h">לגלות עוד</h2>
          <ul>
            <li><a href="#/products">כל המוצרים</a></li>
            <li><a href="#/compare">מעובד מול פשוט</a></li>
            <li><a href="#/tools">כלים</a></li>
            <li><a href="#/team">הצוות</a></li>
            <li><a href="#/nova">מה זה מדד NOVA?</a></li>
            <li><a href="#/ingredients">מילון רכיבים</a></li>
            <li><a href="#/about">אודות הפרויקט</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© ${new Date().getFullYear()} Smart Food · פרויקט סיום בקורס מבוא לבינה מלאכותית · איורים: Microsoft Fluent Emoji (רישיון MIT)</p>
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
            <p class="eyebrow">ניתוח מוצרי מזון לפי מדד NOVA</p>
            <h1 class="hero-title">מה באמת יש <span class="hl">בתווית?</span></h1>
            <p class="hero-subtitle">בדקנו ${stats.totalProducts} מוצרים מהסופר, רכיב אחרי רכיב. לכל מוצר תמצאו את דרגת העיבוד שלו, הסבר פשוט לכל רכיב וחלופה פשוטה יותר.</p>
            <div class="hero-search" id="hero-search">
              <label for="global-search" class="visually-hidden">חיפוש מוצר, מותג או רכיב</label>
              <div class="search-wrapper">
                <span class="search-icon" aria-hidden="true">🔍</span>
                <input type="search" id="global-search" class="search-input" placeholder="חפשו מוצר, מותג או רכיב, למשל: במבה, E621" autocomplete="off" />
              </div>
              <div class="search-results" id="search-results" role="listbox"></div>
            </div>
            <div class="hero-links">
              <a href="#/random" class="btn btn-ghost btn-sm">🎲 מוצר אקראי</a>
              <a href="#/label" class="btn btn-ghost btn-sm">🔬 בדיקת תווית</a>
              <a href="#/quiz" class="btn btn-ghost btn-sm">🎯 חידון</a>
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

      <section class="stats-bar" aria-label="המאגר במספרים">
        <a class="stat-item" href="#/products"><span class="stat-number">${stats.totalProducts}</span><span class="stat-label">מוצרים</span></a>
        <a class="stat-item" href="#/ingredients"><span class="stat-number">${stats.totalIngredients}</span><span class="stat-label">רכיבים מוסברים</span></a>
        <a class="stat-item" href="#/categories"><span class="stat-number">${stats.totalCategories}</span><span class="stat-label">קטגוריות</span></a>
        <a class="stat-item" href="#/nova"><span class="stat-number danger-color">${novaCounts[3]}</span><span class="stat-label">מוצרים אולטרה-מעובדים</span></a>
      </section>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">איך זה עובד</h2>
          <p class="section-subtitle">שלושה צעדים מהמדף להחלטה</p>
        </div>
        <div class="steps">
          <div class="step-card"><span class="step-num">1</span><h3>בוחרים מוצר</h3><p>מחפשים לפי שם, מותג או רכיב, או עוברים בין הקטגוריות.</p></div>
          <div class="step-card"><span class="step-num">2</span><h3>מבינים את הרכיבים</h3><p>כל רכיב מוסבר בשפה פשוטה, והרכיבים שקבעו את דרגת העיבוד מסומנים.</p></div>
          <div class="step-card"><span class="step-num">3</span><h3>בוחרים חלופה</h3><p>לכל מוצר מעובד מוצעת חלופה פשוטה יותר מאותו סוג.</p></div>
        </div>
      </section>

      <section class="section section-alt">
        <div class="section-head">
          <h2 class="section-title">כלים חכמים</h2>
          <p class="section-subtitle">לבדוק תווית, להשוות, לשחק ולבנות סל קניות</p>
        </div>
        ${toolCards(TOOLS.slice(0, 4))}
        <div class="fact-box" id="fact-box">
          <span class="fact-icon" aria-hidden="true">💡</span>
          <div><strong>הידעת?</strong> <span id="fact-text">${escapeHtml(facts()[0])}</span></div>
          <button class="icon-btn" id="fact-next" aria-label="עובדה נוספת" title="עובדה נוספת">↻</button>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">כמה מעובד המאגר שלנו?</h2>
          <p class="section-subtitle">כל מוצר מסווג לפי מדד NOVA הבינלאומי, לפי רשימת הרכיבים שלו</p>
        </div>
        <div class="nova-bar" role="img" aria-label="${[1, 2, 3, 4].map(g => `NOVA ${g}: ${novaCounts[g - 1]} מוצרים`).join(', ')}">
          ${[1, 2, 3, 4].map(g => novaCounts[g - 1] ? `<a href="#/nova" class="nova-bar-seg" style="flex:${novaCounts[g - 1]};background:${NOVA_GROUPS[g].color};color:${NOVA_GROUPS[g].on}" title="NOVA ${g}: ${NOVA_GROUPS[g].name}"><span>${novaCounts[g - 1]}</span></a>` : '').join('')}
        </div>
        <div class="nova-legend">
          ${[1, 2, 3, 4].map(g => `<span class="nova-legend-item"><span class="nova-dot" style="background:${NOVA_GROUPS[g].color};color:${NOVA_GROUPS[g].on}"></span>NOVA ${g} · ${NOVA_GROUPS[g].short}</span>`).join('')}
        </div>
        <div class="center-cta"><a href="#/nova" class="btn btn-ghost">מה זה מדד NOVA?</a></div>
      </section>

      <section class="section section-alt">
        <div class="section-head">
          <h2 class="section-title">מעובד מול פשוט</h2>
          <p class="section-subtitle">אותו צורך, רשימת רכיבים אחרת לגמרי</p>
        </div>
        <div class="compare-teaser">
          ${teaser.map(x => `
            <a class="teaser-card animate-item" href="#/compare">
              <div class="teaser-side">${art(x.pa, 'art-mini')}<span>${escapeHtml(x.pa.name)}</span>${novaBadge(x.pa)}</div>
              <span class="teaser-arrow" aria-hidden="true">←</span>
              <div class="teaser-side">${art(x.pb, 'art-mini')}<span>${escapeHtml(x.pb.name)}</span>${novaBadge(x.pb)}</div>
            </a>`).join('')}
        </div>
        <div class="center-cta"><a href="#/compare" class="btn btn-primary">לכל ${comparePairs.length} ההשוואות</a></div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">קטגוריות</h2>
          <p class="section-subtitle">בחרו קטגוריה וגלו מה יש במוצרים שאתם קונים</p>
        </div>
        ${renderCategoryGrid()}
      </section>

      <section class="section section-alt">
        <div class="section-head">
          <h2 class="section-title">הכי מעובדים במאגר</h2>
          <p class="section-subtitle">המוצרים עם ציון העיבוד הגבוה ביותר</p>
        </div>
        <div class="products-grid">${topProcessed.map(renderProductCard).join('')}</div>
      </section>
    </main>
  `;
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
            <span class="category-count">${list.length} מוצרים${ultra ? ` · ${ultra} אולטרה-מעובדים` : ''}</span>
          </a>`;
      }).join('')}
    </div>`;
}

// ——————————————————————————————————————
// קטגוריות
// ——————————————————————————————————————
export function renderCategoriesPage() {
  return `
    <main class="page" id="page-content">
      ${breadcrumb([['כל הקטגוריות']])}
      <section class="page-hero">
        <h1>כל הקטגוריות</h1>
        <p>${products.length} מוצרים ב-${activeCategories().length} קטגוריות</p>
        <a href="#/products" class="btn btn-primary">לכל המוצרים, עם חיפוש וסינון</a>
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
      ${breadcrumb([['קטגוריות', '#/categories'], [cat.name]])}
      <section class="page-hero">
        <span class="page-hero-icon" aria-hidden="true">${cat.icon}</span>
        <h1>${cat.name}</h1>
        <p>${cat.description} · ${list.length} מוצרים</p>
      </section>
      <div class="container">
        <div class="toolbar">
          <div class="filters" role="group" aria-label="סינון לפי NOVA">
            <button class="filter-btn active" data-filter="all">הכל</button>
            ${groups.map(g => `<button class="filter-btn filter-nova" data-filter="nova${g}" style="--nova:${NOVA_GROUPS[g].color}">NOVA ${g}</button>`).join('')}
          </div>
          <label class="sorting">מיון:
            <select id="sort-select">
              <option value="nova-asc">הכי פחות מעובד</option>
              <option value="nova-desc">הכי מעובד</option>
              <option value="name">א-ב</option>
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
      ${breadcrumb([['קטגוריות', '#/categories'], ['כל המוצרים']])}
      <section class="page-hero">
        <span class="page-hero-icon" aria-hidden="true">🛒</span>
        <h1>כל המוצרים</h1>
        <p>${products.length} מוצרים. חפשו, סננו לפי קטגוריה ודרגת עיבוד, ומיינו.</p>
      </section>
      <div class="container">
        <div class="toolbar toolbar-all">
          <label class="search-inline"><span class="visually-hidden">חיפוש מוצר</span>
            <input type="search" id="all-search" placeholder="חפשו מוצר או מותג" autocomplete="off">
          </label>
          <label class="sorting">קטגוריה:
            <select id="all-cat">
              <option value="">כל הקטגוריות</option>
              ${activeCategories().map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </label>
          <div class="filters" role="group" aria-label="סינון לפי NOVA">
            <button class="filter-btn active" data-nova="all" aria-pressed="true">הכל</button>
            ${[1, 2, 3, 4].map(g => `<button class="filter-btn filter-nova" data-nova="${g}" aria-pressed="false" style="--nova:${NOVA_GROUPS[g].color}">NOVA ${g}</button>`).join('')}
          </div>
          <label class="sorting">מיון:
            <select id="all-sort">
              <option value="name">א-ב</option>
              <option value="nova-asc">הכי פחות מעובד</option>
              <option value="nova-desc">הכי מעובד</option>
              <option value="ings">הכי מעט רכיבים</option>
            </select>
          </label>
        </div>
        <p class="muted" id="all-count" aria-live="polite">${products.length} מוצרים</p>
        <div class="products-grid" id="all-grid">${sorted.map(renderProductCard).join('')}</div>
        <div class="empty-note" id="all-empty" hidden>לא נמצאו מוצרים. נסו לשנות את החיפוש או את הסינון.</div>
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
            <button class="btn btn-primary btn-sm" id="basket-toggle" data-id="${product.id}" aria-pressed="false">🛒 הוספה לסל</button>
            <a class="btn btn-ghost btn-sm" href="#/vs/${product.id}/${altList[0] ? altList[0].id : '-'}">⚖️ השוואה למוצר אחר</a>
            <button class="btn btn-ghost btn-sm" id="copy-link">🔗 העתקת קישור</button>
          </div>
        </div>
        <div class="gauge score-${level}" aria-label="ציון עיבוד ${score} מתוך 10">
          <svg viewBox="0 0 120 120" class="gauge-svg" aria-hidden="true">
            <circle class="gauge-bg" cx="60" cy="60" r="54"/>
            <circle class="gauge-fill" cx="60" cy="60" r="54" style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - score / 10)}"/>
          </svg>
          <div class="gauge-center"><span class="gauge-number">${score}</span><span class="gauge-max">/10</span></div>
          <span class="gauge-label">ציון עיבוד</span>
        </div>
      </section>

      <section class="container">
        <div class="nova-panel" style="--nova:${nova.color};--nova-bg:${nova.bg}">
          <div class="nova-panel-num" aria-hidden="true">${nova.group}</div>
          <div class="nova-panel-body">
            <p class="eyebrow">סיווג NOVA</p>
            <h2 class="nova-panel-title">NOVA ${nova.group}: ${nova.name}</h2>
            <p class="nova-panel-text">${escapeHtml(novaReason(product))}</p>
            <div class="nova-scale" aria-hidden="true">
              ${[1, 2, 3, 4].map(g => `<span class="nova-scale-step ${g === nova.group ? 'current' : ''}" style="background:${NOVA_GROUPS[g].color};color:${NOVA_GROUPS[g].on}">${g}</span>`).join('')}
            </div>
            <a href="#/nova" class="text-link">מה זה מדד NOVA ואיך הוא מחושב? ←</a>
          </div>
        </div>
      </section>

      <section class="container">
        <div class="section-head start">
          <h2 class="section-title">ניתוח הרכיבים</h2>
          <p class="section-subtitle">${items.length} רכיבים, לפי הסדר שבתווית (מהכמות הגדולה לקטנה)</p>
        </div>
        <div class="risk-summary">
          <span class="count-badge risk-safe">${counts.safe} בטוחים</span>
          <span class="count-badge risk-caution">${counts.caution} במידה</span>
          <span class="count-badge risk-danger">${counts.danger} בעייתיים</span>
        </div>
        <ol class="ing-list">
          ${items.map(i => `
            <li class="ing-row ${RISK[i.risk].cls}">
              <span class="ing-risk ${RISK[i.risk].cls}">${RISK[i.risk].label}</span>
              <div class="ing-main">
                <a class="ing-name" href="${ingLink(i.key)}">${escapeHtml(i.name)}</a>
                <span class="ing-type">${escapeHtml(i.type)}</span>
                ${i.nova === 'marker' ? '<span class="nova-marker">סמן NOVA 4</span>' : ''}
              </div>
              <p class="ing-reason">${escapeHtml(i.reason)}</p>
            </li>`).join('')}
        </ol>
        <p class="source-note">${product.source
          ? `מקור רשימת הרכיבים: <a href="${/^https:\/\//.test(product.source.url) ? escapeHtml(product.source.url) : '#'}" target="_blank" rel="noopener noreferrer">${escapeHtml(product.source.label)}</a>. יצרנים מעדכנים מתכונים מדי פעם, ולכן כדאי לבדוק תמיד את התווית שעל האריזה.`
          : 'מוצר כללי: רשימת הרכיבים מתארת את המוצר הבסיסי, בלי מותג מסוים.'}</p>
      </section>

      <section class="container">
        <div class="section-head start">
          <h2 class="section-title">חלופות פשוטות יותר</h2>
          <p class="section-subtitle">${altList.length ? 'מוצרים מאותו סוג, עם פחות עיבוד' : ''}</p>
        </div>
        ${altList.length ? `
          ${pair && pairProduct ? `<p class="pair-note">💡 ${escapeHtml(pair.note)}</p>` : ''}
          <div class="products-grid">${altList.map(renderProductCard).join('')}</div>
        ` : `
          <div class="empty-note">${nova.group <= 2
            ? 'המוצר הזה כבר נמצא בדרגת העיבוד הנמוכה ביותר בקבוצה שלו. בחירה טובה.'
            : 'אין במאגר שלנו חלופה מעובדת פחות מאותו סוג. אפשר לחפש בסופר מוצר עם רשימת רכיבים קצרה יותר, בלי צבעי מאכל, חומרי טעם ומתחלבים.'}</div>
        `}
      </section>
    </main>
  `;
}

// ——————————————————————————————————————
// מעובד מול פשוט
// ——————————————————————————————————————
export const comparePairs = [
  { a: 'bamba_nougat', b: 'bamba', note: 'אותה במבה, בלי קרם הנוגט, המתחלב וחומרי הטעם' },
  { a: 'bisli_grill', b: 'tapuchips', note: 'חטיף מלוח משלושה רכיבים בלבד, בלי מחזקי טעם' },
  { a: 'doritos', b: 'corn_canned', note: 'תירס אמיתי במקום חטיף תירס עם שלושה מחזקי טעם' },
  { a: 'milki', b: 'yogurt_greek', note: 'מעדן חלבי בלי סוכר, עמילן מעובד וקרגינן' },
  { a: 'daniela', b: 'eshel', note: 'מוצר חלב מותסס מרכיב אחד בלבד' },
  { a: 'emek', b: 'white_cheese', note: 'גבינה מחלב ומלח, בלי צבע מאכל וחומר משמר' },
  { a: 'cola', b: 'water_mineral', note: 'בלי סוכר, צבע קרמל וקפאין' },
  { a: 'cola_zero', b: 'orange_juice', note: 'מיץ סחוט במקום ממתיקים מלאכותיים' },
  { a: 'kariot', b: 'quaker', note: 'דגן מלא אחד במקום קרם נוגט ושמן מוקשה' },
  { a: 'hot_dogs', b: 'chicken_breast', note: 'בשר אמיתי, בלי חלבון סויה, ניטריט וצבעי מאכל' },
  { a: 'pastrami', b: 'sardines', note: 'מילוי לכריך: דג, שמן זית ומלח בלבד' },
  { a: 'corn_schnitzel', b: 'peas', note: 'ירק קפוא בלי ציפוי ובלי חלבון חיטה' },
  { a: 'noodles', b: 'pasta_whole', note: 'חיטה מלאה בלבד, בלי ארבעה מחזקי טעם ומלטודקסטרין' },
  { a: 'mayo', b: 'tahini', note: 'ממרח מרכיב אחד: שומשום טחון' },
  { a: 'gummy', b: 'apple', note: 'מתוק טבעי, בלי סירופ גלוקוז וצבעי מאכל' },
  { a: 'mekupelet', b: 'banana', note: 'חטיף מתוק ומשביע, בלי סוכר מוסף' },
  { a: 'cheetos', b: 'rice_cakes', note: 'חטיף פריך משני רכיבים: אורז מלא ומלח' },
  { a: 'neviot_grape', b: 'water_mineral', note: 'אותם מים, בלי פרוקטוז וחומרי טעם וריח' },
  { a: 'salami', b: 'eggs', note: 'חלבון לכריך, בלי ניטריט, פוספטים ומחזקי טעם' },
  { a: 'mashed', b: 'potato', note: 'תפוח אדמה אמיתי. בבית מוסיפים רק חלב, חמאה ומלח' },
  { a: 'chicken_soup', b: 'lentils', note: 'מרק עדשים ביתי מרכיב בסיסי אחד, בלי אבקת מרק' },
  { a: 'cornflakes', b: 'cornflakes_whole', note: 'קורנפלקס מתירס מלא, בלי חומרי טעם וריח' },
  { a: 'danone_pro_vanilla', b: 'danone_pro', note: 'אותו יוגורט חלבון, מחלב בלבד, בלי ממתיקים מלאכותיים ועמילן מעובד' },
];

function compareSide(p, kind) {
  const n = getNova(p);
  return `
    <a href="#/product/${p.id}" class="compare-side ${kind}">
      ${art(p, 'art-mini')}
      <div class="compare-side-body">
        <span class="compare-kind">${kind === 'processed' ? 'המוצר המעובד' : 'החלופה הפשוטה'}</span>
        <h3>${escapeHtml(p.name)}</h3>
        <p class="card-brand">${escapeHtml(p.brand)}</p>
        <div class="card-badges">${novaBadge(p)}${scoreChip(p)}</div>
        <p class="compare-ings"><strong>${p.ingredients.length}</strong> ${p.ingredients.length === 1 ? 'רכיב' : 'רכיבים'}${n.markers.length ? ` · <strong>${n.markers.length}</strong> סמני עיבוד תעשייתי` : ''}</p>
      </div>
    </a>`;
}

export function renderCompare() {
  const pairs = comparePairs.map(x => ({ ...x, pa: products.find(p => p.id === x.a), pb: products.find(p => p.id === x.b) })).filter(x => x.pa && x.pb);
  return `
    <main class="page" id="page-content">
      ${breadcrumb([['מעובד מול פשוט']])}
      <section class="page-hero">
        <span class="page-hero-icon" aria-hidden="true">⚖️</span>
        <h1>מעובד מול פשוט</h1>
        <p>${pairs.length} השוואות בין מוצר מעובד לחלופה פשוטה שממלאת את אותו צורך. לחצו על מוצר כדי לראות את כל הרכיבים.</p>
      </section>
      <div class="container compare-list">
        ${pairs.map(x => `
          <article class="compare-row animate-item">
            ${compareSide(x.pa, 'processed')}
            <div class="compare-vs" aria-hidden="true">←</div>
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
      ${breadcrumb([['מדד NOVA']])}
      <section class="page-hero">
        <span class="page-hero-icon" aria-hidden="true">🧭</span>
        <h1>מה זה מדד NOVA?</h1>
        <p>סיווג בינלאומי שמחלק את כל המזון לארבע קבוצות לפי מידת העיבוד התעשייתי, ולא לפי קלוריות</p>
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
                  <div><h2>${G.name}</h2><p class="muted">${list.length} מוצרים באתר</p></div>
                </div>
                <p>${G.desc}</p>
                <p class="muted"><strong>דוגמאות:</strong> ${G.examples}</p>
                ${list.length ? `<div class="chips">${list.map(p => `<a href="#/product/${p.id}" class="chip">${escapeHtml(p.name)}</a>`).join('')}</div>` : ''}
              </section>`;
          }).join('')}
        </div>

        <section class="prose-card">
          <h2>איך אנחנו מחשבים את הסיווג?</h2>
          <p>כל רכיב במילון הרכיבים שלנו מסומן לפי התפקיד שלו, והסיווג של המוצר נקבע לפי הרכיבים:</p>
          <ul>
            <li><strong>NOVA 4</strong>: יש לפחות רכיב אחד שמאפיין עיבוד תעשייתי, כמו צבעי מאכל, חומרי טעם וריח, מחזקי טעם, מתחלבים, מייצבים, ממתיקים, סירופ גלוקוז, מלטודקסטרין, עמילן מעובד או חלבון מבודד.</li>
            <li><strong>NOVA 3</strong>: מזון בסיסי שהוסיפו לו מלח, סוכר, שמן או חומר משמר.</li>
            <li><strong>NOVA 2</strong>: רכיב בישול בלבד, כמו שמן או סוכר.</li>
            <li><strong>NOVA 1</strong>: כל הרכיבים טבעיים או עברו עיבוד מינימלי, כמו ייבוש, הקפאה, פסטור או התססה. ויטמינים ומינרלים שהוספו להעשרה לא משנים את הדרגה.</li>
          </ul>
          <h3>ציון העיבוד (1 עד 10)</h3>
          <p>כדי להבדיל בין מוצרים באותה קבוצה, לכל מוצר יש גם ציון עיבוד: NOVA 1 מקבל 1, ו-NOVA 2 מקבל 2. NOVA 3 מקבל 3 עד 5, לפי תוספת סוכר וחומר משמר. NOVA 4 מקבל 6 עד 10, לפי מספר הסמנים התעשייתיים ולפי נוכחות רכיב בדרגת סיכון "בעייתי".</p>
          <p class="muted">מקור ההגדרות: מערכת NOVA שפותחה באוניברסיטת סאו פאולו (Monteiro ועמיתיו). הסיווג באתר מחושב מרשימת הרכיבים, ולכן הוא הערכה ולא סיווג רשמי.</p>
        </section>
      </div>
    </main>
  `;
}

// ——————————————————————————————————————
// מילון רכיבים
// ——————————————————————————————————————
function ingredientUsage() {
  const map = new Map();
  products.forEach(p => p.ingredients.forEach(i => {
    const key = INGREDIENTS[i] ? i : canonicalName(i);
    if (!map.has(key)) map.set(key, []);
    if (!map.get(key).includes(p)) map.get(key).push(p);
  }));
  return map;
}

export function renderIngredients() {
  const usage = ingredientUsage();
  const keys = [...usage.keys()].sort((a, b) => a.localeCompare(b, 'he'));
  const roles = ['marker', 'additive', 'culinary', 'processed', 'whole'];
  return `
    <main class="page" id="page-content">
      ${breadcrumb([['מילון רכיבים']])}
      <section class="page-hero">
        <span class="page-hero-icon" aria-hidden="true">📖</span>
        <h1>מילון רכיבים</h1>
        <p>${keys.length} רכיבים מכל המוצרים באתר, עם הסבר פשוט לכל אחד</p>
      </section>
      <div class="container">
        <div class="toolbar">
          <label class="search-inline"><span class="visually-hidden">חיפוש רכיב</span>
            <input type="search" id="ing-search" placeholder="חפשו רכיב, למשל: לציטין, E471, סוכר" autocomplete="off">
          </label>
          <div class="filters" role="group" aria-label="סינון לפי תפקיד">
            <button class="filter-btn active" data-role="all">הכל</button>
            ${roles.map(r => `<button class="filter-btn" data-role="${r}">${ROLE[r]}</button>`).join('')}
          </div>
        </div>
        <p class="muted" id="ing-count">${keys.length} רכיבים</p>
        <div class="ing-grid" id="ing-grid">
          ${keys.map(k => {
            const d = INGREDIENTS[k];
            const list = usage.get(k);
            return `
              <a class="ing-card animate-item" href="${ingLink(k)}" data-role="${d.nova}" data-search="${escapeHtml((k + ' ' + d.type + ' ' + d.reason).toLowerCase())}">
                <div class="ing-card-head">
                  <h3>${escapeHtml(k)}</h3>
                  <span class="ing-risk ${RISK[d.risk].cls}">${RISK[d.risk].label}</span>
                </div>
                <p class="ing-type">${escapeHtml(d.type)} · ${ROLE[d.nova]}</p>
                <p class="ing-reason">${escapeHtml(d.reason)}</p>
                <p class="muted small">מופיע ב-${list.length} ${list.length === 1 ? 'מוצר' : 'מוצרים'}</p>
              </a>`;
          }).join('')}
        </div>
      </div>
    </main>
  `;
}

export function renderIngredient(key) {
  if (!INGREDIENTS[key]) {
    const k = key.trim();
    key = Object.keys(INGREDIENTS).find(x => x.trim() === k)
      || Object.keys(INGREDIENTS).find(x => x.startsWith(k + ' (') || x.replace(/\s*\(.*\)$/, '') === k)
      || key;
  }
  const d = INGREDIENTS[key];
  if (!d) return renderNotFound();
  const list = ingredientUsage().get(key) || [];
  return `
    <main class="page" id="page-content">
      ${breadcrumb([['מילון רכיבים', '#/ingredients'], [key]])}
      <section class="container">
        <div class="prose-card ingredient-detail">
          <div class="ing-card-head">
            <h1>${escapeHtml(key)}</h1>
            <span class="ing-risk ${RISK[d.risk].cls}">${RISK[d.risk].label}</span>
          </div>
          <p class="ing-type">${escapeHtml(d.type)} · ${ROLE[d.nova]}${d.nova === 'marker' ? ' <span class="nova-marker">מאפיין מזון אולטרה-מעובד</span>' : ''}</p>
          <p class="lead">${escapeHtml(d.reason)}</p>
          <p class="muted small">רמת הסיכון מתייחסת לרכיב בכמויות הרגילות במזון, לפי עמדת רשויות המזון והמחקר הקיים. זה מידע לימודי ולא ייעוץ רפואי.</p>
        </div>
      </section>
      <section class="container">
        <div class="section-head start"><h2 class="section-title">מופיע ב-${list.length} ${list.length === 1 ? 'מוצר' : 'מוצרים'}</h2></div>
        <div class="products-grid">${list.map(renderProductCard).join('')}</div>
      </section>
    </main>
  `;
}

// ——————————————————————————————————————
// אודות
// ——————————————————————————————————————
export function renderAbout() {
  return `
    <main class="page" id="page-content">
      ${breadcrumb([['אודות']])}
      <section class="page-hero">
        <span class="page-hero-icon" aria-hidden="true">🥦</span>
        <h1>אודות Smart Food</h1>
        <p>פרויקט סיום בקורס "מבוא לבינה מלאכותית"</p>
      </section>
      <div class="container about-grid">
        <section class="prose-card">
          <h2>🎯 מטרת הפרויקט</h2>
          <p>תווית הרכיבים בסופר מלאה במספרי E ובשמות כימיים שקשה להבין. Smart Food מנגיש את מדד NOVA הבינלאומי: לכל מוצר מוצגים דרגת העיבוד שלו, הסבר פשוט לכל רכיב וחלופה פשוטה יותר.</p>
          <p>קהל היעד: צרכנים שרוצים לקנות בצורה מודעת יותר, הורים, וכל מי שרוצה להבין את התווית בלי ידע מוקדם בכימיה.</p>
        </section>
        <section class="prose-card">
          <h2>🧭 שני מדדים לכל מוצר</h2>
          <p><strong>מדד NOVA (1 עד 4)</strong> הוא סיווג בינלאומי לפי מידת העיבוד התעשייתי. <a href="#/nova">הסבר מלא</a>.</p>
          <p><strong>ציון העיבוד (1 עד 10)</strong> מפרט יותר, ומבדיל בין מוצרים באותה קבוצה לפי מספר הסמנים התעשייתיים ולפי רכיבים בעייתיים.</p>
        </section>
        <section class="prose-card">
          <h2>🔎 מאיפה המידע</h2>
          <p>רשימות הרכיבים של המוצרים הממותגים נבדקו מול מקורות ציבוריים (FoodsDictionary, Foodiepedia ואתרי היצרנים), והקישור למקור מופיע בדף של כל מוצר. יצרנים מעדכנים מתכונים מדי פעם, ולכן כדאי לבדוק תמיד גם את התווית שעל האריזה.</p>
          <p>ההסברים על הרכיבים מבוססים על עמדות רשויות המזון (כמו רשות הבטיחות במזון האירופית וארגון הבריאות העולמי) ועל המחקר הקיים.</p>
        </section>
        <section class="prose-card">
          <h2>🤖 איך בנינו את האתר</h2>
          <ul>
            <li><strong>ChatGPT / Claude</strong>: ניתוח וסיווג רכיבי המזון, ניסוח הסברים פשוטים ובניית מאגר המוצרים</li>
            <li><strong>Cursor / v0</strong>: בניית קוד הממשק (HTML, CSS ו-JavaScript) ועיצוב כרטיסי המוצר</li>
            <li><strong>בקרה אנושית</strong>: כל סיווג והסבר שה-AI הפיק נבדק, אומת והוגה על ידי חבר צוות לפני שנכנס לאתר</li>
          </ul>
        </section>
        <section class="prose-card">
          <h2>👥 הצוות</h2>
          <p>יאיר פנחס אברישמן, ליאם כהן, אוהד קראוזמן ונעה אברהמי. <a href="#/team">לדף הצוות</a></p>
          <p class="muted">BSc במערכות מידע, הפקולטה למנהל עסקים.</p>
          <p class="muted small">האיורים באתר: Microsoft Fluent Emoji, ברישיון MIT.</p>
        </section>
        <section class="prose-card disclaimer">
          <h2>⚠️ הבהרה חשובה</h2>
          <p>המידע באתר מוצג <strong>למטרות לימודיות בלבד</strong> במסגרת פרויקט אקדמי, ואינו ייעוץ רפואי או תזונתי. לכל שאלה בריאותית יש לפנות לרופא או לדיאטנית.</p>
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
  const starts = products.filter(p => p.name.toLowerCase().startsWith(q));
  const rest = products.filter(p => !starts.includes(p) && (p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.ingredients.some(i => i.toLowerCase().includes(q))));
  const prods = [...starts, ...rest].slice(0, 6);
  const ings = Object.keys(INGREDIENTS).filter(k => k.toLowerCase().includes(q)).slice(0, 4);

  if (!prods.length && !ings.length) return `<div class="search-empty">לא נמצאו תוצאות עבור "${escapeHtml(query)}"</div>`;
  return `
    ${prods.map(p => `
      <a href="#/product/${p.id}" class="search-result-item" role="option">
        ${art(p, 'art-xs')}
        <span class="search-result-info"><span class="search-result-name">${escapeHtml(p.name)}</span><span class="search-result-brand">${escapeHtml(p.brand)}</span></span>
        ${novaBadge(p)}
      </a>`).join('')}
    ${ings.length ? `<div class="search-group">רכיבים</div>${ings.map(k => `
      <a href="${ingLink(k)}" class="search-result-item" role="option">
        <span class="search-ing-icon" aria-hidden="true">🧪</span>
        <span class="search-result-info"><span class="search-result-name">${escapeHtml(k)}</span><span class="search-result-brand">${escapeHtml(INGREDIENTS[k].type)}</span></span>
      </a>`).join('')}` : ''}
  `;
}

// ——————————————————————————————————————
// עזרים
// ——————————————————————————————————————
export function breadcrumb(parts) {
  return `
    <nav class="breadcrumbs container" aria-label="מיקום באתר">
      <a href="#/">דף הבית</a>
      ${parts.map(([label, href]) => `<span aria-hidden="true">›</span>${href ? `<a href="${href}">${escapeHtml(label)}</a>` : `<span aria-current="page">${escapeHtml(label)}</span>`}`).join('')}
    </nav>`;
}

export function renderNotFound() {
  return `
    <main class="page" id="page-content">
      <section class="page-hero">
        <span class="page-hero-icon" aria-hidden="true">🔍</span>
        <h1>הדף לא נמצא</h1>
        <p>ייתכן שהקישור שגוי, או שהמוצר כבר לא במאגר.</p>
        <a href="#/" class="btn btn-primary">חזרה לדף הבית</a>
      </section>
    </main>
  `;
}
