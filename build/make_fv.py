"""공장 복장·동작 벡터(fruitfly-lab-expressions/images/factory)에서 페이지별 캐릭터 그림을 골라 작은 webp(base64)로 묶는다.
실행: python3 build/make_fv.py → build/fv_factory.js · fv_solar.js · fv_testlab.js"""
import base64, io, json, pathlib
from PIL import Image
B = pathlib.Path(__file__).resolve().parent
SRC = pathlib.Path("/home/claude/fruitfly-lab-expressions")
F = json.loads((SRC / "specs/factory/factory.json").read_text(encoding="utf-8"))["files"]
KEY = {"doc": "doctor", "asst": "haru", "sia": "sia", "moa": "moa", "robo": "jupanbot", "fly": "fruitfly"}
PICK = {  # 페이지 → 캐릭터 → 복장(U)·동작(P) ID
 "classifier": {"asst": "P11", "sia": "P03", "moa": "P05", "robo": "P08", "fly": "P04", "doc": "P15"},
 "regression": {"asst": "P02", "sia": "P13", "moa": "P05", "robo": "P08", "fly": "P04", "doc": "P10"},
 "blast": {"asst": "P05", "sia": "U03", "moa": "P02", "robo": "P06", "fly": "P13", "doc": "P13"},
 "factory": {"asst": "P02", "sia": "P03", "moa": "P07", "robo": "P08", "fly": "P04", "doc": "P09"},
 "solar":   {"asst": "P12", "sia": "U02", "moa": "U02", "robo": "U02", "fly": "U02", "doc": "P10"},
 "testlab": {"asst": "P03", "sia": "P04", "moa": "P16", "robo": "P14", "fly": "U05", "doc": "P15"},
}
NOTE = {}
for page, pk in PICK.items():
    out = {}
    for who, i in pk.items():
        kind = "wear" if i.startswith("U") else "pose"; rec = F[KEY[who]][kind][i]
        im = Image.open(SRC / rec["file"]).convert("RGBA"); im = im.crop(im.getbbox())
        h = 200; im = im.resize((max(1, round(im.width * h / im.height)), h), Image.LANCZOS)
        buf = io.BytesIO(); im.save(buf, "WEBP", quality=88); out[who] = {"id": i, "src": "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()}
    js = ("/* 공장 복장·동작 벡터 v1.0 (fruitfly-lab-expressions specs/factory) — " + page + ": " + ", ".join(f"{k} {v['id']}" for k, v in out.items()) + " */\n"
          "var FVIMG={};(function(){var D=" + json.dumps({k: v["src"] for k, v in out.items()}) + ";Object.keys(D).forEach(function(k){var im=new Image();im.src=D[k];FVIMG[k]=im;});})();\n"
          "function FVdraw(g,who,t,x,y,h){var im=FVIMG[who];if(!im||!im.complete||!im.naturalWidth)return false;var hh=h*0.92,bob=Math.sin(t*2.2+x*0.05)*hh*0.012,w=hh*im.naturalWidth/im.naturalHeight;g.drawImage(im,x-w/2,y-hh+bob,w,hh);return true;}\n")
    (B / f"fv_{page}.js").write_text(js, encoding="utf-8"); print(page, round(len(js) / 1024), "KB")
