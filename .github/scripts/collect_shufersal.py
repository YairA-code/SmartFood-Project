"""איסוף יומי של רשימות רכיבים משופרסל אונליין למאגר המורחב.

מכבד את robots.txt של שופרסל: דף אחד כל 10 שניות, רק בין 04:00 ל-08:45 UTC.
לכל מוצר במאגר שאין לו רשימת רכיבים: מנסה את דף המוצר לפי הברקוד, ושומר את
רשימת הרכיבים (רק אם היא נראית כמו עברית תקינה) עם קישור למקור. מוצר שאין לו
דף או רכיבים מסומן, ונבדק שוב רק אחרי 30 יום. רשימות שנאספו מתרעננות כל 60 יום.

usage: python3 collect_shufersal.py <catalog-dir> [max-minutes]
"""
import json, os, re, sys, time, html, glob, datetime, urllib.request

cat = sys.argv[1]
budget = float(sys.argv[2]) * 60 if len(sys.argv) > 2 else None
UA = {'User-Agent': 'Mozilla/5.0 (compatible; SmartFood-ingredients; +https://yaira-code.github.io/SmartFood-Project/)'}
TODAY = datetime.date.today()
start = time.time()

def allowed():
    if budget is not None and time.time() - start > budget: return False
    n = datetime.datetime.now(datetime.timezone.utc)
    return (4, 0) <= (n.hour, n.minute) < (8, 40)

def get(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
            return r.status, r.read().decode('utf-8', 'replace'), r.geturl()
    except urllib.error.HTTPError as e:
        return e.code, '', url
    except Exception:
        return 0, '', url

def ingredients(page):
    t = re.sub(r'<script.*?</script>|<style.*?</style>', '', page, flags=re.S)
    t = html.unescape(re.sub(r'<[^>]+>', '\n', t)); t = re.sub(r'[ \t]+', ' ', t); t = re.sub(r'\n\s*\n+', '\n', t)
    name = html.unescape((re.search(r'<title>(.*?)</title>', page, re.S) or [None, ''])[1].split('|')[0].strip())
    m = re.search(r'\nרכיבים\n(.*?)\n(מאפיינים נוספים|מכיל|עלול להכיל|ערכים תזונתיים)', t, re.S)
    text = m.group(1).strip() if m else ''
    text = re.split(r'(מידע על אלרגנים|עלול להכיל|יכול להכיל)', text)[0]
    return name, re.sub(r'\s+', ' ', text).strip()

def readable(text):
    letters = re.findall(r'[A-Za-z֐-׿؀-ۿ]', text)
    heb = re.findall(r'[֐-׿]', text)
    return len(heb) > 12 and len(heb) / max(1, len(letters)) > 0.85

def age(d):
    try: return (TODAY - datetime.date.fromisoformat(d)).days
    except Exception: return 10**6

shards = {f: json.load(open(f, encoding='utf-8')) for f in sorted(glob.glob(os.path.join(cat, 'c-*.json')))}
queue = []
for f, entries in shards.items():
    for e in entries:
        if not e.get('i') and age(e.get('x', '')) > 30: queue.append((0, e))            # עוד לא נבדק
        elif e.get('s') == 'shufersal' and age(e.get('d', '')) > 60: queue.append((1, e))  # רענון
queue.sort(key=lambda q: (q[0], q[1]['c']))
print('queue', len(queue), flush=True)

added = refreshed = missing = 0
for kind, e in queue:
    if not allowed(): break
    c = e['c']
    cands = [c] + ([str(int(c[6:]))] if len(c) == 13 and c.startswith('729000') else [])
    found = None
    for code in cands:
        if not allowed(): break
        st, page, final = get(f'https://www.shufersal.co.il/online/he/x/p/P_{code}')
        time.sleep(10)
        if st == 200 and page:
            name, ing = ingredients(page)
            if ing and readable(ing): found = (code, ing); break
    if found:
        e['i'] = found[1][:1500]; e['s'] = 'shufersal'; e['u'] = found[0]; e['d'] = TODAY.isoformat(); e.pop('x', None)
        if kind: refreshed += 1
        else: added += 1
    elif not kind:
        e['x'] = TODAY.isoformat(); missing += 1

for f, entries in shards.items():
    json.dump(entries, open(f, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
allp = [e for entries in shards.values() for e in entries]
names = [[e['c'], e['n'], e.get('b', ''), 1 if e.get('i') else 0] for e in sorted(allp, key=lambda e: e['n'])]
json.dump(names, open(os.path.join(cat, 'names.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
try: prev = json.load(open(os.path.join(cat, 'meta.json')))
except Exception: prev = {}
meta = {'products': len(allp), 'with_ingredients': sum(1 for e in allp if e.get('i')),
        'updated': TODAY.isoformat() if (added or refreshed or missing) else prev.get('updated', TODAY.isoformat())}
json.dump(meta, open(os.path.join(cat, 'meta.json'), 'w'), separators=(',', ':'))
print(f'added={added} refreshed={refreshed} no_ingredients={missing}', meta, flush=True)
out = os.environ.get('GITHUB_OUTPUT')
if out:
    with open(out, 'a') as f:
        f.write(f'added={added}\nrefreshed={refreshed}\nmissing={missing}\nqueue={len(queue)}\nwith_ingredients={meta["with_ingredients"]}\n')
        f.write(f'window={"yes" if added + refreshed + missing else "no"}\n')
