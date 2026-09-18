"""Build dist/index.html from src/data.py + the WEB verse-per-line text.

Usage:  python3 src/build.py        (quiet)
        python3 src/build.py -v     (print warnings + attestation report)
Run scripts/fetch_web.sh first to download the WEB text into web/.
"""
import re, json, collections, sys, pathlib, shutil
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))
from data import PEOPLE, LINKS
BOOKS=[("ACT","Acts","Acts","acts"),("ROM","Romans","Rom","paul"),("1CO","1 Corinthians","1 Cor","paul"),("2CO","2 Corinthians","2 Cor","paul"),("GAL","Galatians","Gal","paul"),("EPH","Ephesians","Eph","disputed"),("PHI","Philippians","Phil","paul"),("COL","Colossians","Col","disputed"),("1TH","1 Thessalonians","1 Thess","paul"),("2TH","2 Thessalonians","2 Thess","disputed"),("1TI","1 Timothy","1 Tim","pastoral"),("2TI","2 Timothy","2 Tim","pastoral"),("TIT","Titus","Titus","pastoral"),("PHM","Philemon","Phlm","paul"),("HEB","Hebrews","Heb","catholic"),("JAM","James","Jas","catholic"),("1PE","1 Peter","1 Pet","catholic"),("2PE","2 Peter","2 Pet","catholic"),("1JO","1 John","1 John","catholic"),("2JO","2 John","2 John","catholic"),("3JO","3 John","3 John","catholic"),("JUD","Jude","Jude","catholic")]
order={b[0]:i for i,b in enumerate(BOOKS)}
V={}  # key -> text
keys=[]
for l in open(ROOT/'web'/'engwebp_vpl.txt',encoding='utf-8-sig'):
    b=l[:3]
    if b in order:
        ref,txt=l.rstrip('\n').split(' ',2)[1:]
        c,v=ref.split(':'); k=f"{b} {int(c)}:{int(v)}"; V[k]=txt.strip(); keys.append(k)
def parse(k): b,r=k.split(' '); c,v=r.split(':'); return b,int(c),int(v)
def expand(r):
    b,rest=r.split(' '); c,vs=rest.split(':')
    if '-' in vs: a,z=vs.split('-'); return [f"{b} {c}:{i}" for i in range(int(a),int(z)+1)]
    return [r]
raw=collections.defaultdict(list) # key -> [(s,e,pid)]
warn=[]
for p in PEOPLE:
    default=re.compile('|'.join(p['pats']))
    if p['refs'] is None:
        cands=[(k,default) for k in keys]
    else:
        cands=[]
        for r in p['refs']:
            pat=default
            if isinstance(r,tuple): r,pt=r; pat=re.compile(pt)
            for k in expand(r):
                if k in V: cands.append((k,pat))
            if '-' not in r and not pat.search(V.get(r,'')): warn.append(f"NO MATCH {p['id']} {r}")
    for k,pat in cands:
        if k in p['exclude']: continue
        for m in pat.finditer(V[k]): raw[k].append((m.start(),m.end(),p['id']))
# resolve overlaps: longer wins
final={}
for k,ms in raw.items():
    ms=sorted(ms,key=lambda m:-(m[1]-m[0])); kept=[]
    for m in ms:
        if any(not(m[1]<=o[0] or m[0]>=o[1]) for o in kept):
            o=[o for o in kept if not(m[1]<=o[0] or m[0]>=o[1])][0]
            if o[2]!=m[2]: warn.append(f"OVERLAP {k}: {m[2]} '{V[k][m[0]:m[1]]}' lost to {o[2]} '{V[k][o[0]:o[1]]}'")
            continue
        kept.append(m)
    final[k]=sorted(kept)
prefs=collections.defaultdict(list)
for k in keys:
    for s,e,pid in final.get(k,[]):
        if k not in prefs[pid]: prefs[pid].append(k)
# unclaimed occurrences of ambiguous names
amb=r"\b(John|James|Judas|Simon|Simeon|Ananias|Alexander|Mary|Herod|Philip|Joseph|Justus|Demetrius|Erastus|Lucius|Jason|Gaius|Sosthenes|Claudius|Mark|Niger|Agrippa|Lysias|Judah|Jude|Joses)\b"
for k in keys:
    for m in re.finditer(amb,V[k]):
        if not any(s<=m.start()<e for s,e,_ in final.get(k,[])): warn.append(f"UNCLAIMED {k}: {m.group()} :: {V[k][max(0,m.start()-40):m.end()+40]}")
