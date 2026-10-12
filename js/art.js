// ============================================================
// Smart Food — איור מוצר
// כל מוצר מצויר בצורת האריזה שלו (שקית, בקבוק, גביע, קרטון וכו'),
// עם שם המוצר על התווית ואיור של מה שבתוכו.
// האיורים כלליים ולא מעתיקים לוגו או עיצוב של יצרן.
// ============================================================

import { escapeHtml } from './utils.js?v=13';

// סוג האריזה לכל מוצר
const PACK = {
  bamba: 'bag', bamba_nougat: 'bag', bisli_grill: 'bag', bisli_pizza: 'bag', bisli_onion: 'bag',
  tapuchips: 'bag', doritos: 'bag', beigeleh: 'bag', apropo: 'bag', cheetos: 'bag', rice_cakes: 'sleeve',
  mekupelet: 'bar', pesek_zman: 'bar', kif_kef: 'bar', chocolate_cow: 'bar', taami: 'bar', splendid_dark: 'bar',
  baflot: 'bar', halva: 'box', gummy: 'bag', cake_marble: 'loaf', krembo: 'box', petit_beurre: 'sleeve',
  cottage5: 'tub', yogurt_bio: 'cup', yogurt_greek: 'cup', milki: 'cup', maadan_golan: 'cup', eshel: 'cup',
  white_cheese: 'tub', emek: 'block', daniela: 'cup', activia: 'cup', milk3: 'carton', butter: 'block',
  bulgarian: 'tub', danone_pro: 'cup',
  cola: 'bottle', cola_zero: 'bottle', orange_juice: 'bottle', water_mineral: 'bottle', tirosh: 'bottle',
  ice_coffee: 'carton', shoko_yotvata: 'carton', shoko_tnuva: 'carton', sprite: 'bottle', neviot_grape: 'bottle',
  red_bull: 'can',
  pita: 'loaf', bread_achid: 'loaf', bread_berman: 'loaf', challah: 'loaf', tortilla: 'pouch',
  tuna: 'tin', corn_canned: 'tin', tomato_paste: 'tin', sardines: 'tin',
  pasta_whole: 'box', spaghetti: 'pouch', couscous: 'box', rice_basmati: 'pouch', ptitim: 'box', lentils: 'pouch',
  oil_canola: 'bottle', oil_olive: 'bottle',
  cornflakes: 'box', kariot: 'box', quaker: 'box',
  hummus: 'tub', ketchup: 'squeeze', tahini: 'jar', jam: 'jar', mayo: 'squeeze', nutella: 'jar',
  peanut_butter: 'jar', honey: 'jar',
  chicken_breast: 'tray', pastrami: 'tray', hot_dogs: 'tray', salami: 'tray',
  peas: 'pouch', corn_schnitzel: 'box', schnitzelonim: 'pouch', pizza: 'box', fries: 'pouch',
  bourekas: 'pouch', malawach: 'pouch',
  noodles: 'cupnoodle', chicken_soup: 'jar', mashed: 'box',
  popcorn: 'bag', pretzel_sticks: 'bag', kinder_bueno: 'bar', choc_chip_cookies: 'box', marshmallow: 'bag', egozit: 'sleeve',
  hashachar: 'jar', silan: 'squeeze', matbucha: 'tub', eggplant_mayo: 'tub', cream_cheese: 'tub', cottage9: 'tub', noam: 'block',
  danone_pro_vanilla: 'cup', whipping_cream: 'carton', soy_drink: 'carton', almond_drink: 'carton', soda: 'bottle', black_tea: 'box',
  instant_coffee: 'jar', flour: 'pouch', sugar: 'pouch', salt: 'pouch', white_beans: 'tin', olives: 'jar', pickles: 'jar', tuna_water: 'tin',
  pasta_sauce: 'jar', shkedei_marak: 'box', burger_buns: 'loaf', rye_bread: 'loaf', matzot: 'box', ice_cream: 'tub', jachnun: 'pouch',
  mixed_veg: 'pouch', peas_carrots: 'pouch', cup_pasta: 'cupnoodle', onion_soup: 'pouch', cornflakes_whole: 'box', ground_beef: 'tray', salmon: 'tray',
};


