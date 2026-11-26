// ============================================================
// Tavitly — Service Worker
// שומר את האתר במכשיר, כדי שייפתח מיד גם בקליטה חלשה בסופר.
// גרסה חדשה: לעדכן את VERSION יחד עם ?v= בקבצים.
// בקשות למאגר Open Food Facts לא נשמרות. מנוע קריאת התוויות נשמר רק אחרי שימוש ראשון.
// ============================================================

const VERSION = '45';
const CACHE = 'smartfood-v' + VERSION;
const v = f => f + '?v=' + VERSION;
const CORE = [
  './', 'index.html', 'manifest.webmanifest', 'js/boot.js?v=' + VERSION, v('css/styles.css'),
  'fonts/rubik-hebrew-wght-normal.woff2', 'fonts/rubik-latin-wght-normal.woff2',
  'img/icon.png', 'img/icon-192.png', 'img/icon-512.png',
  v('js/app.js'),
  v('js/art.js'),
  v('js/barcodes.js'),
  v('js/calculators.js'),
  v('js/catalog.js'),
  v('js/colors.js'),
  v('js/components.js'),
  v('js/data.js'),
  v('js/glossary.js'),
  v('js/i18n.js'),
  v('js/i18n-data.js'),
  v('js/ingredients-more.js'),
  v('js/ingredients.js'),
  v('js/nova.js'),
  v('js/ocr.js'),
  v('js/personal.js'),
  v('js/photos.js'),
  v('js/products-extra.js'),
  v('js/products-more.js'),
  v('js/products.js'),
  v('js/pwa.js'),
  v('js/scan.js'),
  v('js/share.js'),
  v('js/utils.js'),
  v('js/verdict.js'),
  v('js/widgets.js'),
  'img/art/LICENSE',
  'img/art/avocado.webp',
  'img/art/banana.webp',
  'img/art/beans.webp',
  'img/art/bowl_with_spoon.webp',
  'img/art/bread.webp',
  'img/art/broccoli.webp',
  'img/art/bubbles.webp',
  'img/art/burrito.webp',
  'img/art/butter.webp',
  'img/art/candy.webp',
  'img/art/carrot.webp',
  'img/art/cheese_wedge.webp',
  'img/art/chestnut.webp',
  'img/art/chicken.webp',
  'img/art/chocolate_bar.webp',
  'img/art/cloud.webp',
  'img/art/cooked_rice.webp',
  'img/art/cookie.webp',
  'img/art/cow.webp',
  'img/art/cucumber.webp',
  'img/art/cup_with_straw.webp',
  'img/art/custard.webp',
  'img/art/cut_of_meat.webp',
  'img/art/droplet.webp',
  'img/art/dumpling.webp',
  'img/art/ear_of_corn.webp',
  'img/art/egg.webp',
  'img/art/eggplant.webp',
  'img/art/fire.webp',
  'img/art/fish.webp',
  'img/art/flatbread.webp',
  'img/art/flexed_biceps.webp',
  'img/art/french_fries.webp',
  'img/art/glass_of_milk.webp',
  'img/art/grapes.webp',
  'img/art/hamburger.webp',
  'img/art/herb.webp',
  'img/art/high_voltage.webp',
  'img/art/honey_pot.webp',
  'img/art/honeybee.webp',
  'img/art/hot_beverage.webp',
  'img/art/hot_dog.webp',
  'img/art/hot_pepper.webp',
  'img/art/ice.webp',
  'img/art/ice_cream.webp',
  'img/art/lemon.webp',
  'img/art/olive.webp',
  'img/art/onion.webp',
  'img/art/palm_tree.webp',
  'img/art/pea_pod.webp',
  'img/art/peanuts.webp',
  'img/art/pizza.webp',
  'img/art/popcorn.webp',
  'img/art/pot_of_food.webp',
  'img/art/potato.webp',
  'img/art/poultry_leg.webp',
  'img/art/pouring_liquid.webp',
  'img/art/pretzel.webp',
  'img/art/red_apple.webp',
  'img/art/rice_cracker.webp',
  'img/art/salt.webp',
  'img/art/sandwich.webp',
  'img/art/seedling.webp',
  'img/art/shallow_pan_of_food.webp',
  'img/art/sheaf_of_rice.webp',
  'img/art/snowflake.webp',
  'img/art/spaghetti.webp',
  'img/art/sparkles.webp',
  'img/art/steaming_bowl.webp',
  'img/art/strawberry.webp',
  'img/art/tangerine.webp',
  'img/art/teacup_without_handle.webp',
  'img/art/teddy_bear.webp',
  'img/art/tomato.webp',
  'img/art/turkey.webp',
  'img/art/waffle.webp',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('smartfood-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // מאגרים חיצוניים: תמיד מהרשת
  if (req.mode === 'navigate') {
    // הדף הראשי: קודם מהרשת (כדי לקבל עדכונים), ובלי קליטה מהמטמון
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); return res;
    }).catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
