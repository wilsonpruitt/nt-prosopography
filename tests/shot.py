import asyncio,sys,pathlib
ROOT=pathlib.Path(__file__).resolve().parent.parent
OUT=ROOT/"tests"/"shots"; OUT.mkdir(exist_ok=True)
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        errs=[]
        for name,w,h,scheme in [("m",390,844,"light"),("d",1280,900,"dark")]:
            ctx=await b.new_context(viewport={"width":w,"height":h},color_scheme=scheme,device_scale_factor=2 if name=="m" else 1)
            pg=await ctx.new_page(); pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("console",lambda m:errs.append(m.text) if m.type=="error" else None)
            await pg.goto("file://"+str(ROOT/"dist"/"index.html")); await pg.wait_for_timeout(1200)
            await pg.screenshot(path=OUT/f"{name}_1.png")
            await pg.click('.sample .nm[data-p="sosipater"]'); await pg.wait_for_timeout(500)
            await pg.screenshot(path=OUT/f"{name}_2.png")
            if name=="m": await pg.click("#close")
            await pg.click('.dot[data-p="mark"] >> nth=0'); await pg.wait_for_timeout(400)
            await pg.evaluate("document.querySelector('#threads').scrollIntoView()"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=OUT/f"{name}_3.png")
            if name=="m": await pg.click("#close")
            await pg.click("#t-grid"); await pg.evaluate("document.querySelector('.tabs').scrollIntoView()"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=OUT/f"{name}_4.png")
            await pg.click("#t-books"); await pg.click('[data-verses="COL"]'); await pg.evaluate("document.querySelector('#book-COL').scrollIntoView()"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=OUT/f"{name}_5.png")
            sw=await pg.evaluate("document.documentElement.scrollWidth"); print(name,"scrollWidth",sw,"vs",w)
        print("errors:",errs); await b.close()
asyncio.run(main())