// שם קצר לתווית (השם המלא מופיע מתחת לאיור)
const SHORT = {
  bamba: 'במבה', bamba_nougat: 'במבה נוגט', bisli_grill: 'ביסלי גריל', bisli_pizza: 'ביסלי פיצה', bisli_onion: 'ביסלי בצל',
  tapuchips: "תפוצ'יפס", doritos: 'דוריטוס', beigeleh: 'בייגלה', apropo: 'אפרופו', cheetos: "צ'יטוס גבינה", rice_cakes: 'פריכיות אורז',
  mekupelet: 'מקופלת', pesek_zman: 'פסק זמן', kif_kef: 'כיף כף', chocolate_cow: 'שוקולד חלב', taami: 'טעמי', splendid_dark: 'מריר 70%',
  baflot: 'בפלות לימון', halva: 'חלבה', gummy: 'דובונים', cake_marble: 'עוגת שיש', krembo: 'קרמבו', petit_beurre: 'פתיבר',
  cottage5: "קוטג' 5%", yogurt_bio: 'יוגורט Bio', yogurt_greek: 'יוגורט יווני', milki: 'מילקי', maadan_golan: 'מעדן הגולן', eshel: 'אשל',
  white_cheese: 'גבינה לבנה', emek: 'עמק', daniela: 'דניאלה', activia: 'אקטיביה', milk3: 'חלב 3%', butter: 'חמאה',
  bulgarian: 'בולגרית', danone_pro: 'PRO', cola: 'קוקה-קולה', cola_zero: 'קולה זירו', orange_juice: 'מיץ תפוזים',
  water_mineral: 'מים', tirosh: 'מיץ ענבים', ice_coffee: 'אייס קפה', shoko_yotvata: 'שוקו', shoko_tnuva: 'שוקו', sprite: 'ספרייט',
  neviot_grape: 'מים בטעם ענבים', red_bull: 'רד בול', pita: 'פיתה', bread_achid: 'לחם אחיד', bread_berman: 'לחם מלא', challah: 'חלה',
  tortilla: 'טורטייה', tuna: 'טונה', corn_canned: 'תירס', tomato_paste: 'רסק', sardines: 'סרדינים', pasta_whole: 'פנה מלאה',
  spaghetti: 'ספגטי', couscous: 'קוסקוס', rice_basmati: 'אורז בסמטי', ptitim: 'פתיתים', lentils: 'עדשים', oil_canola: 'קנולה',
  oil_olive: 'שמן זית', cornflakes: 'קורנפלקס', kariot: 'כריות', quaker: 'שיבולת שועל', hummus: 'חומוס', ketchup: 'קטשופ',
  tahini: 'טחינה', jam: 'ריבת תות', mayo: 'מיונז', nutella: 'נוטלה', peanut_butter: 'חמאת בוטנים', honey: 'דבש',
  chicken_breast: 'חזה עוף', pastrami: 'פסטרמה', hot_dogs: 'נקניקיות', salami: 'סלמי', peas: 'אפונה', corn_schnitzel: 'שניצל תירס',
  schnitzelonim: 'שניצלונים', pizza: 'פיצה', fries: "צ'יפס", bourekas: 'בורקס', malawach: 'מלווח', noodles: 'נודלס',
  chicken_soup: 'מרק עוף', mashed: 'פירה',
  popcorn: 'פופקורן', pretzel_sticks: 'בייגלה מקלות', kinder_bueno: 'קינדר בואנו', choc_chip_cookies: "שוקולד צ'יפס", marshmallow: 'מרשמלו',
  egozit: 'אגוזית', hashachar: 'ממרח שוקולד', silan: 'סילאן', matbucha: 'מטבוחה', eggplant_mayo: 'חציל במיונז', cream_cheese: 'גבינת שמנת',
  cottage9: "קוטג' 9%", noam: 'נעם', danone_pro_vanilla: 'PRO וניל', whipping_cream: 'שמנת להקצפה', soy_drink: 'משקה סויה',
  almond_drink: 'משקה שקדים', soda: 'סודה', black_tea: 'תה שחור', instant_coffee: 'קפה נמס', flour: 'קמח', sugar: 'סוכר', salt: 'מלח',
  white_beans: 'שעועית לבנה', olives: 'זיתים', pickles: 'מלפפונים', tuna_water: 'טונה במים', pasta_sauce: 'רוטב עגבניות',
  shkedei_marak: 'שקדי מרק', burger_buns: 'לחמניות', rye_bread: 'לחם שיפון', matzot: 'מצות', ice_cream: 'גלידת וניל', jachnun: "ג'חנון",
  mixed_veg: 'ירקות מעורבים', peas_carrots: 'אפונה וגזר', cup_pasta: 'פסטה', onion_soup: 'מרק בצל', cornflakes_whole: 'קורנפלקס מלא',
  ground_beef: 'בשר טחון', salmon: 'סלמון',
};

