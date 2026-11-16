"""각 공장 페이지의 3D 장면을 캡처해 첫 페이지 카드 그림으로 쓴다 → img/fac3d_<공장>.webp
실행(저장소 맨 위에서): python3 code/capture_3d.py"""
import asyncio, io, pathlib
from PIL import Image
from playwright.async_api import async_playwright
R = pathlib.Path(__file__).resolve().parent.parent
SHOTS = [("classifier", "#cvFac", None), ("regression", "#cvFac", None), ("factory", "#cvPlant", None),
         ("solar", "#cvPlant", None), ("testlab", "#cvLine", None), ("blast", "#cvLab", "#b-demo")]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        for name, sel, click in SHOTS:
            pg = await b.new_page(viewport={"width": 1280, "height": 900}, device_scale_factor=1.5)
            await pg.goto((R / f"{name}.html").as_uri()); await pg.wait_for_timeout(1500)
            el = await pg.query_selector(sel); await el.scroll_into_view_if_needed(); await pg.wait_for_timeout(4000)
            if click:
                await pg.evaluate("document.querySelectorAll('.evtoast').forEach(e=>e.remove())")
                await pg.click(click); await pg.wait_for_timeout(4700)
                await pg.evaluate("document.querySelectorAll('.evtoast').forEach(e=>e.style.display='none')")
            im = Image.open(io.BytesIO(await el.screenshot())).convert("RGB")
            w, h = im.size; tw = 960; im = im.resize((tw, round(h * tw / w)), Image.LANCZOS)
            th = round(tw * 9 / 16); top = max(0, (im.size[1] - th) // 2); im = im.crop((0, top, tw, top + th))
            im.save(R / f"img/fac3d_{name}.webp", "WEBP", quality=82); print(name, im.size)
            await pg.close()
        await b.close()
asyncio.run(main())
