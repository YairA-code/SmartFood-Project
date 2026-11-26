"""בדיקה יומית של מקורות הרכיבים.

רץ ב-GitHub Actions בשעות ששופרסל מתירה (robots.txt: 04:00-08:45 UTC, דף כל 10 שניות).
1. מוצרים שאומתו מול שופרסל או Open Food Facts: משווה את רשימת הרכיבים שם לשלנו.
2. מוצרים ממותגים בלי ברקוד: מחפש בשופרסל לפי שם ומציע ברקוד, רק כשהשם והרכיבים תואמים.
התוצאה נכתבת לקובץ Markdown, וה-workflow פותח או מעדכן issue אחד. שום דבר באתר לא משתנה
אוטומטית: כל תיקון עובר בדיקה ומיזוג ידני.
"""
import json, re, sys, time, html, datetime, difflib, urllib.request, urllib.parse

UA = {'User-Agent': 'Mozilla/5.0 (compatible; SmartFood-source-check; +https://yaira-code.github.io/SmartFood-Project/)'}
products = json.load(open(sys.argv[1], encoding='utf-8'))
out_path = sys.argv[2]
STOP = set('מכיל מכילים מתוכו מתוך בטעם טבעי טבעיים מאכל חומר חומרי חומרים וריח רכיבים רכיב עשוי שונים מקור ממקור אחוז גלוטן ממשקל משקל פחות יותר לצביעה נטחן בשלמותו מפוסטר מפוסטרת צמחי ממקור לפחות סך'.split())

def allowed():
    n = datetime.datetime.now(datetime.timezone.utc)
    return (4, 0) <= (n.hour, n.minute) < (8, 40)

def get(url, timeout=30):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
            return r.status, r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        return e.code, ''
    except Exception:
        return 0, ''

def words(s):
    out = set()
    for w in re.findall('[֐-׿]{3,}', s):
        w = re.sub('^[וה]', '', w) if len(w) > 3 else w
        w = re.sub('(ים|ות)$', '', w) if len(w) > 4 else w
        if w not in STOP: out.add(w)
    return out

def enums(s):
    return set(re.sub(r'[^0-9]', '', m) for m in re.findall(r'E\s?-?\s?\d{3,4}|\d{3,4}\s?-?E', s, re.I))

def clean(text):
    """רק רשימת הרכיבים: בלי "רכיבים:" ובלי מידע על אלרגנים או הערות"""
    t = re.sub(r'^.*?(רכיבים|מרכיבים)\s*[:：]\s*', '', text, count=1, flags=re.S) if re.search(r'(רכיבים|מרכיבים)\s*[:：]', text) else text
    return re.split(r'(מידע על|מידע לגבי|ידע לגבי|רכיבים אלרגניים|אלרגנים|אלרגןי|עלול להכיל|יכול להכיל|מכיל\s*:|ערכים תזונתיים|סימון תזונתי|סך הדגנים|ללא תוספת|יבואן|יצרן|לחם זה|\*)', t)[0]

def readable(text):
    """טקסט שרובו עברית תקינה (ולא זיהוי שגוי מתמונה או תווית בשפה אחרת)"""
    letters = re.findall(r'[A-Za-z\u0590-\u05FF\u0600-\u06FF]', text)
    heb = re.findall(r'[\u0590-\u05FF]', text)
    return len(letters) > 15 and len(heb) / len(letters) > 0.85

VITAMINS = set('ויטמין יטמין יאמין ויטמינ מינרל ניאצין פולית ריבופלאבין ריבולפלאבין תיאמין פנטותנית פאנטותנית ביוטין קובלמין ברזל אבץ סידן קלציום קרבונט מגנזיום יוד אשלגן חומצה'.split())

def compare(ours, theirs):
    """רכיבים שלנו שלא מופיעים במקור, ומילים מהמקור שאין אצלנו"""
    W, E = words(theirs), enums(theirs)
    missing = []
    for i in ours:
        iw, ie = words(i), enums(i)
        if ie and ie <= E: continue
        iw = {w for w in iw if w not in VITAMINS}
        if not iw: continue
        if sum(1 for w in iw if any(w in x or x in w for x in W)) / len(iw) < 0.5: missing.append(i)
    OW = set().union(*[words(i) for i in ours]) if ours else set()
    # מילה מהמקור נחשבת "חסרה אצלנו" רק אם אין לה מקבילה, גם לא עם שגיאת כתיב קטנה,
    # ואם היא לא שם של ויטמין או מינרל (אצלנו לפעמים כתוב רק "ויטמינים")
    def matched(w):
        return any(w in x or x in w or difflib.SequenceMatcher(None, w, x).ratio() >= 0.75 for x in OW)
    extra = sorted(w for w in W if w not in VITAMINS and not matched(w))
    return missing, extra

