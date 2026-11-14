"""④ 태양광 패널 셀 공장의 지식 색인: kg_solar.json · refs_solar.json · meta_solar.json. 실행: python3 build/kg_solar.py"""
import json, pathlib
B = pathlib.Path(__file__).resolve().parent
PG = "solar"; URL = "https://adminmrobo.github.io/how_to_make_ai_model_factory_version/solar.html"
MEM = "저자의 기억과 일반 서지로 옮김(2026-11-14). 쪽 미대조"
V = {"title": True, "author": True, "year": True, "container": True, "doi": False, "pages": False}
def ref(id_, type_, title, authors, year, container, extra, checked=MEM):
    r = {"id": id_, "type": type_, "title": title, "author": authors, "issued": {"date-parts": [[year]]}}
    if container: r["container-title"] = container
    r.update(extra); r["accessed"] = {"date-parts": [[2026, 11, 14]]}
    r["lab"] = {"work": "lab:work/" + id_, "role": "background", "supports": [], "locs": [], "verified": V, "checkedBy": checked}
    return r
REFS = [
 ref("montgomery2019sqc", "book", "Introduction to Statistical Quality Control", [{"family": "Montgomery", "given": "Douglas C."}], 2019, None, {"publisher": "Wiley", "edition": "8"}),
 ref("lindroos2016lid", "article-journal", "Review of light-induced degradation in crystalline silicon solar cells", [{"family": "Lindroos", "given": "Jeanette"}, {"family": "Savin", "given": "Hele"}], 2016, "Solar Energy Materials and Solar Cells", {"volume": "147", "page": "115-126"}),
 ref("aiag2010msa", "book", "Measurement Systems Analysis Reference Manual", [{"literal": "AIAG"}], 2010, None, {"edition": "4"}),
 ref("gelman2007data", "book", "Data Analysis Using Regression and Multilevel/Hierarchical Models", [{"family": "Gelman", "given": "Andrew"}, {"family": "Hill", "given": "Jennifer"}], 2007, None, {"publisher": "Cambridge University Press"}),
]
RID = {r["id"]: r for r in REFS}
N, E = [], []
def node(id_, type_, ko, en, anchor, level=1, family="evaluation", d=None):
    n = {"id": id_, "type": type_, "label": {"ko": ko, "en": en}, "page": PG, "anchor": anchor, "level": level, "status": "known",
         "confidence": "high", "coverage": "explained", "family": family, "domain": ["ai"], "match": []}
    if d: n["definition"] = {"ko": d}
    N.append(n); return id_
