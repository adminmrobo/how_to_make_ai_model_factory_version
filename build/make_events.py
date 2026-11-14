"""공장 이벤트(과부하·불량 대량 발생 등) 알림용 그림과 목록 → build/hub_events.js. 실행: python3 build/make_events.py"""
import base64, io, json, pathlib
from PIL import Image
B = pathlib.Path(__file__).resolve().parent
SRC = pathlib.Path("/home/claude/fruitfly-lab-expressions")
F = json.loads((SRC / "specs/factory/factory.json").read_text(encoding="utf-8"))["files"]
EV = [
 dict(key="overload", fac="factory", lv="r", fx="siren", who=("jupanbot", "P06"), title="과부하 경보 — 화성 공정 병목",
      text="속도를 1.3배로 올리자 병목인 화성 앞에 셀이 산처럼 쌓입니다. 주판봇이 비상정지 버튼을 눌렀어요!", link="factory.html#bottleneck", go="③ 병목 보러 가기"),
 dict(key="heat", fac="factory", lv="r", fx="heat", who=("sia", "P13"), title="고열 경보 — 기계 60 °C 돌파",
      text="24시간 쉬지 않고 돌린 라인에서 센서가 거짓말을 시작했습니다. 냉각 1단이면 라벨 오기율이 10%를 넘어요.", link="factory.html#heat", go="③ 24시간·열 보러 가기"),
 dict(key="power", fac="factory", lv="a", fx="bolt", who=("moa", "P05"), title="전기료 피크 — 최대부하 시간대",
      text="지금 전기 요금이 kWh당 210원(최대부하, 예시값)입니다. 건조 오븐을 이 시간에 돌리면 하루 이익이 쑥 빠져요.", link="factory.html#power", go="③ 전기료 보러 가기"),
 dict(key="defects", fac="solar", lv="r", fx="tags", who=("haru", "P14"), title="불량품 대량 발생!",
      text="신규 수입처 C · 1공장 · 2교대 · 여름 · 가동률 100%. 공정이 3.2σ까지 떨어지고, 기준 조건 판정기를 그대로 쓰면 약 4만 3천 DPMO가 샙니다.", link="solar.html#grid", go="④ 조건 지도 보러 가기"),
 dict(key="supplier", fac="solar", lv="a", fx="question", who=("fruitfly", "P04"), title="신규 수입처 웨이퍼 입고 — 라벨 0개",
      text="공급사 C의 광열화 시험 라벨이 아직 하나도 없습니다. 판정기가 C를 A처럼 보고 있어요. 첫 주가 제일 위험합니다.", link="solar.html#pain", go="④ 현장의 고충 보러 가기"),
 dict(key="handover", fac="solar", lv="a", fx="clock", who=("doctor", "P09"), title="교대 인계 직후 — 품질 흔들림",
      text="06·14·22시 인계 직후 한 시간은 효율 분포의 꼬리가 두꺼워집니다. 인계 체크리스트를 다시 확인하세요.", link="solar.html#shift", go="④ 교대 방식 보러 가기"),
 dict(key="labgap", fac="testlab", lv="a", fx="drop", who=("jupanbot", "P15"), title="랩 점수의 배신 — 99% → 90%",
      text="랩에서 99.2%를 받은 생선 분류 장비가 진짜 물고기 앞에서 89.9%를 받았습니다. 주판봇의 엄지가 무색해졌어요.", link="testlab.html#gap", go="랩실 함정 보러 가기"),
 dict(key="qcfail", fac="classifier", lv="r", fx="xlamp", who=("sia", "P14"), title="시운전 QC 불합격 램프",
      text="엔진을 단 판정기가 벤치 시운전에서 불합격 램프를 켰습니다. 정비 작업장으로 돌려보내 다시 손봅니다.", link="classifier.html#factory", go="① 판정기 공장 보러 가기"),
 dict(key="kiln", fac="cement", lv="a", fx="smoke", who=("doctor", "P13"), title="이웃 시멘트 공장 — 킬른 37분 지연",
      text="옆 공장의 킬른이 37분 늦어졌다는 소식입니다. 박사가 방열복을 입고 지원 나갑니다.", link="https://adminmrobo.github.io/smart_factory_world/cement/", go="시멘트 공장 보러 가기"),
]
out = []
for e in EV:
    w, i = e["who"]; kind = "wear" if i.startswith("U") else "pose"
    im = Image.open(SRC / F[w][kind][i]["file"]).convert("RGBA"); im = im.crop(im.getbbox())
    h = 220; im = im.resize((max(1, round(im.width * h / im.height)), h), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, "WEBP", quality=88)
    e2 = dict(e); e2["who"] = f"{w} {i}"; e2["spr"] = "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode(); out.append(e2)
(B / "hub_events_data.js").write_text("var EVENTS=" + json.dumps(out, ensure_ascii=False) + ";\n", encoding="utf-8")
print(len(out), round(len(json.dumps(out)) / 1024), "KB")