# co-naming
co=collections.defaultdict(collections.Counter)
for i,k in enumerate(keys):
    here={m[2] for m in final.get(k,[])}
    for a in here:
        for b in here:
            if a!=b: co[a][b]+=2
    if i+1<len(keys):
        k2=keys[i+1]; b1,c1,_=parse(k); b2,c2,_=parse(k2)
        if (b1,c1)==(b2,c2):
            nxt={m[2] for m in final.get(k2,[])}
            for a in here:
                for b in nxt:
                    if a!=b and b not in here and a not in nxt: co[a][b]+=1; co[b][a]+=1
links=collections.defaultdict(list)
for a,b,st,note in LINKS:
    links[a].append(dict(to=b,strength=st,note=note)); links[b].append(dict(to=a,strength=st,note=note))
pidx={p['id']:i for i,p in enumerate(PEOPLE)}  # deterministic tie-break
VALID_ROLES={'cosender','addressee','carrier','scribe','sendsgreetings','greeted','opponent'}
out=[]
for p in PEOPLE:
    refs=prefs[p['id']]
    if not refs: warn.append(f"EMPTY {p['id']}"); continue
    bks=sorted({parse(k)[0] for k in refs},key=order.get)
    inacts='ACT' in bks; nl=len([b for b in bks if b!='ACT'])
    cls='both' if inacts and nl else 'letters' if nl>=2 else 'letter' if nl==1 else 'acts'
    for rb,role in p['roles'].items():
        if role not in VALID_ROLES: warn.append(f"BAD ROLE {p['id']} {rb}: {role!r} not in {sorted(VALID_ROLES)}")
        if rb=='ACT': warn.append(f"BAD ROLE {p['id']}: role set on ACT, roles are letters-only")
        elif rb not in bks: warn.append(f"BAD ROLE {p['id']} {rb}: not attested in that book ({bks})")
    out.append(dict(id=p['id'],name=p['name'],aka=p['aka'],desc=p['desc'],gospels=p['gospels'],cls=cls,kind=p['kind'],books=bks,refs=refs,roles=p['roles'],
        links=links.get(p['id'],[]),co=[x for x,_ in sorted(co[p['id']].items(),key=lambda kv:(-kv[1],pidx[kv[0]]))[:14]]))
used={k for p in out for k in p['refs']}
verses={k:dict(t=V[k],m=[[s,e,pid] for s,e,pid in final[k]]) for k in keys if k in used}
data=dict(books=[dict(code=b[0],name=b[1],abbr=b[2],corpus=b[3]) for b in BOOKS],people=out,verses=verses)
blob=json.dumps(data,ensure_ascii=False,separators=(',',':')).replace("</","<\\/")
tpl=(ROOT/'src'/'template.html').read_text(encoding='utf-8')
assert "/*DATA*/" in tpl
(ROOT/'dist').mkdir(exist_ok=True)
(ROOT/'dist'/'index.html').write_text(tpl.replace("/*DATA*/",blob),encoding='utf-8')
shutil.copyfile(ROOT/'assets'/'og.png', ROOT/'dist'/'og.png')
hard=[w for w in warn if w.startswith(("NO MATCH","EMPTY","OVERLAP","BAD ROLE"))]
if '-v' in sys.argv:
    for w in warn: print(w)
    print(len(out),'people',len(verses),'verses',len(blob)//1024,'KB')
    print(collections.Counter(p['cls'] for p in out))
    for p in out:
        if p['cls'] in('both','letters') or len(p['refs'])<=12 and p['id'] in ('simon_tanner','peter','mark','james_zeb','herod_agrippa1','claudius_lysias','philip_evan'):
            print(p['id'],p['cls'],p['books'],len(p['refs']), p['refs'] if len(p['refs'])<14 else '')

if hard:
    print('BUILD WARNINGS (fix before shipping):'); [print(' ',w) for w in hard]; sys.exit(1)
