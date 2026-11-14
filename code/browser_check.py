import pathlib
import sys, json, asyncio
from playwright.async_api import async_playwright
import os
URL=pathlib.Path(__file__).resolve().parent.parent.as_uri()+'/'+os.environ.get('PAGE','index.html')
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        for W in [1280,390]:
            pg=await b.new_page(viewport={'width':W,'height':900})
            errs=[]
            pg.on('console',lambda m: errs.append(m.type+': '+m.text) if m.type in ('error','warning') else None)
            pg.on('pageerror',lambda e: errs.append('pageerror: '+str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2500)
            sw=await pg.evaluate('document.documentElement.scrollWidth')
            qc=await pg.evaluate("Array.from({length:10},(_,i)=>{var e=document.querySelector('#bl'+(i+1)+' .lamp');return (i+1)+':'+(e?e.textContent:'?')}).join(' ')")
            print(W,'scrollWidth',sw,'| QC',qc)
            for e in errs: print('  ',e[:300])
            if len(sys.argv)>1:
                for sel in sys.argv[1:]:
                    el=await pg.query_selector(sel)
                    if el:
                        await el.scroll_into_view_if_needed(); await pg.wait_for_timeout(600)
                        await el.screenshot(path=f'{os.environ.get("SHOTS","/tmp")}/{W}_{sel.strip("#.")}.png')
            await pg.close()
        await b.close()
asyncio.run(main())
