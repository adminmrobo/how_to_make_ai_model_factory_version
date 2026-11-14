"""3편 배터리 생산 공장의 지식 색인: kg_fac.json · refs_fac.json · meta_fac.json. 실행: python3 build/kg_fac.py"""
import json, pathlib
B = pathlib.Path(__file__).resolve().parent
PG = "factory"; TODAY = "2026-11-14"; URL = "https://adminmrobo.github.io/how_to_make_ai_model_factory_version/factory.html"
MEM = "저자의 기억과 일반 서지로 옮김(2026-11-14). 쪽 미대조"
V = {"title": True, "author": True, "year": True, "container": True, "doi": False, "pages": False}
def ref(id_, type_, title, authors, year, container, extra, verified=V, checked=MEM):
    r = {"id": id_, "type": type_, "title": title, "author": authors, "issued": {"date-parts": [[year]]}}
    if container: r["container-title"] = container
    r.update(extra); r["accessed"] = {"date-parts": [[2026, 11, 14]]}
    r["lab"] = {"work": "lab:work/" + id_, "role": "background", "supports": [], "locs": [], "verified": verified, "checkedBy": checked}
    return r
REFS = [
 ref("kwade2018current", "article-journal", "Current status and challenges for automotive battery production technologies",
     [{"family": "Kwade", "given": "Arno"}, {"family": "Haselrieder", "given": "Wolfgang"}, {"family": "Leithoff", "given": "Ruben"}, {"family": "Modlinger", "given": "Armin"}, {"family": "Dietrich", "given": "Franz"}, {"family": "Droeder", "given": "Klaus"}],
     2018, "Nature Energy", {"volume": "3", "issue": "4", "page": "290-300", "DOI": "10.1038/s41560-018-0130-3"},
     verified={"title": True, "author": True, "year": True, "container": True, "doi": True, "pages": True}, checked="웹 검색(ADS·RePEc 서지)으로 확인(2026-11-14)"),
 ref("goldratt1984goal", "book", "The Goal: A Process of Ongoing Improvement", [{"family": "Goldratt", "given": "Eliyahu M."}, {"family": "Cox", "given": "Jeff"}], 1984, None, {"publisher": "North River Press"}),
 ref("little1961proof", "article-journal", "A proof for the queuing formula: L = λW", [{"family": "Little", "given": "John D. C."}], 1961, "Operations Research", {"volume": "9", "issue": "3", "page": "383-387"}),
 ref("ahmed2016energy", "article-journal", "Energy impact of cathode drying and solvent recovery during lithium-ion battery manufacturing",
     [{"family": "Ahmed", "given": "Shabbir"}, {"family": "Nelson", "given": "Paul A."}, {"family": "Gallagher", "given": "Kevin G."}, {"family": "Dees", "given": "Dennis W."}], 2016, "Journal of Power Sources", {"volume": "322", "page": "169-178"},
     checked="Kwade 외(2018)의 참고문헌 목록에서 서지 확인(2026-11-14)"),
]
RID = {r["id"]: r for r in REFS}
N, E = [], []
def node(id_, type_, ko, en, anchor, level=1, family="systems", d=None, src=None):
    n = {"id": id_, "type": type_, "label": {"ko": ko, "en": en}, "page": PG, "anchor": anchor, "level": level, "status": "known",
         "confidence": "high", "coverage": "explained", "family": family, "domain": ["ai"], "match": []}
    if d: n["definition"] = {"ko": d}
    if src: n["source"] = [{"ref": s, "loc": ""} for s in src]
    N.append(n); return id_
def edge(s, p, o, a): E.append({"s": s, "p": "lab:" + p, "o": o, "anchor": a, "confidence": "high"})

line = node("lab:concept/automated-cell-line", "Concept", "완전 자동화 셀 생산 라인", "Fully automated battery cell line", "#plant", 1, d="믹싱부터 에이징·검사까지 10공정이 사람 없이 이어지는 라인(설명용 모형).", src=["kwade2018current"])
proc = {}
for k, ko, en, d in [("mixing", "믹싱", "Mixing", "활물질·도전재·바인더를 섞어 슬러리를 만든다."), ("coating", "코팅", "Coating", "슬러리를 집전체에 얇게 바른다."), ("drying", "건조", "Drying", "용매를 날린다. 전력을 많이 쓴다."),
                     ("calendering", "압연", "Calendering", "전극을 눌러 두께·밀도를 맞춘다."), ("slitting", "슬리팅", "Slitting", "전극을 폭에 맞게 자른다."), ("stacking", "적층", "Stacking", "양극·분리막·음극을 쌓는다."),
                     ("sealing", "조립·실링", "Assembly and sealing", "파우치에 넣고 봉한다."), ("filling", "전해액 주입", "Electrolyte filling", "드라이룸에서 전해액을 넣는다."),
                     ("formation", "화성", "Formation", "처음 충·방전으로 셀을 활성화한다. 오래 걸려 병목이 되기 쉽다."), ("eol", "에이징·검사·라벨", "Aging, end-of-line test and labeling", "전압 변화로 숨은 불량을 찾고 라벨을 붙인다.")]:
    proc[k] = node("lab:process/" + k, "Method", ko, en, "#line", 2, d=d, src=["kwade2018current"])