// צבעים: גוון לפי קטגוריה, עם הסטה קטנה לכל מוצר
const CAT_HUE = { snacks: 38, sweets: 18, dairy: 205, drinks: 188, bread: 32, canned: 85, cereals: 46, spreads: 12, meat: 355, frozen: 198, instant: 26, fruits: 130 };
const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
export const hueOf = p => (CAT_HUE[p.category] ?? 120);
const packHue = p => (hueOf(p) + (hash(p.id) % 44) - 22 + 360) % 360;

let uid = 0;
const PACK_SCALE = {bag: 1.08, sleeve: 1.05, bar: 1.15, box: 1.08, loaf: 1.0, pouch: 1.08, bottle: 1.0, squeeze: 1.08, can: 1.15, tin: 1.25, cup: 1.2, cupnoodle: 1.15, tub: 1.25, jar: 1.2, carton: 1.1, block: 1.2, tray: 1.08};

// ——— צורות האריזה (שטח ציור 400×300, רצפה ב-y=272) ———
function zig(x1, x2, y, dir, n) {
  // קצה משונן של שקית
  const step = (x2 - x1) / n;
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = x1 + step * i;
    d += `L${(a + step / 2).toFixed(1)},${y + dir * 7} L${(a + step).toFixed(1)},${y} `;
  }
  return d;
}

