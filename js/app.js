// ============================================================
// Tavitly — אפליקציה ראשית + ניתוב
// ============================================================

import { products } from './data.js?v=48';
import { debounce, fillContactLinks, escapeHtml } from './utils.js?v=48';
import { searchCatalog, catalogMeta } from './catalog.js?v=48';
import { getNova, getScore, lookupIngredient, getAlternatives } from './nova.js?v=48';
import { redFlags } from './verdict.js?v=48';
import { shareCard, SITE_URL } from './share.js?v=48';
import { registerServiceWorker, initInstallPrompt } from './pwa.js?v=48';
import { tr, EN, setLang } from './i18n.js?v=48';
import { loadEnglish } from './i18n-data.js?v=48';
import { renderPrefs, initPrefs } from './personal.js?v=48';
import {
  renderHeader, renderFooter, renderHome, renderCategory, renderProduct,
  renderCategoriesPage, renderAbout, renderNotFound, renderSearchResults,
  renderProductCard, renderNova, renderAllProducts, renderCompare, renderIngredients, renderIngredient, renderLegal, breadcrumb,
} from './components.js?v=48';
import {
  renderTools, renderLabel, initLabel, renderVs, initVs, renderQuiz, initQuiz,
  renderBasket, initBasket, renderInsights, renderTeam, renderCalcPage, initCalculators, toggleBasket, inBasket, basketCount, onBasket, facts,
} from './widgets.js?v=48';
import { renderScan, initScan, stopScan, renderBarcode, initBarcode } from './scan.js?v=48';

// פענוח בטוח של הכתובת: כתובת פגומה לא תפיל את האתר
function safeDecode(str) {
  try { return decodeURIComponent(str); } catch (e) { return ''; }
}

const TITLES = {
  legal: tr('תנאי שימוש, פרטיות ונגישות', 'Terms, privacy & accessibility') + ' | Tavitly',
  calculators: tr('מחשבונים', 'Calculators') + ' | Tavitly',
  home: 'Tavitly | ' + tr('מה באמת יש בתווית', "What's really on the label"),
  categories: tr('קטגוריות', 'Categories') + ' | Tavitly',
  compare: tr('מעובד מול פשוט', 'Processed vs. simple') + ' | Tavitly',
  nova: tr('מה זה מדד NOVA', 'What is the NOVA scale') + ' | Tavitly',
  ingredients: tr('מילון רכיבים', 'Ingredient dictionary') + ' | Tavitly',
  about: tr('אודות', 'About') + ' | Tavitly',
  tools: tr('כלים', 'Tools') + ' | Tavitly',
  products: tr('כל המוצרים', 'All products') + ' | Tavitly',
  label: tr('בודק התווית', 'Label checker') + ' | Tavitly',
  vs: tr('השוואה חופשית', 'Free comparison') + ' | Tavitly',
  quiz: tr('חידון NOVA', 'NOVA quiz') + ' | Tavitly',
  basket: tr('הסל שלי', 'My basket') + ' | Tavitly',
  insights: tr('תובנות מהמאגר', 'Database insights') + ' | Tavitly',
  team: tr('הצוות', 'The team') + ' | Tavitly',
  scan: tr('סריקת ברקוד', 'Barcode scan') + ' | Tavitly',
  prefs: tr('ההעדפות שלי', 'My preferences') + ' | Tavitly',
  barcode: tr('תוצאת סריקה', 'Scan result') + ' | Tavitly',
};