ks = list(proc.values())
for a, b in zip(ks, ks[1:]): edge(a, "prerequisiteOf", b, "#line")
for x in ks: edge(x, "partOf", line, "#plant")
bn = node("lab:concept/bottleneck", "Concept", "병목", "Bottleneck", "#bottleneck", 1, d="가장 느린 공정. 라인 전체 생산량을 정한다.", src=["goldratt1984goal"])
wip = node("lab:concept/work-in-process", "Concept", "재공품", "Work in process", "#bottleneck", 1, d="라인 위에 쌓인 미완성 제품. 재료비가 묶인다.")
util = node("lab:metric/utilization", "Metric", "가동률", "Utilization", "#bottleneck", 1, "evaluation")
little = node("lab:concept/littles-law", "Concept", "리틀의 법칙", "Little's law", "#bottleneck", 2, d="L = λW. 대기 수 = 도착률 × 머무는 시간.", src=["little1961proof"])
dr = node("lab:metric/defect-rate", "Metric", "공정 불량률", "Process defect rate", "#defect", 1, "evaluation")
esc = node("lab:metric/escape-rate", "Metric", "출하 유출률", "Escape rate", "#defect", 2, "evaluation", d="검사를 빠져나간 불량의 비율.")
heat = node("lab:concept/thermal-buildup", "Concept", "열 누적", "Thermal buildup", "#heat", 1, d="빠르게·오래 돌릴수록 기계 온도가 오르고, 쉬는 시간에 식는다.")
sens = node("lab:concept/sensor-misrecording", "Concept", "센서 오기", "Sensor mis-recording", "#heat", 2, d="고열 등으로 센서 값이 잘못 기록되는 것. 치우침·멈춤·자리 바뀜.")
lab = node("lab:concept/cell-traceability-label", "Concept", "셀 라벨 (이력 기록)", "Cell traceability label", "#label", 1, d="셀 번호에 묶인 공정별 센서 값 18개. 판정기·예측 장치의 학습 데이터 한 줄.")
lerr = node("lab:metric/label-error-rate", "Metric", "라벨 오기율", "Label error rate", "#label", 1, "evaluation")
poll = node("lab:concept/data-contamination", "Concept", "데이터 오염", "Data contamination", "#label", 2, d="잘못 기록된 값이 학습 데이터에 섞이는 것.")
tou = node("lab:concept/time-of-use-tariff", "Concept", "시간대별 요금", "Time-of-use tariff", "#power", 1, d="시간대마다 kWh 단가가 다른 요금(이 페이지 값은 예시).")
dry = node("lab:concept/dry-room-energy", "Concept", "건조·드라이룸 에너지", "Drying and dry-room energy", "#power", 2, src=["ahmed2016energy"])
obj = node("lab:concept/objective-function", "Concept", "목표 함수 (하루 이익)", "Objective function", "#optimize", 1, "optimization")
con = node("lab:concept/constraint", "Concept", "제약 (라벨 오기율 3% 이하)", "Constraint", "#optimize", 1, "optimization")
gs = node("lab:method/grid-search", "Method", "격자 탐색", "Grid search", "#optimize", 1, "optimization", d="11,440가지 운전 조건을 모두 계산.")
curse = node("lab:concept/curse-of-dimensionality", "Concept", "차원의 저주", "Curse of dimensionality", "#optimize", 2, "optimization")
flat = node("lab:concept/flat-optimum", "Concept", "평평한 꼭대기", "Flat optimum", "#optimize", 2, "optimization", d="상위 설정들의 이익 차이가 작아 답이 여럿인 상태.")
sim = node("lab:sim/battery-factory-7day", "Simulation", "7일 공장 시뮬레이션 (1시간 단위)", "Seven-day hourly factory simulation", "#control", 1)
s3d = node("lab:sim/battery-factory-3d", "Simulation", "3D 배터리 생산 공장 12칸", "3D battery factory", "#plant", 1)
kit = node("lab:sim/optimization-kit", "Simulation", "최적화 실습 키트 (미션 5개·기록지)", "Optimization practice kit", "#kit", 1)
duel = node("lab:question/night-vs-24h", "Question", "밤 16시간이냐 24시간이냐 (냉각에 따라)", "Night 16h vs 24h operation", "#duel", 2)
q0 = node("lab:question/battery-factory-optimization", "Question", "자동화 배터리 공장을 어떻게 돌려야 가장 남을까?", "How to run an automated battery factory?", "#top", 1)
eng1 = node("lab:task/defect-judge-link", "Task", "① 불량품 판정기의 학습 데이터", "Training data for the defect judge", "#label", 1)
eng2 = node("lab:task/life-predictor-link", "Task", "② 수명 예측 장치의 학습 데이터", "Training data for the life predictor", "#label", 1)
an1 = node("lab:analogy/hyperparameter-as-operating-condition", "Analogy", "운전 조건 ↔ 하이퍼파라미터", "Operating conditions ↔ hyperparameters", "#sum", 1)
L1 = node("lab:limitation/hourly-fluid-model", "Limitation", "1시간 평균 흐름 모형 — 고장·교체 없음", "Hourly fluid approximation", "#sum", 1)
for r in REFS: node("lab:work/" + r["id"], "Work", r["title"][:40], r["title"], "#export", 2)