const SHAPES = {
  bag: () => ({
    path: `M168,46 ${zig(168, 292, 46, -1, 9)} L292,62 C306,120 306,200 292,256 ${zig(292, 168, 256, 1, 9)} L168,256 C154,200 154,120 168,62 Z`,
    extra: `<rect x="168" y="56" width="124" height="8" fill="#000" opacity=".08"/><rect x="168" y="244" width="124" height="8" fill="#000" opacity=".08"/>`,
    label: [176, 112, 108, 92], front: [70, 150, 120],
  }),
  sleeve: () => ({
    path: `M178,40 ${zig(178, 282, 40, -1, 7)} L282,52 L282,260 ${zig(282, 178, 260, 1, 7)} L178,260 Z`,
    extra: `<rect x="178" y="48" width="104" height="6" fill="#000" opacity=".08"/>`,
    label: [184, 110, 92, 92], front: [80, 150, 118],
  }),
  bar: () => ({
    path: `M112,148 ${zig(112, 112, 148, 0, 1)} L118,140 L124,148 L130,140 L136,148 L338,148 L344,140 L350,148 L350,226 L344,234 L338,226 L136,226 L130,234 L124,226 L118,234 L112,226 Z`,
    extra: `<rect x="136" y="148" width="18" height="78" fill="#000" opacity=".08"/><rect x="320" y="148" width="18" height="78" fill="#000" opacity=".08"/>`,
    label: [168, 158, 140, 58], front: [52, 150, 112], rotate: -7, ground: 248,
  }),
  box: () => ({
    path: `M168,62 L292,62 L292,272 L168,272 Z`,
    extra: `<path d="M168,62 L188,40 L312,40 L292,62 Z" fill="var(--pk-light)"/><path d="M292,62 L312,40 L312,250 L292,272 Z" fill="var(--pk-dark)"/>`,
    label: [176, 118, 108, 96], front: [70, 152, 118],
  }),
  loaf: () => ({
    path: `M176,74 C176,58 186,52 196,52 L264,52 C274,52 284,58 284,74 L290,250 C290,264 280,272 266,272 L194,272 C180,272 170,264 170,250 Z`,
    extra: `<path d="M214,52 L206,24 L230,36 L254,24 L246,52 Z" fill="var(--pk-light)" opacity=".9"/><rect x="214" y="46" width="32" height="8" rx="3" fill="var(--pk-dark)"/>`,
    label: [182, 120, 96, 92], front: [70, 152, 118],
  }),
  pouch: () => ({
    path: `M176,44 L284,44 L286,236 C286,262 270,272 230,272 C190,272 174,262 174,236 Z`,
    extra: `<rect x="176" y="44" width="108" height="12" fill="#000" opacity=".1"/><line x1="180" y1="66" x2="280" y2="66" stroke="#fff" stroke-opacity=".5" stroke-dasharray="4 4" stroke-width="2"/>`,
    label: [184, 110, 92, 92], front: [74, 152, 118],
  }),
  bottle: () => ({
    path: `M216,52 L244,52 L244,78 C244,92 280,100 280,128 L280,256 C280,266 272,272 262,272 L198,272 C188,272 180,266 180,256 L180,128 C180,100 216,92 216,78 Z`,
    extra: `<rect x="212" y="24" width="36" height="30" rx="5" fill="var(--pk-dark)"/><rect x="212" y="46" width="36" height="5" fill="#000" opacity=".15"/>`,
    label: [184, 150, 92, 82], front: [80, 160, 110],
  }),
  squeeze: () => ({
    path: `M196,88 L264,88 C278,88 284,100 284,116 L276,256 C276,266 268,272 258,272 L202,272 C192,272 184,266 184,256 L176,116 C176,100 182,88 196,88 Z`,
    extra: `<rect x="208" y="58" width="44" height="32" rx="6" fill="var(--pk-dark)"/><rect x="222" y="42" width="16" height="18" rx="3" fill="var(--pk-dark)"/>`,
    label: [186, 140, 88, 92], front: [76, 158, 114],
  }),
  can: () => ({
    path: `M190,66 L270,66 L270,260 C270,268 252,274 230,274 C208,274 190,268 190,260 Z`,
    extra: `<ellipse cx="230" cy="66" rx="40" ry="10" fill="var(--pk-light)"/><ellipse cx="230" cy="66" rx="30" ry="6" fill="#000" opacity=".12"/><rect x="190" y="74" width="80" height="6" fill="#000" opacity=".08"/>`,
    label: [194, 120, 72, 100], front: [86, 158, 112],
  }),
  tin: () => ({
    path: `M160,170 L300,170 L300,260 C300,268 268,274 230,274 C192,274 160,268 160,260 Z`,
    extra: `<ellipse cx="230" cy="170" rx="70" ry="14" fill="var(--pk-light)"/><ellipse cx="230" cy="170" rx="58" ry="9" fill="#000" opacity=".1"/><rect x="160" y="182" width="140" height="5" fill="#000" opacity=".08"/>`,
    label: [168, 192, 124, 66], front: [60, 156, 116],
  }),
  cup: () => ({
    path: `M176,128 L284,128 L270,266 C270,270 262,274 230,274 C198,274 190,270 190,266 Z`,
    extra: `<ellipse cx="230" cy="128" rx="58" ry="12" fill="#f4f1ea"/><ellipse cx="230" cy="128" rx="48" ry="8" fill="var(--pk-light)" opacity=".7"/>`,
    label: [190, 158, 80, 84], front: [80, 160, 112],
  }),
  cupnoodle: () => ({
    path: `M170,110 L290,110 L276,266 C276,270 266,274 230,274 C194,274 184,270 184,266 Z`,
    extra: `<ellipse cx="230" cy="110" rx="62" ry="12" fill="#f4f1ea"/>`,
    label: [186, 142, 88, 96], front: [66, 156, 118],
  }),
  tub: () => ({
    path: `M150,184 L310,184 L298,264 C298,270 272,274 230,274 C188,274 162,270 162,264 Z`,
    extra: `<ellipse cx="230" cy="182" rx="84" ry="14" fill="var(--pk-dark)"/><ellipse cx="230" cy="177" rx="80" ry="12" fill="var(--pk-light)"/>`,
    label: [168, 198, 124, 62], front: [50, 150, 116],
  }),
  jar: () => ({
    path: `M184,116 L276,116 C286,116 290,124 290,134 L290,254 C290,266 282,272 270,272 L190,272 C178,272 170,266 170,254 L170,134 C170,124 174,116 184,116 Z`,
    extra: `<rect x="180" y="88" width="100" height="30" rx="6" fill="var(--pk-dark)"/><rect x="180" y="96" width="100" height="3" fill="#fff" opacity=".2"/><rect x="180" y="106" width="100" height="3" fill="#fff" opacity=".2"/>`,
    label: [178, 150, 104, 90], front: [64, 158, 116],
  }),
  carton: () => ({
    path: `M184,98 L276,98 L276,272 L184,272 Z`,
    extra: `<path d="M184,98 L230,62 L276,98 Z" fill="var(--pk-light)"/><rect x="222" y="48" width="16" height="18" rx="2" fill="var(--pk-dark)"/><path d="M276,98 L292,86 L292,262 L276,272 Z" fill="var(--pk-dark)"/>`,
    label: [190, 140, 80, 98], front: [80, 160, 112],
  }),
  block: () => ({
    path: `M148,190 L308,190 L308,272 L148,272 Z`,
    extra: `<path d="M148,190 L168,172 L328,172 L308,190 Z" fill="var(--pk-light)"/><path d="M308,190 L328,172 L328,254 L308,272 Z" fill="var(--pk-dark)"/>`,
    label: [160, 200, 136, 62], front: [46, 150, 118],
  }),
  tray: () => ({
    path: `M120,226 L340,226 L326,268 C326,272 320,274 312,274 L148,274 C140,274 134,272 134,268 Z`,
    extra: `<path d="M126,226 C150,150 310,150 334,226 Z" fill="#fff" opacity=".35"/>`,
    label: [240, 230, 92, 40], front: [168, 108, 124], frontOnTop: true,
  }),
};

