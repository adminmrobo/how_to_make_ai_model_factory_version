"""시제품 테스트 랩실의 지식 색인: kg_test.json · refs_test.json · meta_test.json. 실행: python3 build/kg_test.py"""
import json, pathlib
B = pathlib.Path(__file__).resolve().parent
PG = "testlab"; URL = "https://adminmrobo.github.io/how_to_make_ai_model_factory_version/testlab.html"
MEM = "저자의 기억과 일반 서지로 옮김(2026-11-14). 쪽 미대조"
V = {"title": True, "author": True, "year": True, "container": True, "doi": False, "pages": False}
def ref(id_, type_, title, authors, year, container, extra, checked=MEM):
    r = {"id": id_, "type": type_, "title": title, "author": authors, "issued": {"date-parts": [[year]]}}
    if container: r["container-title"] = container
    r.update(extra); r["accessed"] = {"date-parts": [[2026, 11, 14]]}
    r["lab"] = {"work": "lab:work/" + id_, "role": "background", "supports": [], "locs": [], "verified": V, "checkedBy": checked}
    return r
REFS = [
 ref("pyae2019fishmarket", "dataset", "Fish Market", [{"family": "Pyae", "given": "Aung"}], 2019, "Kaggle", {}, checked="사용자 제공 교안·노트북의 데이터 출처 표기(2026-11-14)"),
 ref("park2020honggong", "book", "혼자 공부하는 머신러닝+딥러닝", [{"family": "박", "given": "해선"}], 2020, None, {"publisher": "한빛미디어"}, checked="사용자 제공 교안의 출처 표기(2026-11-14)"),
 ref("kohavi1995study", "paper-conference", "A study of cross-validation and bootstrap for accuracy estimation and model selection", [{"family": "Kohavi", "given": "Ron"}], 1995, "Proceedings of IJCAI 1995", {"page": "1137-1143"}),
 ref("cawley2010overfitting", "article-journal", "On over-fitting in model selection and subsequent selection bias in performance evaluation", [{"family": "Cawley", "given": "Gavin C."}, {"family": "Talbot", "given": "Nicola L. C."}], 2010, "Journal of Machine Learning Research", {"volume": "11", "page": "2079-2107"}),
 ref("kaufman2012leakage", "article-journal", "Leakage in data mining: Formulation, detection, and avoidance", [{"family": "Kaufman", "given": "Shachar"}, {"family": "Rosset", "given": "Saharon"}, {"family": "Perlich", "given": "Claudia"}, {"family": "Stitelman", "given": "Ori"}], 2012, "ACM Transactions on Knowledge Discovery from Data", {"volume": "6", "issue": "4"}),
 ref("pedregosa2011scikit", "article-journal", "Scikit-learn: Machine learning in Python", [{"family": "Pedregosa", "given": "Fabian"}], 2011, "Journal of Machine Learning Research", {"volume": "12", "page": "2825-2830"}),
]
RID = {r["id"]: r for r in REFS}
N, E = [], []
def node(id_, type_, ko, en, anchor, level=1, family="evaluation", d=None):
    n = {"id": id_, "type": type_, "label": {"ko": ko, "en": en}, "page": PG, "anchor": anchor, "level": level, "status": "known",
         "confidence": "high", "coverage": "explained", "family": family, "domain": ["ai"], "match": []}
    if d: n["definition"] = {"ko": d}
    N.append(n); return id_
