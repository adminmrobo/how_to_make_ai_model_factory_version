"""⑤ 배터리 열폭주 실험 랩의 지식 색인: kg_blast.json · refs_blast.json · meta_blast.json. 실행: python3 build/kg_blast.py"""
import json, pathlib
B = pathlib.Path(__file__).resolve().parent
PG = "blast"; URL = "https://adminmrobo.github.io/how_to_make_ai_model_factory_version/blast.html"
MEM = "저자의 기억과 일반 서지로 옮김(2026-11-17). 쪽 미대조"
V = {"title": True, "author": True, "year": True, "container": True, "doi": False, "pages": False}
def ref(id_, type_, title, authors, year, container, extra, checked=MEM):
    r = {"id": id_, "type": type_, "title": title, "author": authors, "issued": {"date-parts": [[year]]}}
    if container: r["container-title"] = container
    r.update(extra); r["accessed"] = {"date-parts": [[2026, 11, 17]]}
    r["lab"] = {"work": "lab:work/" + id_, "role": "background", "supports": [], "locs": [], "verified": V, "checkedBy": checked}
    return r
REFS = [
 ref("mbc2026thermalrunaway", "article-newspaper", "\"저 배터리는 불이 안 나네?\"‥실험으로 밝힌 '열폭주'의 비밀", [{"family": "이", "given": "재인"}], 2026, "MBC 뉴스데스크", {"URL": "https://v.daum.net/v/20261116204011953", "issued": {"date-parts": [[2026, 11, 16]]}}, checked="기사 페이지 확인(2026-11-17), 조건·결과만 사례로 사용"),
 ref("mccullagh1980ordinal", "article-journal", "Regression models for ordinal data", [{"family": "McCullagh", "given": "Peter"}], 1980, "Journal of the Royal Statistical Society: Series B", {"volume": "42", "issue": "2", "page": "109-142"}),
 ref("albert1984existence", "article-journal", "On the existence of maximum likelihood estimates in logistic regression models", [{"family": "Albert", "given": "A."}, {"family": "Anderson", "given": "J. A."}], 1984, "Biometrika", {"volume": "71", "issue": "1", "page": "1-10"}),
 ref("firth1993bias", "article-journal", "Bias reduction of maximum likelihood estimates", [{"family": "Firth", "given": "David"}], 1993, "Biometrika", {"volume": "80", "issue": "1", "page": "27-38"}),
 ref("feng2018thermal", "article-journal", "Thermal runaway mechanism of lithium ion battery for electric vehicles: A review", [{"family": "Feng", "given": "Xuning"}], 2018, "Energy Storage Materials", {"volume": "10", "page": "246-267"}),
]
RID = {r["id"]: r for r in REFS}
N, E = [], []
def node(id_, type_, ko, en, anchor, level=1, family="evaluation", d=None):
    n = {"id": id_, "type": type_, "label": {"ko": ko, "en": en}, "page": PG, "anchor": anchor, "level": level, "status": "known", "confidence": "high", "coverage": "explained", "family": family, "domain": ["ai"], "match": []}
    if d: n["definition"] = {"ko": d}
    N.append(n); return id_
