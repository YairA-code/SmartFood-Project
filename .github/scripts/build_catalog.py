"""בונה את המאגר המורחב: כל המוצרים מקובצי המחירים של הרשתות (שם, יצרן, ברקוד)
ומ-Open Food Facts (רשימת רכיבים בעברית, רישיון ODbL).

usage: python3 build_catalog.py <price-items.json> <off-dir-or-''> <out-dir>
הפלט: out/c-XX.json לפי שתי הספרות האחרונות של הברקוד, ו-out/names.json לחיפוש.
"""
import json, os, re, sys, glob

prices_path, off_dir, out = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out, exist_ok=True)

NONFOOD = re.compile(r'קרם לחות|קרם הגנה|מייקאפ|סרום|שיער|פלסטר|חבישה|עציץ|מפת שולחן|גפרור|פטיש|נוזל |מי פה|תיק |אוד |בושם|'
                     r'טורבו דוג|ליפטר|חיטוי|מטאטא|מגשית|מיכל ל|מוצץ|בקבוק לתינוק|קוסמטיק|HYDRA|תבנית|מחבת|סיר |קופסת אחסון|שמפו|מרכך שיער|סבון|כביסה|מרכך כביסה|נייר טואלט|טואלט|חיתול|טיטול|מגבונ|דאודורנט|משחת שיניים|מברשת|אקונומיקה|'
                     r'סכו"ם|צלחות|כוסות חד|שקיות|סוללה|סוללות|נורה|ספוג|מטהר|ג\'ל רחצה|קרם ידיים|קרם גוף|קרם פנים|'
                     r'לחתול|לכלב|לחתולים|לכלבים|מזון לחיות|חול לחתול|תחבושת|פדים|טמפון|גילוח|סכין|מצית|נרות|נייר כסף|'
                     r'נייר אפיה|ניילון|מפית|מפיות|נוזל כלים|תבליות|אבקת מדיח|מסיר|מנקה|צבע לשיער|לק |בושם|אגרטל|כלי ')

def norm(code):
    c = re.sub(r'\D', '', str(code)).lstrip('0')
    return c if 7 <= len(c) <= 14 else None

def valid(code):
    c = code.zfill(13) if len(code) < 13 else code
    if len(c) not in (8, 12, 13, 14):
        c = code
    d = [int(x) for x in c]; k = d.pop()
    s = sum(x * (1 if i % 2 else 3) for i, x in enumerate(reversed(d)))
    return (10 - s % 10) % 10 == k

def readable(text):
    letters = re.findall(r'[A-Za-z֐-׿؀-ۿ]', text)
    heb = re.findall(r'[֐-׿]', text)
    return len(heb) > 12 and len(heb) / max(1, len(letters)) > 0.85

FOOD = re.compile(
    r'חלב|גבינ|יוגורט|לבן |לבנה|קוטג|שמנת|חמאה|מעדן|פודינג|גלידה|ארטיק|שלגון|קרטיב|ביצ|לחם|לחמני|פית|חלה|באגט|טורטי|עוג|ביסקוו|וופל|'
    r'קרקר|פריכי|בייגל|חטיף|במבה|ביסלי|צ\'יפס|ציפס|תפוצ|דוריטוס|פופקורן|שוקולד|ממתק|סוכרי|מסטיק|גומי|מרשמלו|חלבה|ריבה|ממרח|דבש|'
    r'טחינה|חומוס|סלט|מטבוחה|חציל|רוטב|קטשופ|מיונז|חרדל|תבלין|פפריקה|כמון|פלפל|מלח|סוכר|קמח|אורז|פסטה|ספגטי|פתיתים|קוסקוס|אטריות|'
    r'נודלס|דגני|קורנפלקס|גרנולה|שיבולת|מוזלי|קוואקר|שמן|זית|זיתים|מלפפון|חמוצ|כבוש|שימור|טונה|סרדינ|דג|סלמון|אמנון|בשר|עוף|הודו|'
    r'שניצל|קציצ|המבורגר|נקניק|נקניקי|סלמי|פסטרמה|קבנוס|כבד|שווארמה|קבב|מרק|אבקת מרק|ציר|פירה|פלאפל|בורקס|פיצה|מאפה|בצק|לזניה|'
    r'קפוא|ירקות|פירות|תפוח|בננה|תות|ענבים|תמר|צימוק|אגוז|שקד|בוטנ|גרעינ|פיסטוק|קשיו|לוז|קוקוס|משקה|מיץ|נקטר|סירופ|תרכיז|מים |מי |'
    r'סודה|קולה|ספרייט|פאנטה|לימונד|תה |חליטה|קפה|נס |קקאו|שוקו|אייס|אנרגיה|סויה|טופו|טבעול|תירס|אפונה|שעועית|עדשים|גרגירי|'
    r'פטריות|עגבני|רסק|בצל|שום|גזר|תפו"א|תפוחי אדמה|מעדנ|קינוח|פרלין|קרם |מילקי|דני|יופלה|אקטיביה|דנונה|פרו |חלבון|מעדן')