def edge(s, p, o, a): E.append({"s": s, "p": "lab:" + p, "o": o, "anchor": a, "confidence": "high"})
q0 = node("lab:question/lab-vs-field-score", "Question", "랩 점수 99%는 진짜 물고기 앞에서 몇 점일까?", "How does a lab score hold up in a field test?", "#top")
dev = node("lab:task/fish-species-sorter", "Task", "생선 통조림 분류 장비 (7어종 다중 분류)", "Fish species sorter for a cannery", "#line", 1, "systems", "길이·대각선·높이·두께로 7어종을 가려 통조림 라인으로 보내는 장비.")
ds = node("lab:dataset/fish-market", "Dataset", "Fish Market (원본 158 + 늘린 1,422)", "Fish Market dataset, augmented x10", "#sample", 1, "data")
aug = node("lab:concept/data-augmentation", "Concept", "데이터 증강", "Data augmentation", "#sample", 2, "data", "원본을 조금씩 바꿔 시료를 늘리는 것. 늘린 시료는 원본과 닮았다.")
split = node("lab:method/train-validation-test-split", "Method", "훈련·검증·봉인 시험 나누기", "Train/validation/test split", "#sum", 1)
cv = node("lab:method/cross-validation", "Method", "5겹 교차검증 (랩 점수)", "Five-fold cross-validation", "#build", 1)
test = node("lab:method/held-out-field-test", "Method", "봉인 시료 실제 테스트", "Held-out field test", "#test", 1)
cm = node("lab:metric/confusion-matrix", "Metric", "혼동 행렬", "Confusion matrix", "#test", 1)
ll = node("lab:metric/log-loss", "Metric", "로그 손실", "Log loss", "#test", 2)
acc = node("lab:metric/accuracy", "Metric", "정확도", "Accuracy", "#test", 1)
leak = node("lab:concept/data-leakage", "Concept", "데이터 누수", "Data leakage", "#gap", 1, d="검증에 쓰면 안 되는 정보(닮은 형제 시료)가 학습에 섞여 점수가 부푸는 일.")
sb = node("lab:concept/selection-bias", "Concept", "모델 선택의 선택 편향", "Selection bias in model selection", "#gap", 1, d="여러 후보 중 최고 점수를 고르면 그 점수에 운이 섞여 부푼다.")
lr = node("lab:model/logistic-regression", "Model", "로지스틱 회귀", "Logistic regression", "#build", 2, "models")
knn = node("lab:model/knn", "Model", "KNN", "k-nearest neighbors", "#build", 2, "models")
svc = node("lab:model/svc", "Model", "SVC (linear · rbf)", "Support vector classifier", "#build", 2, "models")
std = node("lab:method/standard-scaler", "Method", "표준화 (StandardScaler)", "Standardization", "#build", 2)
s3d = node("lab:sim/fish-test-line-3d", "Simulation", "3D 시험 라인 12칸", "3D fish test line", "#line", 1, "systems")
ter = node("lab:sim/decision-confidence-terrain", "Simulation", "판정 확신도 3D 지형 (Surf3D)", "Decision confidence terrain", "#terrain", 1, "systems")
duel = node("lab:question/peek-vs-cv-selection", "Question", "시험지를 엿보고 고르기 vs 랩 점수로 고르기", "Peeking vs cross-validated selection", "#duel", 2)
nxt = node("lab:task/defect-judge-field-test", "Task", "① 배터리 불량품 판정기의 실제 테스트", "Field test of the battery defect judge", "#next", 1, "systems")
L1 = node("lab:limitation/augmented-similarity", "Limitation", "봉인 시료도 늘린 시료와 닮아 실제 테스트가 쉬워질 수 있음", "Held-out originals resemble augmented rows", "#sum", 1)
for r in REFS: node("lab:work/" + r["id"], "Work", r["title"][:40], r["title"], "#export", 2, "data")
edge(q0, "relatedTo", test, "#top"); edge(dev, "evaluatedBy", test, "#line"); edge(dev, "demonstratedBy", s3d, "#line"); edge(ds, "relatedTo", aug, "#sample")
edge(split, "prerequisiteOf", cv, "#sum"); edge(split, "prerequisiteOf", test, "#sum"); edge(cv, "relatedTo", leak, "#gap"); edge(aug, "raises", leak, "#gap")
edge(cv, "raises", sb, "#gap"); edge(test, "evaluatedBy", cm, "#test"); edge(test, "evaluatedBy", acc, "#test"); edge(test, "evaluatedBy", ll, "#test")
for m in (lr, knn, svc): edge(m, "partOf", dev, "#build"); edge(std, "prerequisiteOf", m, "#build")
edge(ter, "relatedTo", lr, "#terrain"); edge(ter, "relatedTo", cm, "#terrain"); edge(duel, "relatedTo", sb, "#duel"); edge(duel, "relatedTo", leak, "#duel")
edge(nxt, "relatedTo", test, "#next"); edge(test, "hasLimitation", L1, "#sum"); edge(ds, "partOf", dev, "#sample")
for nid, rid, a in [(ds, "pyae2019fishmarket", "#sample"), (ds, "park2020honggong", "#sample"), (cv, "kohavi1995study", "#build"), (sb, "cawley2010overfitting", "#gap"), (leak, "kaufman2012leakage", "#gap"), (dev, "pedregosa2011scikit", "#build")]:
    edge(nid, "assertedIn", "lab:work/" + rid, a); RID[rid]["lab"]["supports"].append(nid)
kg = {"version": "1.0", "page": PG, "nodes": N, "edges": E}
ids = {n["id"] for n in N}
bad = [e for e in E if e["s"] not in ids or e["o"] not in ids]
iso = [n["id"] for n in N if not any(e["s"] == n["id"] or e["o"] == n["id"] for e in E)]
print("nodes", len(N), "edges", len(E), "bad", bad, "isolated", iso)
meta = json.loads((B / "meta.json").read_text(encoding="utf-8"))
meta.update({"title": "시제품 테스트 랩실 — 생선 통조림 분류 장비를 만들고 진짜 물고기로 시험하기", "number": "L1", "version": "1.0", "url": URL,
             "about": [dev, test, cv, leak, sb], "basedOn": [r["id"] for r in REFS],
             "suggestedCitation": "안상선 (2026). 시제품 테스트 랩실 — 생선 통조림 분류 장비를 만들고 진짜 물고기로 시험하기. 자율주행차 배터리 AI 공장 시제품 테스트 랩실 1, v1.0."})
for f, o in [("kg_test.json", kg), ("refs_test.json", REFS), ("meta_test.json", meta)]:
    (B / f).write_text(json.dumps(o, ensure_ascii=False, indent=1), encoding="utf-8")
