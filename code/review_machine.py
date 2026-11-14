import pathlib
import asyncio,json,re
from playwright.async_api import async_playwright
import os
H=open(os.environ.get('PAGE','index.html'),encoding='utf-8').read()
res={}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':390,'height':900});errs=[];reqs=set()
        pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'TUNNEL' not in m.text else None)
        pg.on('request',lambda r:reqs.add(r.url.split('?')[0]) if not r.url.startswith(('file:','data:','blob:')) else None)
        await pg.goto(pathlib.Path(__file__).resolve().parent.parent.as_uri()+'/'+os.environ.get('PAGE','index.html'));await pg.wait_for_timeout(3500)
        res['M1']=errs;res['M2']=await pg.evaluate('document.documentElement.scrollWidth');res['M3']=sorted(reqs)
        res['M4']=await pg.evaluate("(()=>{try{return [localStorage.length,sessionStorage.length,document.cookie]}catch(e){return 'err'}})()")
        await b.close()
asyncio.run(main())
res['M4src']=[w for w in ['localStorage','sessionStorage','indexedDB','document.cookie'] if w in H]
blk={}
for i in ['kg-raw','kg-ld','refs-csl','page-meta']:
    m=re.search(r'<script[^>]*id="%s"[^>]*>(.*?)</script>'%i,H,re.S);blk[i]=json.loads(m.group(1)) if m else None
kg=blk['kg-raw'];ids={n['id'] for n in kg['nodes']}
res['M5']={k:(v is not None) for k,v in blk.items()};res['M5dangling']=[e for e in kg['edges'] if e['s'] not in ids or (e['o'] not in ids and not e['o'].startswith('lab:topic/'))]
em=json.load(open(os.environ.get('EXPR_MAP','../ahnboat_lab_explainer/packs/character/character_pack/expression_map.json')))
moods=set(re.findall(r'data-mood="([a-z0-9_]+)"',H))|set(re.findall(r"\"(?:doc|asst|fly|robo|sia|moa)\",\"((?:doc|asst|fly|robo|sia|moa)_[a-z]+)\"",H))
res['M6']=[m for m in moods if m not in em and not re.match(r'x\d_hint',m)];res['M6img']=re.findall(r'data-img="([^"]+)"',H)
txt=re.sub(r'<script.*?</script>','',H,flags=re.S)
res['M7']=[w for w in ['혁명적','완벽한','아무도','미개척','최초','세계 최초'] if w in txt]
print(json.dumps(res,ensure_ascii=False,indent=0)[:2500])
