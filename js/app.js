// ============================================================
// Smart Food — אפליקציה ראשית + ניתוב
// ============================================================

import { products } from './data.js?v=14';
import { debounce, fillContactLinks } from './utils.js?v=14';
import { getNova, getScore } from './nova.js?v=14';
import {
  renderHeader, renderFooter, renderHome, renderCategory, renderProduct,
  renderCategoriesPage, renderAbout, renderNotFound, renderSearchResults,
  renderProductCard, renderNova, renderAllProducts, renderCompare, renderIngredients, renderIngredient,
} from './components.js?v=14';
import {
  renderTools, renderLabel, initLabel, renderVs, initVs, renderQuiz, initQuiz,
  renderBasket, initBasket, renderInsights, renderTeam, toggleBasket, inBasket, basketCount, onBasket, facts,
} from './widgets.js?v=14';

// פענוח בטוח של הכתובת: כתובת פגומה לא תפיל את האתר
function safeDecode(str) {
  try { return decodeURIComponent(str); } catch (e) { return ''; }
}

const TITLES = {
  home: 'Smart Food | מה באמת יש בתווית',
  categories: 'קטגוריות | Smart Food',
  compare: 'מעובד מול פשוט | Smart Food',
  nova: 'מה זה מדד NOVA | Smart Food',
  ingredients: 'מילון רכיבים | Smart Food',
  about: 'אודות | Smart Food',
  tools: 'כלים | Smart Food',
  products: 'כל המוצרים | Smart Food',
  label: 'בודק התווית | Smart Food',
  vs: 'השוואה חופשית | Smart Food',
  quiz: 'חידון NOVA | Smart Food',
  basket: 'הסל שלי | Smart Food',
  insights: 'תובנות מהמאגר | Smart Food',
  team: 'הצוות | Smart Food',
};

class SmartFoodApp {
  constructor() {
    this.root = document.getElementById('app');
    this.page = '';
    this.root.innerHTML = renderHeader() + '<div id="page-wrapper" tabindex="-1"></div>' + renderFooter();
    window.addEventListener('hashchange', () => this.route());
    this.initTheme();
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
    else if (hash === '#/team') { html = renderTeam(); this.page = 'team'; }
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
      if (p) title = `${p.name} | Smart Food`;
    }
    else if (hash.startsWith('#/ingredient/')) {
      const key = hash.slice(13);
      html = renderIngredient(key); this.page = 'ingredient';
      title = `${key} | מילון רכיבים`;
    }
    else { html = renderNotFound(); this.page = '404'; }

    wrapper.innerHTML = html;
    document.title = title || TITLES[this.page] || 'Smart Food';
    window.scrollTo({ top: 0 });
    this.updateActiveNav();
    this.initSearch();
    if (this.page === 'category') this.initCategoryFilters();
    if (this.page === 'ingredients') this.initIngredientFilters();
    if (this.page === 'products') this.initAllProducts();
    if (this.page === 'label') initLabel();
    if (this.page === 'vs') initVs();
    if (this.page === 'quiz') initQuiz();
    if (this.page === 'basket') initBasket(() => { const y = window.scrollY; this.route(); window.scrollTo(0, y); });
    if (this.page === 'product') this.initProductActions();
    if (this.page === 'home') this.initFacts();
    this.animateElements();
    fillContactLinks();
  }

  updateActiveNav() {
    const map = { products: 'categories', category: 'categories', ingredient: 'ingredients', label: 'tools', vs: 'tools', quiz: 'tools', basket: 'tools', insights: 'tools' };
    const current = map[this.page] || this.page;
    document.querySelectorAll('.nav-link').forEach(link => {
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
    document.getElementById('basket-btn')?.setAttribute('aria-label', `הסל שלי, ${n} מוצרים`);
  }

  initProductActions() {
    const btn = document.getElementById('basket-toggle');
    if (btn) {
      const paint = () => {
        const on = inBasket(btn.dataset.id);
        btn.textContent = on ? '✓ בסל שלי' : '🛒 הוספה לסל';
        btn.setAttribute('aria-pressed', String(on));
        btn.classList.toggle('btn-primary', !on);
        btn.classList.toggle('btn-ghost', on);
      };
      paint();
      btn.addEventListener('click', () => { toggleBasket(btn.dataset.id); paint(); });
    }
    const copy = document.getElementById('copy-link');
    copy?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(location.href); copy.textContent = '✓ הקישור הועתק'; }
      catch (e) { copy.textContent = 'לא הצלחנו להעתיק'; }
      setTimeout(() => { copy.textContent = '🔗 העתקת קישור'; }, 2000);
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
    const run = debounce(q => {
      box.innerHTML = renderSearchResults(q);
      box.classList.toggle('visible', box.innerHTML.trim().length > 0);
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
      count.textContent = `${out.length} מוצרים`;
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
      const q = input.value.trim().toLowerCase();
      let shown = 0;
      cards.forEach(c => {
        const ok = (role === 'all' || c.dataset.role === role) && (!q || c.dataset.search.includes(q));
        c.hidden = !ok; if (ok) shown++;
      });
      count.textContent = `${shown} רכיבים`;
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
    }), { threshold: 0.05 });
    items.forEach(el => obs.observe(el));
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
    const system = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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

document.addEventListener('DOMContentLoaded', () => new SmartFoodApp());
