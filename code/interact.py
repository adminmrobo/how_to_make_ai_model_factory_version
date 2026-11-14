import pathlib
import asyncio
from playwright.async_api import async_playwright
import os
URL=pathlib.Path(__file__).resolve().parent.parent.as_uri()+'/'+os.environ.get('PAGE','index.html')
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':1280,'height':900})
        errs=[];pg.on('pageerror',lambda e: errs.append(str(e)));pg.on('console',lambda m: errs.append(m.text) if m.type=='error' and 'TUNNEL' not in m.text else None)
        await pg.goto(URL); await pg.wait_for_timeout(2500)
        async def shot(sel,name=None):
            el=await pg.query_selector(sel); await el.scroll_into_view_if_needed(); await pg.wait_for_timeout(500); await el.screenshot(path=os.environ.get('SHOTS','/tmp')+'/j_'+(name or sel.strip('#'))+'.png')
        REG='regression' in URL
        for eid in (['tree','gp','boost'] if REG else ['tree','ae','boost']):
            await pg.click(f'.eng[data-id="{eid}"]'); await pg.wait_for_timeout(600); await shot('#mount','mount_'+eid)
        await pg.click('.eng[data-id="mlp"]')
        for k,v in ([('w11','-0.8'),('w12','-0.6'),('w21','-1.2'),('w22','-0.6'),('b2','0.3')] if REG else [('w21','-1.2'),('w22','-0.6'),('b2','0.3')]):
            await pg.eval_on_selector('#r1-'+k,"(e,v)=>{e.value=v;e.dispatchEvent(new Event('input'))}",v)
        if not REG:
            await pg.eval_on_selector('#r2-w2',"e=>{e.value='1';e.dispatchEvent(new Event('input'))}")
            await pg.eval_on_selector('#r2-b',"e=>{e.value='-1';e.dispatchEvent(new Event('input'))}")
        btns=await pg.query_selector_all('#w3-cells button'); await btns[1].click()
        await shot('#w1'); await shot('#w4')
        await pg.click('#w7-step')
        await pg.click('#w8-run'); await pg.wait_for_timeout(5000); await shot('#w8')
        btns=await pg.query_selector_all('#w3-cells button'); await btns[2].click()
        await shot('#w9')
        await pg.click('#w10-sweep'); await pg.wait_for_timeout(4000); await pg.click('#w10-infer'); await shot('#w10')
        await pg.click('#duel [data-go]'); await pg.wait_for_timeout(9000 if REG else 1500); await shot('#duel'); await shot('#ship'); await shot('#board')
        qc=await pg.evaluate("Array.from({length:10},(_,i)=>{var e=document.querySelector('#bl'+(i+1)+' .lamp');return (i+1)+':'+(e?e.textContent:'?')}).join(' ')")
        print('QC',qc); print('ERR',errs)
        for s in ['#d-say','#i-w9','#i-w10','#i-ship']: print(await pg.evaluate(f"document.querySelector('{s}').innerText"))
        await b.close()
asyncio.run(main())