// פיצול שם המוצר לשתי שורות לכל היותר
function labelLines(p) {
  const name = SHORT[p.id] || p.name;
  const words = name.split(' ');
  if (name.length <= 11 || words.length === 1) return [name];
  let best = [name], bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
    const diff = Math.max(a.length, b.length);
    if (diff < bestDiff) { bestDiff = diff; best = [a, b]; }
  }
  if (best.length === 2 && best[1].length > 16) best[1] = best[1].slice(0, 15) + '…';
  return best;
}

function labelSVG(p, [x, y, w, h], icon) {
  const lines = labelLines(p);
  const longest = Math.max(...lines.map(l => l.length));
  const small = h < 50;
  const iconS = small || !icon ? 0 : Math.min(30, h * 0.32);
  const brandFs = small ? 0 : 11;
  const room = h - 10 - iconS - (iconS ? 3 : 0) - (brandFs ? brandFs + 3 : 0);
  const fs = Math.max(9, Math.min(small ? 17 : 24, (w * 0.9) / (longest * 0.56), room / (lines.length * 1.08)));
  const blockH = iconS + (iconS ? 3 : 0) + (brandFs ? brandFs + 3 : 0) + lines.length * fs * 1.08;
  let cy = y + (h - blockH) / 2;
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${small ? 6 : 10}" fill="#fffdf7" opacity=".97"/>`;
  if (iconS) { out += `<image href="img/art/${icon}.webp" x="${x + w / 2 - iconS / 2}" y="${cy}" width="${iconS}" height="${iconS}"/>`; cy += iconS + 3; }
  if (brandFs && p.brand !== 'מוצר כללי') { out += `<text x="${x + w / 2}" y="${cy + brandFs * 0.85}" font-size="${brandFs}" fill="#6b7280" text-anchor="middle" direction="rtl" font-weight="500">${escapeHtml(p.brand)}</text>`; cy += brandFs + 3; }
  lines.forEach((l, i) => {
    out += `<text x="${x + w / 2}" y="${cy + fs * (0.86 + i * 1.08)}" font-size="${fs.toFixed(1)}" fill="#1f2a24" text-anchor="middle" direction="rtl" font-weight="800">${escapeHtml(l)}</text>`;
  });
  return out;
}

