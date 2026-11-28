"""בונה מחדש את המאגר המורחב מקובצי המחירים של כל הסניפים, ושומר את מה שכבר נאסף.

מה נכנס: כל מוצר עם ברקוד תקין (בדיקת ספרת ביקורת), שלא נמכר במשקל, ושמסווג כמזון:
  1. אם יש לו קטגוריה רשמית מאתר שופרסל (שדה k), היא קובעת.
  2. אחרת, מסווג סטטיסטי (foodclf.py) שלומד מהמילים בשם ומהיצרן.
  מוצר שכבר יש לו רשימת רכיבים נשאר תמיד (הוא מזון לפי הגדרה).
מה נשמר: לכל ברקוד שכבר היה במאגר נשמרים הרכיבים, המקור, התאריכים והקטגוריה.

usage: python3 rebuild_catalog.py <price-items.json> <catalog-dir> [categories.json]
"""
import json, os, re, sys, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from foodclf import classify

prices_path, cat = sys.argv[1], sys.argv[2]
cats = json.load(open(sys.argv[3], encoding='utf-8')) if len(sys.argv) > 3 else {}

def norm(code):
    c = re.sub(r'\D', '', str(code)).lstrip('0')
    return c if 7 <= len(c) <= 14 else None

def valid(code):
    for c in (code.zfill(13) if len(code) <= 13 else code, code.zfill(12) if len(code) <= 12 else None, code.zfill(8) if len(code) <= 8 else None):
        if not c: continue
        d = [int(x) for x in c]; k = d.pop()
        if (10 - sum(x * (3 if i % 2 == 0 else 1) for i, x in enumerate(reversed(d))) % 10) % 10 == k: return True
    return False

# קטגוריות שופרסל שאינן מזון (נבדק מול רשימת הקטגוריות המלאה)
NONFOOD_CAT = re.compile(r'פארם|טיפוח|קוסמטיקה|איפור|בישום|היגיינה|ניקיון|חד[- ]פעמי|כלי[- ]בית|בית[- ]ומטבח|לבית|חשמל|טקסטיל|'
                         r'צעצוע|משחקים|ביגוד|הלבשה|בעלי[- ]חיים|לחיות|מחמד|תינוקות-ופעוטות/(?!מזון)|עישון|טבק|עיתונים|פנאי|כלי[- ]כתיבה|ציוד|אחזקה|גינה')

old = {}
for f in glob.glob(os.path.join(cat, 'c-*.json')):
    for e in json.load(open(f, encoding='utf-8')): old[e['c']] = e

raw = [x for x in json.load(open(prices_path, encoding='utf-8')) if x.get('w') not in ('1', 'true')]
items = []
for x in raw:
    c = norm(x.get('code'))
    if not c or not valid(c): continue
    name = re.sub(r'\s+', ' ', x.get('name') or '').strip()
    if not name: continue
    x = dict(x, name=name, c=c); items.append(x)
P = classify(items)

out, why = {}, {'category': 0, 'model': 0, 'has_ingredients': 0}
for x, p in zip(items, P):
    c = x['c']; e = old.get(c)
    k = (e or {}).get('k') or cats.get(c, '')
    if e and e.get('i'): food, how = True, 'has_ingredients'
    elif k: food, how = not NONFOOD_CAT.search(k), 'category'
    else: food, how = p > .5, 'model'
    if not food: continue
    why[how] += 1
    man = re.sub(r'\s+', ' ', x.get('man') or '').strip(' ,.-')
    if man in ('---', 'כללי', 'לא ידוע', '-', ','): man = ''
    n = dict(e) if e else {'c': c, 'n': x['name'], 'b': man}
    if not n.get('b') and man: n['b'] = man
    if k: n['k'] = k
    out[c] = n
for c, e in old.items():          # מוצרים עם רכיבים שלא מופיעים כרגע בקובצי המחירים
    if c not in out and e.get('i'): out[c] = e; why['has_ingredients'] += 1

for f in glob.glob(os.path.join(cat, 'c-*.json')): os.remove(f)
shards = {}
for e in out.values(): shards.setdefault(e['c'][-2:], []).append(e)
for k, v in shards.items():
    json.dump(sorted(v, key=lambda e: e['c']), open(os.path.join(cat, f'c-{k}.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
names = [[e['c'], e['n'], e.get('b', ''), 1 if e.get('i') else 0] for e in sorted(out.values(), key=lambda e: e['n'])]
json.dump(names, open(os.path.join(cat, 'names.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
prev = json.load(open(os.path.join(cat, 'meta.json')))
meta = {'products': len(out), 'with_ingredients': sum(1 for e in out.values() if e.get('i')), 'updated': prev.get('updated')}
json.dump(meta, open(os.path.join(cat, 'meta.json'), 'w'), separators=(',', ':'))
print(meta, why, 'removed', len(set(old) - set(out)), 'added', len(set(out) - set(old)))