class SmartFoodApp {
  constructor() {
    this.root = document.getElementById('app');
    this.page = '';
    this.root.innerHTML = renderHeader() + '<div id="page-wrapper" tabindex="-1"></div>' + renderFooter();
    window.addEventListener('hashchange', () => this.route());
    // קישור "דלג לתוכן": מעביר את הפוקוס לתוכן בלי לשנות את הכתובת (שינוי כתובת היה מוביל ל"הדף לא נמצא")
    document.addEventListener('click', e => {
      const skip = e.target.closest('.skip-link');
      if (!skip) return;
      e.preventDefault();
      const target = document.getElementById('page-content') || document.getElementById('page-wrapper');
      if (target) { if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1'); target.focus(); }
    });
    this.initTheme();
    document.getElementById('lang-toggle')?.addEventListener('click', () => setLang(EN ? 'he' : 'en'));
    this.initMobileMenu();
    onBasket(() => this.updateBasketCount());
    this.updateBasketCount();
    document.addEventListener('click', e => {
      if (!e.target.closest('.hero-search')) document.getElementById('search-results')?.classList.remove('visible');
    });
    this.route();
  }

  route() {
    const hash = safeDecode(window.location.hash || '#/') || '#/404';
    const wrapper = document.getElementById('page-wrapper');
    let html, title;
    stopScan();

    if (hash === '#/' || hash === '#') { html = renderHome(); this.page = 'home'; }
    else if (hash === '#/categories') { html = renderCategoriesPage(); this.page = 'categories'; }
    else if (hash === '#/compare') { html = renderCompare(); this.page = 'compare'; }
    else if (hash === '#/nova') { html = renderNova(); this.page = 'nova'; }
    else if (hash === '#/ingredients') { html = renderIngredients(); this.page = 'ingredients'; }
    else if (hash === '#/about') { html = renderAbout(); this.page = 'about'; }
    else if (hash === '#/products') { html = renderAllProducts(); this.page = 'products'; }
    else if (hash === '#/tools') { html = renderTools(); this.page = 'tools'; }
    else if (hash === '#/label') { html = renderLabel(); this.page = 'label'; }
    else if (hash === '#/quiz') { html = renderQuiz(); this.page = 'quiz'; }
    else if (hash === '#/basket') { html = renderBasket(); this.page = 'basket'; }
    else if (hash === '#/insights') { html = renderInsights(); this.page = 'insights'; }
    else if (hash === '#/scan') { html = renderScan(); this.page = 'scan'; }
    else if (hash === '#/prefs') { html = renderPrefs(breadcrumb); this.page = 'prefs'; }
    else if (hash.startsWith('#/barcode/')) { html = renderBarcode(hash.slice(10)); this.page = 'barcode'; }
    else if (hash === '#/team') { html = renderTeam(); this.page = 'team'; }
    else if (hash === '#/legal') { html = renderLegal(); this.page = 'legal'; }
    else if (hash === '#/calculators') { html = renderCalcPage(); this.page = 'calculators'; }
    else if (hash === '#/random') {
      const p = products[Math.floor(Math.random() * products.length)];
      location.replace(`#/product/${p.id}`);
      return;
    }
    else if (hash === '#/vs' || hash.startsWith('#/vs/')) {
      const [, , a, b] = hash.split('/');
      html = renderVs(a && a !== '-' ? a : '', b && b !== '-' ? b : '');
      this.page = 'vs';
    }
    else if (hash.startsWith('#/category/')) { html = renderCategory(hash.slice(11)); this.page = 'category'; }
    else if (hash.startsWith('#/product/')) {
      const p = products.find(x => x.id === hash.slice(10));
      html = renderProduct(hash.slice(10)); this.page = 'product';
      if (p) title = `${p.name} | Tavitly`;
    }
    else if (hash.startsWith('#/ingredient/')) {
      const key = hash.slice(13);
      html = renderIngredient(key); this.page = 'ingredient';
      const h1 = html.match(/<h1>([^<]*)/);
      title = `${h1 ? h1[1].trim() : key} | ${tr('מילון רכיבים', 'Ingredient dictionary')}`;
    }
    else { html = renderNotFound(); this.page = '404'; }

    wrapper.innerHTML = html;
    document.title = title || TITLES[this.page] || 'Tavitly';
    window.scrollTo({ top: 0 });
    this.updateActiveNav();
    this.initSearch();
    if (this.page === 'category') this.initCategoryFilters();
    if (this.page === 'ingredients') this.initIngredientFilters();
    if (this.page === 'products') this.initAllProducts();
    if (this.page === 'label') initLabel();
    if (this.page === 'calculators') initCalculators();
    const cc = document.getElementById('catalog-count');
    if (cc) catalogMeta().then(m => { if (m && cc.isConnected) cc.textContent = ` · ${(m.products + products.length).toLocaleString(tr('he-IL', 'en-US'))} ${tr('מוצרים מזוהים בסריקה', 'products recognized by scan')}`; });
    if (this.page === 'scan') initScan();
    if (this.page === 'prefs') initPrefs();
    if (this.page === 'barcode') initBarcode(hash.slice(10), () => this.animateElements());
    if (this.page === 'vs') initVs();
    if (this.page === 'quiz') initQuiz();
    if (this.page === 'basket') initBasket(() => { const y = window.scrollY; this.route(); window.scrollTo(0, y); });
    if (this.page === 'product') this.initProductActions();
    if (this.page === 'home') this.initFacts();
    this.animateElements();
    fillContactLinks();
  }

  updateActiveNav() {
    const map = { barcode: 'scan', products: 'categories', category: 'categories', ingredient: 'ingredients', label: 'tools', calculators: 'tools', vs: 'tools', quiz: 'tools', basket: 'tools', insights: 'tools' };
    const current = map[this.page] || this.page;
    document.querySelectorAll('.nav-link, .tab-link').forEach(link => {
      if (link.classList.contains('tab-link')) { const t = link.dataset.page; const on = t === this.page || (t === 'products' && ['categories', 'category', 'product'].includes(this.page)) || (t === 'scan' && this.page === 'barcode') || (t === 'tools' && current === 'tools') || (t === 'ingredients' && current === 'ingredients'); link.classList.toggle('active', on); if (on) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); return; }
      const active = link.dataset.page === current;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
  }

  updateBasketCount() {
    const el = document.getElementById('basket-count');
    if (!el) return;
    const n = basketCount();
    el.textContent = n;
    el.hidden = n === 0;
    document.getElementById('basket-btn')?.setAttribute('aria-label', tr(`הסל שלי, ${n} מוצרים`, `My basket, ${n} ${n === 1 ? 'product' : 'products'}`));
  }

  initProductActions() {
    const btn = document.getElementById('basket-toggle');
    if (btn) {
      const paint = () => {
        const on = inBasket(btn.dataset.id);
        btn.textContent = on ? tr('✓ בסל שלי', '✓ In my basket') : tr('🛒 הוספה לסל', '🛒 Add to basket');
        btn.setAttribute('aria-pressed', String(on));
        btn.classList.toggle('btn-primary', !on);
        btn.classList.toggle('btn-ghost', on);
      };
      paint();
      btn.addEventListener('click', () => { toggleBasket(btn.dataset.id); paint(); });
    }
    const share = document.getElementById('share-card');
    share?.addEventListener('click', async () => {
      const p = products.find(x => x.id === share.dataset.id);
      if (!p) return;
      const nova = getNova(p);
      const items = p.ingredients.map(i => ({ name: i, ...lookupIngredient(i) }));
      const alt = getAlternatives(p)[0];
      share.disabled = true; share.textContent = tr('מכינים את התמונה…', 'Preparing the image…');
      try {
        await shareCard({ name: p.name, brand: p.brand, nova: { group: nova.group, ...nova }, score: getScore(p),
          flags: redFlags(items, nova), alt: alt && alt.name, url: `${SITE_URL}#/product/${p.id}` });
      } finally { share.disabled = false; share.textContent = tr('📤 שיתוף בוואטסאפ', '📤 Share on WhatsApp'); }
    });
    const copy = document.getElementById('copy-link');
    copy?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(location.href); copy.textContent = tr('✓ הקישור הועתק', '✓ Link copied'); }
      catch (e) { copy.textContent = tr('לא הצלחנו להעתיק', "Couldn't copy"); }
      setTimeout(() => { copy.textContent = tr('🔗 העתקת קישור', '🔗 Copy link'); }, 2000);
    });
  }

  initFacts() {
    const list = facts();
    let i = 0;
    const text = document.getElementById('fact-text');
    document.getElementById('fact-next')?.addEventListener('click', () => {
      i = (i + 1) % list.length;
      text.textContent = list[i];
    });
  }

  initSearch() {
    const input = document.getElementById('global-search');
    const box = document.getElementById('search-results');
    if (!input || !box) return;
    let seq = 0;
    const run = debounce(async q => {
      const my = ++seq;
      box.innerHTML = renderSearchResults(q);
      box.classList.toggle('visible', box.innerHTML.trim().length > 0);
      if (q.trim().length < 2 || /^\d{8,14}$/.test(q.trim())) return;
      const more = await searchCatalog(q, 6);
      if (my !== seq || !more.length) return;
      if (box.querySelector('.search-empty')) box.innerHTML = '';
      box.insertAdjacentHTML('beforeend', `<div class="search-group">${tr('מהמאגר המורחב · ניתוח אוטומטי', 'Extended database · automatic analysis')}</div>${more.map(m => `
        <a href="#/barcode/${encodeURIComponent(m.c)}" class="search-result-item" role="option">
          <span class="search-ing-icon" aria-hidden="true">${m.hasIng ? '🔎' : '📷'}</span>
          <span class="search-result-info"><span class="search-result-name">${escapeHtml(m.n)}</span><span class="search-result-brand">${escapeHtml([m.b, m.hasIng ? tr('יש רשימת רכיבים', 'Ingredient list available') : tr('אפשר לצלם את התווית', 'You can photograph the label')].filter(Boolean).join(' · '))}</span></span>
        </a>`).join('')}`);
      box.classList.add('visible');
    }, 150);
    input.addEventListener('input', e => run(e.target.value));
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { const first = box.querySelector('a'); if (first) location.hash = first.getAttribute('href'); }
      if (e.key === 'Escape') box.classList.remove('visible');
    });
  }

  initCategoryFilters() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    const id = safeDecode(location.hash).replace('#/category/', '');
    const list = products.filter(p => p.category === id);
    let filter = 'all';
    const sortSel = document.getElementById('sort-select');
    const apply = () => {
      let out = list.filter(p => filter === 'all' || getNova(p).group === Number(filter.slice(4)));
      const s = sortSel.value;
      if (s === 'name') out.sort((a, b) => a.name.localeCompare(b.name, 'he'));
      else if (s === 'nova-desc') out.sort((a, b) => getNova(b).group - getNova(a).group || getScore(b) - getScore(a));
      else out.sort((a, b) => getNova(a).group - getNova(b).group || getScore(a) - getScore(b));
      grid.innerHTML = out.map(renderProductCard).join('');
      this.animateElements();
    };
    document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
      filter = btn.dataset.filter; apply();
    }));
    sortSel.addEventListener('change', apply);
  }

  initAllProducts() {
    const grid = document.getElementById('all-grid');
    if (!grid) return;
    const q = document.getElementById('all-search');
    const cat = document.getElementById('all-cat');
    const sort = document.getElementById('all-sort');
    const count = document.getElementById('all-count');
    const empty = document.getElementById('all-empty');
    let nova = 'all';
    const apply = () => {
      const term = q.value.trim().toLowerCase();
      let out = products.filter(p =>
        (!cat.value || p.category === cat.value) &&
        (nova === 'all' || getNova(p).group === Number(nova)) &&
        (!term || p.name.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term)));
      const s = sort.value;
      if (s === 'name') out.sort((a, b) => a.name.localeCompare(b.name, 'he'));
      else if (s === 'nova-desc') out.sort((a, b) => getNova(b).group - getNova(a).group || getScore(b) - getScore(a));
      else if (s === 'ings') out.sort((a, b) => a.ingredients.length - b.ingredients.length || a.name.localeCompare(b.name, 'he'));
      else out.sort((a, b) => getNova(a).group - getNova(b).group || getScore(a) - getScore(b));
      grid.innerHTML = out.map(renderProductCard).join('');
      count.textContent = tr(`${out.length} מוצרים`, `${out.length} ${out.length === 1 ? 'product' : 'products'}`);
      empty.hidden = out.length > 0;
      this.animateElements();
    };
    q.addEventListener('input', debounce(apply, 150));
    cat.addEventListener('change', apply);
    sort.addEventListener('change', apply);
    document.querySelectorAll('[data-nova]').forEach(btn => btn.addEventListener('click', () => {
      document.querySelectorAll('[data-nova]').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
      nova = btn.dataset.nova; apply();
    }));
  }

  initIngredientFilters() {
    const input = document.getElementById('ing-search');
    const cards = [...document.querySelectorAll('.ing-card')];
    const count = document.getElementById('ing-count');
    let role = 'all';
    const apply = () => {
      const q = input.value.trim().toLowerCase().replace(/^e[\s-]+(?=\d)/, 'e');
      let shown = 0;
      cards.forEach(c => {
        const ok = (role === 'all' || c.dataset.role === role) && (!q || c.dataset.search.includes(q));
        c.hidden = !ok; if (ok) shown++;
      });
      count.textContent = tr(`${shown} רכיבים`, `${shown} ${shown === 1 ? 'ingredient' : 'ingredients'}`);
    };
    input.addEventListener('input', apply);
    document.querySelectorAll('[data-role]').forEach(btn => {
      if (btn.tagName !== 'BUTTON') return;
      btn.addEventListener('click', () => {
        document.querySelectorAll('button[data-role]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); role = btn.dataset.role; apply();
      });
    });
  }

  animateElements() {
    const items = document.querySelectorAll('.animate-item:not(.visible)');
    if (!('IntersectionObserver' in window)) { items.forEach(el => el.classList.add('visible')); return; }
    const obs = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('visible'); obs.unobserve(en.target); }
    }), { threshold: 0.01, rootMargin: '0px 0px 160px 0px' });
    items.forEach(el => obs.observe(el));
    // רשת ביטחון: אם הדפדפן לא מדווח על גלילה (למשל בלשונית ברקע), התוכן לא יישאר מוסתר
    setTimeout(() => items.forEach(el => { if (el.isConnected) el.classList.add('visible'); }), 2500);
  }

  initTheme() {
    const toggle = document.getElementById('theme-toggle');
    const meta = document.querySelector('meta[name="color-scheme"]');
    let saved = null;
    try { saved = localStorage.getItem('smart-food-theme'); } catch (e) {}
    const set = t => {
      document.documentElement.setAttribute('data-theme', t);
      if (meta) meta.content = t;
    };
    const system = 'dark';
    set(saved === 'dark' || saved === 'light' ? saved : system);
    toggle?.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      set(next);
      try { localStorage.setItem('smart-food-theme', next); } catch (e) {}
    });
  }

  initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const nav = document.getElementById('main-nav');
    if (!btn || !nav) return;
    const close = () => { nav.classList.remove('open'); btn.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', e => { if (e.target.closest('.nav-link')) close(); });
    window.addEventListener('hashchange', close);
  }
}

registerServiceWorker();
document.addEventListener('DOMContentLoaded', async () => { await loadEnglish(); new SmartFoodApp(); initInstallPrompt(); });