FOOD_MAKERS = re.compile(r'אסם|שטראוס|עלית|תנובה|יטבתה|טרה|זוגלובק|טבעול|תלמה|יוניליוור|נסטלה|ויסוצקי|סוגת|מיה|פרי ניר|יכין|'
                         r'שופרסל|ברמן|אנג\'ל|שטיבל|אחוה|בארכה|הר ברכה|מחלבות|גד |עוף טוב|יחיעם|זנלכל|פריגת|ספרינג|יפאורה|'
                         r'נביעות|מי עדן|קוקה|פפסי|טמפו|ריו|ויליפוד|אוסם|סנפרוסט|מעדנות|שלושת האופים|ביגל|מאפיית|קרמל|כרמית|'
                         r'רוקחמן|ליבר|מקס ברנר|פררו|מונדלז|מארס|קלוגס|קוואקר|ברילה|היינץ|הלמנס|אוליביה|קנור|ניו פוד', re.I)
DRINK_ALCOHOL = re.compile(r'וודקה|ויסקי|יין |בירה|ליקר|ערק|רום |ג\'ין|טקילה|שמפניה|קאווה|ברנדי|קוניאק')

items = {}
for x in json.load(open(prices_path, encoding='utf-8')):
    c = norm(x.get('code'))
    if not c or x.get('w') in ('1', 'true') or not valid(c): continue
    name = re.sub(r'\s+', ' ', x.get('name') or '').strip()
    if not name or NONFOOD.search(name) or DRINK_ALCOHOL.search(name + ' '): continue
    man = re.sub(r'\s+', ' ', x.get('man') or '').strip(' ,.-')
    if NONFOOD.search(man) or not (FOOD.search(name + ' ') or FOOD_MAKERS.search(man)): continue
    if man in ('---', 'כללי', 'לא ידוע', '-', ','): man = ''
    items[c] = {'c': c, 'n': name, 'b': man}

off_count = 0
def off_products(d):
    for fn in sorted(glob.glob(os.path.join(d, 'p*.json'))):
        yield from json.load(open(fn, encoding='utf-8')).get('products', [])
    jl = os.path.join(d, 'found.jsonl')
    if os.path.exists(jl):
        for line in open(jl, encoding='utf-8'):
            try: yield json.loads(line)
            except Exception: pass

if off_dir:
    for d in off_dir.split(','):
        for p in off_products(d):
                c = norm(p.get('code'))
                if not c: continue
                ing = (p.get('ingredients_text_he') or '').strip()
                if not ing and re.search(r'[֐-׿]', p.get('ingredients_text') or ''): ing = p['ingredients_text'].strip()
                ing = re.sub(r'\s+', ' ', ing)
                name = (p.get('product_name_he') or p.get('product_name') or '').strip()
                e = items.get(c, {'c': c, 'n': name, 'b': ''})
                if name and re.search(r'[֐-׿]', name): e['n'] = name
                brand = (p.get('brands') or '').split(',')[0].strip()
                if brand: e['b'] = brand
                if p.get('quantity'): e['q'] = p['quantity'][:20]
                if ing and readable(ing): e['i'] = ing[:1500]; e['s'] = 'off'; off_count += 1
                if e.get('n'): items[c] = e

shards = {}
for e in items.values(): shards.setdefault(e['c'][-2:], []).append(e)
for k, v in shards.items():
    json.dump(sorted(v, key=lambda e: e['c']), open(os.path.join(out, f'c-{k}.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
names = [[e['c'], e['n'], e.get('b', ''), 1 if e.get('i') else 0] for e in sorted(items.values(), key=lambda e: e['n'])]
json.dump(names, open(os.path.join(out, 'names.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
meta = {'products': len(items), 'with_ingredients': off_count}
json.dump(meta, open(os.path.join(out, 'meta.json'), 'w'), separators=(',', ':'))
print(meta)
