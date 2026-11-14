import asyncio, os, pathlib
from playwright.async_api import async_playwright
URL=pathlib.Path(__file__).resolve().parent.parent.as_uri()+'/factory.html'
SH=os.environ.get('SHOTS','/tmp')
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':1280,'height':900})
        errs=[];pg.on('pageerror',lambda e: errs.append(str(e)));pg.on('console',lambda m: errs.append(m.text) if m.type=='error' and 'TUNNEL' not in m.text else None)
        await pg.goto(URL);await pg.wait_for_timeout(2500)
        async def setr(id,v): await pg.eval_on_selector('#r-'+id,"(e,v)=>{e.value=v;e.dispatchEvent(new Event('input'))}",str(v));await pg.wait_for_timeout(350)
        async def shot(sel,name): el=await pg.query_selector(sel);await el.scroll_into_view_if_needed();await pg.wait_for_timeout(400);await el.screenshot(path=f'{SH}/fac_{name}.png')
        async def kit(): return await pg.evaluate("Array.from(document.querySelectorAll('#kitgrid .kitc')).map(c=>c.querySelector('h4').innerText.replace(/\\n/g,' ')+' | '+c.querySelector('.st').innerText).join('\\n')")
        # K1
        await setr('speed',1.2);bt=await pg.query_selector_all('#g-k1 button');await bt[8].click();await pg.wait_for_timeout(300)
        # K2
        for i in range(2): await pg.click('[data-mach="8"][data-d="1"]');await pg.wait_for_timeout(350)
        print(await kit());print('---')
        # K3
        await pg.click('#c-reset');await pg.wait_for_timeout(400);await setr('hours',24);await setr('cool',2);print(await kit());print('---')
        # K4
        await pg.click('#c-reset');await pg.wait_for_timeout(400);await setr('start',22);await pg.click('#c-log');print(await kit());print('---')
        # optimizer K5
        await pg.click('#o-run');await pg.wait_for_timeout(12000);print(await pg.inner_text('#o-prog'));await pg.click('#o-apply');await pg.wait_for_timeout(600);await pg.click('#c-log');print(await kit())
        await shot('#optimize','opt');await shot('#kit','kit');await shot('#heat','heat');await shot('#power','power');await shot('#defect','defect')
        await pg.click('#duel [data-go]');await pg.wait_for_timeout(800);await shot('#duel','duel');print(await pg.inner_text('#d-score'))
        await pg.click('#l-bad');await shot('#label','label')
        btn=await pg.query_selector_all('#pchips button');await btn[9].click();await pg.wait_for_timeout(500);await shot('#plant','plant')
        print('ERR',errs)
        await b.close()
asyncio.run(main())