def edge(s, p, o, a): E.append({"s": s, "p": "lab:" + p, "o": o, "anchor": a, "confidence": "high"})
q0 = node("lab:question/condition-dependent-threshold", "Question", "조건마다 불량 판정 기준을 바꿔야 할까?", "Should defect thresholds depend on production conditions?", "#top")
line = node("lab:concept/solar-cell-line", "Concept", "태양광 셀 생산 라인 12공정", "Solar cell production line", "#plant", 1, "systems")
six = node("lab:concept/six-sigma", "Concept", "6시그마 (3.4 DPMO)", "Six Sigma", "#control", 1, d="출하 100만 개당 불량 3.4개 이하. 4.5σ 꼬리 + 관례적 1.5σ 이동.")
cpk = node("lab:metric/cpk", "Metric", "장기 공정 성능 지수 Ppk (Cpk와 구별)", "Process performance index Ppk", "#control")
dpmo = node("lab:metric/dpmo", "Metric", "DPMO와 시그마 수준", "DPMO and sigma level", "#control")
lid = node("lab:concept/light-induced-degradation", "Concept", "광열화 (LID)", "Light-induced degradation", "#control", 1, "systems", "햇빛을 처음 받을 때 효율이 떨어지는 현상. 웨이퍼 공급사마다 크기가 다르다.")
fac = node("lab:concept/condition-factors", "Concept", "분포를 옮기는 조건 (수입처·공장·교대·계절·생산량)", "Distribution-shifting conditions", "#grid", 1, "systems")
shift = node("lab:concept/shift-system", "Concept", "2교대·3교대와 인계·피로", "Two- and three-shift systems", "#shift", 2, "systems")
normal = node("lab:distribution/normal", "Concept", "정규분포 (셀 효율)", "Normal distribution", "#dist", 1, "statistics")
pois = node("lab:distribution/poisson", "Concept", "포아송 분포 (크랙 수)", "Poisson distribution", "#dist", 2, "statistics")
binom = node("lab:distribution/binomial", "Concept", "이항 분포 (표본 불량 수)", "Binomial distribution", "#dist", 2, "statistics")
tdist = node("lab:distribution/student-t", "Concept", "t 분포 (작은 표본 평균)", "Student t distribution", "#pain", 2, "statistics")
err = node("lab:concept/type-i-ii-errors", "Concept", "1종 오류(과잉 폐기)·2종 오류(유출)", "Type I and II errors", "#dist", 1, "statistics")
v1 = node("lab:model/simple-judge-v1", "Model", "AI 간이 판정기 v1 (기준 조건 회귀 + 문턱)", "Simple judge v1", "#judge", 1, "models", "기준 조건 광열화 시험 500개로 학습한 회귀 모델을 문턱 하나로 정리한 HTML 판정기.")
v2 = node("lab:model/condition-aware-judge-v2", "Model", "조건 인식 판정기 v2 (부분 풀링)", "Condition-aware judge v2", "#judge", 1, "models")
pool = node("lab:method/partial-pooling", "Method", "부분 풀링", "Partial pooling", "#pain", 1, "statistics")
spc = node("lab:method/control-chart", "Method", "관리도 (SPC)", "Control chart", "#spc", 1)
lab = node("lab:concept/label-scarcity", "Concept", "라벨 지연·부족 (광열화 시험)", "Label delay and scarcity", "#pain", 1, "data")
comb = node("lab:concept/combinatorial-explosion", "Concept", "조건 조합 폭발 (144칸)", "Combinatorial explosion of conditions", "#grid", 2)
msa = node("lab:concept/measurement-system", "Concept", "측정 시스템 잡음·드리프트", "Measurement system variation", "#pain", 2)
duel = node("lab:question/pooled-vs-per-condition", "Question", "판정 기준 하나냐, 조건마다 따로냐 (라벨 수에 따라)", "One threshold vs per-condition thresholds", "#duel", 2)
s3d = node("lab:sim/solar-factory-3d", "Simulation", "3D 태양광 셀 공장 24시간", "3D solar cell factory", "#plant", 1, "systems")
L1 = node("lab:limitation/single-quality-characteristic", "Limitation", "품질 특성을 효율·크랙 둘로 줄인 모형", "Only two quality characteristics", "#sum", 1)
for r in REFS: node("lab:work/" + r["id"], "Work", r["title"][:40], r["title"], "#export", 2, "data")
edge(q0, "relatedTo", fac, "#top"); edge(line, "demonstratedBy", s3d, "#plant"); edge(six, "evaluatedBy", dpmo, "#control"); edge(six, "evaluatedBy", cpk, "#control")
edge(fac, "raises", lid, "#control"); edge(shift, "partOf", fac, "#shift"); edge(fac, "raises", comb, "#grid"); edge(normal, "relatedTo", cpk, "#dist"); edge(pois, "relatedTo", dpmo, "#dist")
edge(binom, "relatedTo", lab, "#pain"); edge(tdist, "relatedTo", pool, "#pain"); edge(err, "relatedTo", v1, "#dist"); edge(v1, "hasLimitation", fac, "#judge"); edge(v2, "relatedTo", pool, "#pain")
edge(v2, "relatedTo", lid, "#judge"); edge(spc, "relatedTo", lid, "#spc"); edge(lab, "raises", comb, "#pain"); edge(msa, "relatedTo", v1, "#pain"); edge(duel, "relatedTo", pool, "#duel"); edge(duel, "relatedTo", lab, "#duel")
edge(line, "hasLimitation", L1, "#sum"); edge(s3d, "relatedTo", shift, "#plant")
for nid, rid, a in [(six, "montgomery2019sqc", "#control"), (spc, "montgomery2019sqc", "#spc"), (lid, "lindroos2016lid", "#control"), (msa, "aiag2010msa", "#pain"), (pool, "gelman2007data", "#pain")]:
    edge(nid, "assertedIn", "lab:work/" + rid, a); RID[rid]["lab"]["supports"].append(nid)
kg = {"version": "1.0", "page": PG, "nodes": N, "edges": E}
ids = {n["id"] for n in N}
bad = [e for e in E if e["s"] not in ids or e["o"] not in ids]
iso = [n["id"] for n in N if not any(e["s"] == n["id"] or e["o"] == n["id"] for e in E)]
print("nodes", len(N), "edges", len(E), "bad", bad, "isolated", iso)
meta = json.loads((B / "meta.json").read_text(encoding="utf-8"))
meta.update({"title": "태양광 패널 셀 생산 공장 — 6시그마와, 조건마다 달라지는 불량 판정 기준", "number": "04", "version": "1.0", "url": URL,
             "about": [six, fac, v1, v2, pool], "basedOn": [r["id"] for r in REFS],
             "suggestedCitation": "안상선 (2026). 태양광 패널 셀 생산 공장 — 6시그마와, 조건마다 달라지는 불량 판정 기준. 자율주행차 배터리 AI 공장 04, v1.0."})
for f, o in [("kg_solar.json", kg), ("refs_solar.json", REFS), ("meta_solar.json", meta)]:
    (B / f).write_text(json.dumps(o, ensure_ascii=False, indent=1), encoding="utf-8")