edge(proc["formation"], "relatedTo", bn, "#bottleneck"); edge(bn, "evaluatedBy", util, "#bottleneck"); edge(bn, "raises", wip, "#bottleneck"); edge(wip, "relatedTo", little, "#bottleneck")
edge(heat, "relatedTo", dr, "#heat"); edge(heat, "raises", sens, "#heat"); edge(sens, "relatedTo", lab, "#label"); edge(lab, "evaluatedBy", lerr, "#label"); edge(sens, "raises", poll, "#label")
edge(lerr, "relatedTo", esc, "#defect"); edge(dr, "relatedTo", esc, "#defect")
edge(lab, "prerequisiteOf", eng1, "#label"); edge(lab, "prerequisiteOf", eng2, "#label"); edge(poll, "relatedTo", eng1, "#label")
edge(tou, "relatedTo", obj, "#power"); edge(dry, "relatedTo", proc["drying"], "#power"); edge(dry, "relatedTo", tou, "#power")
edge(gs, "solves", obj, "#optimize"); edge(con, "relatedTo", obj, "#optimize"); edge(con, "relatedTo", lerr, "#optimize"); edge(gs, "hasLimitation", curse, "#optimize"); edge(gs, "raises", flat, "#optimize")
edge(line, "demonstratedBy", s3d, "#plant"); edge(line, "demonstratedBy", sim, "#control"); edge(obj, "demonstratedBy", kit, "#kit"); edge(bn, "demonstratedBy", kit, "#kit")
edge(duel, "relatedTo", heat, "#duel"); edge(duel, "relatedTo", con, "#duel"); edge(q0, "relatedTo", line, "#top"); edge(an1, "analogyOf", gs, "#sum"); edge(sim, "hasLimitation", L1, "#sum")
for nid, rid, a in [(line, "kwade2018current", "#plant"), (bn, "goldratt1984goal", "#bottleneck"), (little, "little1961proof", "#bottleneck"), (dry, "ahmed2016energy", "#power")]:
    edge(nid, "assertedIn", "lab:work/" + rid, a); RID[rid]["lab"]["supports"].append(nid)
for x in ks: RID["kwade2018current"]["lab"]["supports"].append(x)
kg = {"version": "1.0", "page": PG, "nodes": N, "edges": E}
ids = {n["id"] for n in N}
bad = [e for e in E if e["s"] not in ids or (e["o"] not in ids and not e["o"].startswith("lab:topic/"))]
iso = [n["id"] for n in N if not any(e["s"] == n["id"] or e["o"] == n["id"] for e in E)]
print("nodes", len(N), "edges", len(E), "bad", bad, "isolated", iso)
meta = json.loads((B / "meta.json").read_text(encoding="utf-8"))
meta.update({"title": "배터리 생산 공장 — 완전 자동화 라인 시뮬레이션과 최적화 실습 키트", "number": "03", "version": "1.0", "url": URL,
             "about": [line, bn, heat, lab, obj, gs], "basedOn": [r["id"] for r in REFS],
             "suggestedCitation": "안상선 (2026). 배터리 생산 공장 — 완전 자동화 라인 시뮬레이션과 최적화 실습 키트. 자율주행차 배터리 AI 공장 03, v1.0."})
for f, o in [("kg_fac.json", kg), ("refs_fac.json", REFS), ("meta_fac.json", meta)]:
    (B / f).write_text(json.dumps(o, ensure_ascii=False, indent=1), encoding="utf-8")