def shuf_ingredients(page):
    t = re.sub(r'<script.*?</script>|<style.*?</style>', '', page, flags=re.S)
    t = html.unescape(re.sub(r'<[^>]+>', '\n', t)); t = re.sub(r'[ \t]+', ' ', t); t = re.sub(r'\n\s*\n+', '\n', t)
    name = html.unescape((re.search(r'<title>(.*?)</title>', page, re.S) or [None, ''])[1].split('|')[0].strip())
    m = re.search(r'\nרכיבים\n(.*?)\n(מאפיינים נוספים|מכיל|עלול להכיל|ערכים תזונתיים)', t, re.S)
    return name, (m.group(1).strip() if m else '')

changed, found, notes = [], [], []

# 1. מוצרים שאומתו (קודם Open Food Facts, שאין לו מגבלת שעות, ואחר כך שופרסל)
ordered = sorted(products, key=lambda p: 'shufersal.co.il' in p['source'])
for p in ordered:
    src = p['source']
    if 'shufersal.co.il' in src:
        if not allowed(): notes.append('הבדיקה מול שופרסל נעצרה כי הסתיימו השעות שהאתר מתיר.'); continue
        st, page = get(src); time.sleep(10)
        if st != 200 or not page: continue
        name, ing = shuf_ingredients(page)
        ing = clean(ing)
        if not readable(ing): continue
        missing, extra = compare(p['ingredients'], ing)
        if missing or len(extra) >= 3:
            changed.append((p, 'שופרסל אונליין', src, ing, missing, extra))
    elif 'openfoodfacts.org/product/' in src:
        code = src.rstrip('/').split('/')[-1]
        st, body = get(f'https://world.openfoodfacts.org/api/v2/product/{code}?fields=ingredients_text_he,last_modified_t'); time.sleep(1)
        if st != 200: continue
        try: ing = (json.loads(body).get('product') or {}).get('ingredients_text_he') or ''
        except Exception: continue
        ing = clean(ing)
        if not readable(ing): continue
        missing, extra = compare(p['ingredients'], ing)
        if missing or len(extra) >= 3:
            changed.append((p, 'Open Food Facts', src, ing, missing, extra))

# 2. ברקודים למוצרים ממותגים שאין להם
for p in [p for p in products if not p['barcodes'] and p['brand'] != 'מוצר כללי']:
    if not allowed(): notes.append('החיפוש בשופרסל נעצר כי הסתיימו השעות שהאתר מתיר. ימשיך מחר.'); break
    q = p['name'] if p['brand'] in p['name'] else f"{p['name']} {p['brand']}"
    st, page = get('https://www.shufersal.co.il/online/he/search?text=' + urllib.parse.quote(q)); time.sleep(10)
    codes = re.findall(r'data-product-code="P_(\d{8,14})"', page)[:3]
    for c in codes:
        if not allowed(): break
        st, pp = get(f'https://www.shufersal.co.il/online/he/x/p/P_{c}'); time.sleep(10)
        if st != 200: continue
        name, ing = shuf_ingredients(pp)
        ing = clean(ing)
        if not readable(ing): continue
        missing, extra = compare(p['ingredients'], ing)
        if not missing and len(extra) <= 1:
            found.append((p, c, name, ing)); break

today = datetime.date.today().isoformat()
lines = [f'## בדיקת מקורות {today}', '']
if changed:
    lines += [f'### {len(changed)} מוצרים שהרכיבים שלהם במקור שונים משלנו', '',
              'ייתכן שהמתכון השתנה. כדאי לבדוק ולעדכן, ועד אז אפשר להעביר את המוצר לרשימת הלא מאומתים.', '']
    for p, srcname, url, ing, missing, extra in changed:
        lines += [f'- **{p["name"]}** (`{p["id"]}`) · [{srcname}]({url})',
                  f'  - אצלנו ולא במקור: {", ".join(missing) or "—"}',
                  f'  - במקור ולא אצלנו: {", ".join(extra[:12]) or "—"}',
                  f'  - הרשימה במקור: {ing[:400]}']
    lines.append('')
if found:
    lines += [f'### {len(found)} ברקודים שנמצאו למוצרים שאין להם', '', 'השם והרכיבים בשופרסל תואמים לשלנו.', '']
    for p, c, name, ing in found:
        lines.append(f'- **{p["name"]}** (`{p["id"]}`): ברקוד `{c}` · בשופרסל: {name}')
    lines.append('')
if not changed and not found:
    lines.append('לא נמצאו שינויים ולא נמצאו ברקודים חדשים.')
lines += [f'> {n}' for n in dict.fromkeys(notes)]
open(out_path, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print(f'changed={len(changed)} found={len(found)}')
with open(out_path + '.status', 'w') as f: f.write('findings' if (changed or found) else 'clean')