// ——— רינדור ———
export function productArt(p, cls = '') {
  const [main, sub] = p.art || [];
  const type = PACK[p.id];
  const h = hueOf(p);

  // מוצר טרי בלי אריזה, או תצוגה קטנה מאוד: רק האיור
  if (!type || (cls.includes('art-xs') && (main || sub))) {
    return `
      <div class="art art-fresh ${cls}" style="--h:${h}" aria-hidden="true">
        ${(main || sub) ? `<img class="art-main" src="img/art/${main || sub}.webp" alt="" loading="lazy" width="256" height="256">` : ''}
        ${main && sub && sub !== 'sparkles' ? `<span class="art-sub"><img src="img/art/${sub}.webp" alt="" loading="lazy" width="256" height="256"></span>` : ''}
      </div>`;
  }

  const s = SHAPES[type]();
  const ph = packHue(p);
  const id = `pk${++uid}`;
  const [fx, fy, fs] = s.front;
  const ground = s.ground || 272;
  const k = PACK_SCALE[type] || 1;
  const rot = ` transform="translate(${s.frontOnTop ? 0 : 14} 0) translate(230 ${ground}) scale(${k}) translate(-230 -${ground})${s.rotate ? ` rotate(${s.rotate} 230 188)` : ''}"`;
  // על התווית: איור הטעם/התוספת; מקדימה: איור התוכן
  const labelIcon = sub && sub !== 'sparkles' ? sub : null;
  return `
    <div class="art art-pack ${cls}" style="--h:${h}" aria-hidden="true">
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" style="--pk:hsl(${ph} 62% 50%);--pk-light:hsl(${ph} 70% 64%);--pk-dark:hsl(${ph} 58% 36%)">
        <defs>
          <linearGradient id="${id}" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stop-color="hsl(${ph} 58% 42%)"/><stop offset=".45" stop-color="hsl(${ph} 66% 56%)"/><stop offset="1" stop-color="hsl(${ph} 58% 40%)"/>
          </linearGradient>
        </defs>
        <ellipse cx="220" cy="${ground + 6}" rx="130" ry="12" fill="#000" opacity=".12"/>
        <g class="pack"${rot}>
          ${s.extra.includes('var(--pk-light)') && type === 'tub' ? s.extra : ''}
          <path d="${s.path}" fill="url(#${id})"/>
          ${type !== 'tub' ? s.extra : ''}
          <path d="${s.path}" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="2"/>
          ${labelSVG(p, s.label, s.frontOnTop ? null : labelIcon)}
        </g>
        ${main ? `<image class="front" href="img/art/${main}.webp" x="${fx}" y="${fy}" width="${fs}" height="${fs}"/>` : ''}
        ${s.frontOnTop && labelIcon ? `<image href="img/art/${labelIcon}.webp" x="${fx + fs - 18}" y="${fy + 6}" width="40" height="40"/>` : ''}
      </svg>
    </div>`;
}