def edge(s, p, o, a): E.append({"s": s, "p": "lab:" + p, "o": o, "anchor": a, "confidence": "high"})
q = node("lab:question/soc-fire-probability", "Question", "충전율에 따라 화재 확률은 어떻게 변하나?", "How does state of charge change fire probability?", "#top")
tr = node("lab:concept/thermal-runaway", "Concept", "열폭주", "Thermal runaway", "#news", 1, "systems", "충격·과열로 셀 안 반응이 스스로 열을 내며 온도가 급격히 오르는 현상.")
case = node("lab:dataset/crush-test-news-case", "Dataset", "뉴스 사례: 1,300 kg 압착, 충전율 100·70·50·30%", "News case: crush test", "#news", 1, "data")
soc = node("lab:concept/state-of-charge", "Concept", "충전율 (SOC)", "State of charge", "#news", 1, "systems")
lr = node("lab:model/ordinal-logistic", "Model", "비례 오즈 로지스틱 (없음<연기<화염)", "Proportional-odds logistic model", "#logit", 1, "models")
odds = node("lab:concept/odds-ratio", "Concept", "오즈와 오즈 배수", "Odds and odds ratio", "#logit", 2, "statistics")
sep = node("lab:concept/complete-separation", "Concept", "완전 분리", "Complete separation", "#sep", 1, "statistics", "입력으로 결과가 완벽히 갈려 최대우도 기울기가 무한대가 되는 상황.")
reg = node("lab:method/l2-regularization", "Method", "L2 규제", "L2 regularization", "#sep", 2)
firth = node("lab:method/firth-correction", "Method", "Firth 보정", "Firth bias reduction", "#sep", 2)
rep = node("lab:method/repeated-trials-near-boundary", "Method", "경계 근처 반복 실험", "Repeated trials near the boundary", "#lab", 1)
ll = node("lab:metric/log-loss", "Metric", "로그 손실", "Log loss", "#duel", 2)
pol = node("lab:concept/soc-storage-policy", "Concept", "보관·유통 충전율 기준 (항공 30% 이하)", "SOC limits for storage and shipping", "#policy", 1, "systems")
s3d = node("lab:sim/blast-lab-3d", "Simulation", "3D 방폭 시험실", "3D blast-proof test room", "#lab", 1, "systems")
lim = node("lab:limitation/assumed-true-model", "Limitation", "참 모형은 뉴스 방향에 맞춘 가정", "Assumed true model", "#sum", 1)
for r in REFS: node("lab:work/" + r["id"], "Work", r["title"][:40], r["title"], "#export", 2, "data")
edge(q, "relatedTo", soc, "#top"); edge(case, "relatedTo", tr, "#news"); edge(case, "raises", sep, "#sep"); edge(lr, "relatedTo", odds, "#logit"); edge(sep, "relatedTo", lr, "#sep")
edge(reg, "relatedTo", sep, "#sep"); edge(firth, "relatedTo", sep, "#sep"); edge(rep, "relatedTo", sep, "#lab"); edge(s3d, "demonstratedBy", rep, "#lab"); edge(lr, "evaluatedBy", ll, "#duel")
edge(pol, "relatedTo", lr, "#policy"); edge(soc, "relatedTo", tr, "#news"); edge(lr, "hasLimitation", lim, "#sum")
for nid, rid, a in [(case, "mbc2026thermalrunaway", "#news"), (pol, "mbc2026thermalrunaway", "#policy"), (lr, "mccullagh1980ordinal", "#logit"), (sep, "albert1984existence", "#sep"), (firth, "firth1993bias", "#sep"), (tr, "feng2018thermal", "#sum")]:
    edge(nid, "assertedIn", "lab:work/" + rid, a); RID[rid]["lab"]["supports"].append(nid)
kg = {"version": "1.0", "page": PG, "nodes": N, "edges": E}
ids = {n["id"] for n in N}; iso = [n["id"] for n in N if not any(e["s"] == n["id"] or e["o"] == n["id"] for e in E)]
print("nodes", len(N), "edges", len(E), "isolated", iso)
meta = json.loads((B / "meta.json").read_text(encoding="utf-8"))
meta.update({"title": "배터리 열폭주 실험 랩 — 충전율과 화재 확률을 로지스틱 모델로", "number": "05", "version": "1.0", "url": URL, "about": [tr, lr, sep, pol], "basedOn": [r["id"] for r in REFS],
             "suggestedCitation": "안상선 (2026). 배터리 열폭주 실험 랩 — 충전율과 화재 확률을 로지스틱 모델로. 자율주행차 배터리 AI 공장 05, v1.0."})
for f, o in [("kg_blast.json", kg), ("refs_blast.json", REFS), ("meta_blast.json", meta)]:
    (B / f).write_text(json.dumps(o, ensure_ascii=False, indent=1), encoding="utf-8")
