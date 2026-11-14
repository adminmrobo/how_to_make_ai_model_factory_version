"""회귀 편 지식 색인: kg_defs.py가 만든 kg.json·refs.json을 바탕으로 kg_reg.json·refs_reg.json·meta_reg.json을 만든다.
분류 전용 노드는 빼고, 회귀 엔진·지표·개념을 더한다. 실행: python3 build/kg_defs.py && python3 build/kg_reg.py"""
import json, pathlib, copy
B = pathlib.Path(__file__).resolve().parent
PG = "regression"; TODAY = "2026-11-14"; URL = "https://adminmrobo.github.io/how_to_make_ai_model_factory_version/regression.html"
kg = json.loads((B / "kg.json").read_text(encoding="utf-8"))
refs = json.loads((B / "refs.json").read_text(encoding="utf-8"))
MEM = "저자의 기억과 일반 서지로 옮김(2026-11-14). DOI·쪽 미대조"
V = {"title": True, "author": True, "year": True, "container": True, "doi": False, "pages": False}

DROP = {"lab:method/logistic-regression", "lab:method/svm-rbf", "lab:method/naive-bayes", "lab:method/autoencoder", "lab:method/decision-tree",
        "lab:metric/f1", "lab:metric/recall", "lab:concept/class-imbalance", "lab:concept/decision-boundary", "lab:sim/boundary-map",
        "lab:concept/cross-entropy-loss", "lab:task/defect-classification", "lab:work/cortes1995support", "lab:concept/sigmoid"}
N = [n for n in kg["nodes"] if n["id"] not in DROP]
E = [e for e in kg["edges"] if e["s"] not in DROP and e["o"] not in DROP]
refs = [r for r in refs if r["id"] != "cortes1995support"]
for n in N: n["page"] = PG
byid = {n["id"]: n for n in N}
def setdef(i, ko=None, d=None, en=None):
    n = byid[i]
    if ko: n["label"]["ko"] = ko
    if en: n["label"]["en"] = en
    if d: n["definition"] = {"ko": d}
setdef("lab:concept/dataset", d="모델이 배우고 평가받는 표. 셀 1,000개 × 측정값 4개 + 수명(충·방전 횟수).")
setdef("lab:concept/model-as-engine", d="예측 장치에서 갈아 끼울 수 있는 예측 부분. 이 페이지에서는 도감의 회귀 모델 9종.")
setdef("lab:method/dff-engine", d="입력 4, 은닉 8(tanh), 출력 1(활성화 없음)의 회귀 신경망 엔진. 파라미터 49개. 정비 작업장 ①~⑩의 주인공.")
setdef("lab:metric/initial-loss", d="학습 전 모델의 손실. 회귀에서는 늘 평균만 말하는 기준선의 2배 이하인지 본다.")
setdef("lab:method/knn", d="가장 비슷한 셀 k개의 평균 수명. 훈련 셀을 통째로 저장.")
setdef("lab:method/random-forest", d="부트스트랩으로 키운 회귀 트리 여러 그루의 평균.")
setdef("lab:method/gradient-boosting", d="앞 트리가 남긴 잔차를 다음 트리가 맞히며 더하는 앙상블. XGBoost·LightGBM·CatBoost의 원리.")
setdef("lab:dataset/battery-cells-a", ko="배터리 셀 데이터세트 1,000개와 수명 (공장 A, 설명용 모형)")
setdef("lab:dataset/battery-cells-b", ko="배터리 셀 400개와 수명 (공장 B, 설명용 모형)")
setdef("lab:question/battery-factory", ko="배터리 셀 데이터세트로 수명 예측 장치를 만든다면 어떤 엔진을 달고 어떻게 정비할까?", en="Which engine should a battery cycle-life regressor mount?")
setdef("lab:question/duel-size-vs-data", ko="정답 셀이 적을 때 단순한 엔진(릿지)이냐, 굽은 엔진(부스팅)이냐", en="Ridge vs boosting by labeled-cell count")
setdef("lab:analogy/factory-line", ko="엔진 조립 공장 ↔ 예측 장치 제작 절차", en="Engine assembly plant ↔ regressor build")
setdef("lab:limitation/single-line", ko="뉴런 하나는 평평한 비탈 하나만 그림", en="One neuron draws one plane")
setdef("lab:question/simulation-validation", ko="출고한 예측 장치는 봉인 시험과 라인 시뮬레이션에서도 통할까? (2편)")

def node(id_, type_, ko, en, anchor, level=2, family="basics", d=None, src=None):
    n = {"id": id_, "type": type_, "label": {"ko": ko, "en": en}, "page": PG, "anchor": anchor, "level": level, "status": "known",
         "confidence": "high", "coverage": "explained", "family": family, "domain": ["ai"], "match": []}
    if d: n["definition"] = {"ko": d}
    if src: n["source"] = [{"ref": s, "loc": ""} for s in src]
    N.append(n); byid[id_] = n; return id_
def edge(s, p, o, a): E.append({"s": s, "p": "lab:" + p, "o": o, "anchor": a, "confidence": "high"})

task = node("lab:task/cycle-life-regression", "Task", "배터리 수명 회귀", "Battery cycle-life regression", "#data", 1, d="셀 측정값 4개로 수명(충·방전 횟수)을 숫자로 맞히는 회귀 문제.")
reg = node("lab:concept/regression", "Concept", "회귀", "Regression", "#why", 1, d="확률이나 반 대신 숫자를 맞히는 과제.")
ido = node("lab:concept/identity-output", "Concept", "항등 출력층", "Identity (linear) output layer", "#w2", 1, d="회귀 출력층은 시그모이드 없이 가중합을 그대로 낸다.")
mse = node("lab:concept/mse-loss", "Concept", "평균제곱오차", "Mean squared error", "#w5", 2, "optimization", "회귀의 손실. (예측 − 정답)²의 평균.")
mae = node("lab:metric/mae", "Metric", "평균 절대 오차 (회)", "Mean absolute error", "#bench", 1, "evaluation", "예측이 실제 수명에서 평균 몇 회 벗어났는지.")
r2 = node("lab:metric/r2", "Metric", "R² (결정계수)", "Coefficient of determination", "#bench", 2, "evaluation", "수명의 흩어짐 가운데 엔진이 설명한 몫.")
ovp = node("lab:concept/over-prediction", "Concept", "과대예측", "Over-prediction", "#mount", 1, "evaluation", "수명을 실제보다 길게 말한 예측. 보증·교체 판단에서 더 비쌀 수 있다.")
land = node("lab:concept/prediction-landscape", "Concept", "예측 지형", "Prediction landscape", "#mount", 1, d="입력 공간 곳곳의 예측값을 색으로 칠한 지도. 엔진마다 비탈·계단·곡면으로 다르다.")
smap = node("lab:sim/prediction-map", "Simulation", "예측 지형 지도와 실제–예측 그림", "Prediction map and predicted-vs-actual plot", "#mount", 1)
sdu = node("lab:sim/duel-label-count", "Simulation", "대결: 정답 셀 40개 · 600개, 10번 나누기", "Duel over 40 and 600 labeled cells", "#duel", 2, "evaluation")
RE = {}
for k, ko, en, d, src in [("linear-regression", "선형 회귀", "Linear regression", "측정값의 가중합 평면 하나로 수명을 맞히는 엔진. 저장 값 5개.", None),
                          ("ridge-regression", "릿지 회귀", "Ridge regression", "선형 회귀에 기울기 제곱 벌점(L2)을 더한 엔진.", ["hoerl1970ridge"]),
                          ("lasso", "라쏘 회귀", "Lasso", "기울기 절댓값 벌점(L1)으로 쓸모없는 기울기를 0으로 만드는 엔진.", ["tibshirani1996regression"]),
                          ("regression-tree", "회귀 트리", "Regression tree", "질문으로 나눈 칸마다 평균을 답하는 엔진. 예측 지형이 계단 모양.", None),
                          ("gaussian-process", "가우시안 프로세스", "Gaussian process regression", "커널로 '비슷한 입력은 비슷한 출력'을 표현하는 확률 모델. 훈련 셀을 저장.", ["rasmussen2006gaussian"])]:
    RE[k] = node("lab:method/" + k, "Method", ko, en, "#atlas", 2, "basics", d, src)
RG = {r: next(n for n in refs if n["id"] == r) for r in []}
def ref(id_, type_, title, authors, year, container, extra):
    r = {"id": id_, "type": type_, "title": title, "author": authors, "issued": {"date-parts": [[year]]}}
    if container: r["container-title"] = container
    r.update(extra); r["accessed"] = {"date-parts": [[2026, 11, 14]]}
    r["lab"] = {"work": "lab:work/" + id_, "role": "background", "supports": [], "locs": [], "verified": V, "checkedBy": MEM}
    refs.append(r); node("lab:work/" + id_, "Work", title[:40], title, "#export", 2); return r
ref("hoerl1970ridge", "article-journal", "Ridge regression: Biased estimation for nonorthogonal problems", [{"family": "Hoerl", "given": "Arthur E."}, {"family": "Kennard", "given": "Robert W."}], 1970, "Technometrics", {"volume": "12", "issue": "1"})
ref("tibshirani1996regression", "article-journal", "Regression shrinkage and selection via the lasso", [{"family": "Tibshirani", "given": "Robert"}], 1996, "Journal of the Royal Statistical Society: Series B", {"volume": "58", "issue": "1"})
ref("rasmussen2006gaussian", "book", "Gaussian Processes for Machine Learning", [{"family": "Rasmussen", "given": "Carl Edward"}, {"family": "Williams", "given": "Christopher K. I."}], 2006, None, {"publisher": "MIT Press"})
RID = {r["id"]: r for r in refs}
for r in refs: r["lab"]["supports"] = [s for s in r["lab"]["supports"] if s not in DROP]

mlp, eng, bench, dA = "lab:method/dff-engine", "lab:concept/model-as-engine", "lab:sim/engine-bench", "lab:dataset/battery-cells-a"
WML, WNN, cap, neu, loss, init = "lab:work/ahn_ml_atlas", "lab:work/ahn_nn_atlas", "lab:concept/model-capacity", "lab:concept/single-neuron", "lab:concept/loss", "lab:metric/initial-loss"
edge(task, "broader", reg, "#why"); edge(task, "evaluatedOn", dA, "#data"); edge(task, "evaluatedBy", mae, "#bench"); edge(task, "evaluatedBy", r2, "#bench")
edge(mlp, "solves", task, "#atlas"); edge(mlp, "evaluatedBy", mae, "#duel"); edge(ido, "partOf", mlp, "#w2"); edge(ido, "relatedTo", neu, "#w2"); edge(ido, "broader", "lab:topic/activation-function", "#w2")
edge(mse, "broader", loss, "#w5"); edge(mse, "relatedTo", task, "#w5"); edge(init, "relatedTo", mse, "#w5"); edge(mse, "broader", "lab:topic/loss-function", "#w5")
edge(mae, "contrastsWith", mse, "#bench"); edge(ovp, "relatedTo", mae, "#mount"); edge(task, "raises", "lab:question/simulation-validation", "#ship"); edge(ovp, "raises", "lab:question/simulation-validation", "#ship")
edge(land, "demonstratedBy", smap, "#mount"); edge(mlp, "relatedTo", land, "#mount"); edge(ovp, "demonstratedBy", smap, "#mount")
for k in ["random-forest", "gradient-boosting", "knn"]:
    edge("lab:method/" + k, "solves", task, "#atlas")
for k, x in RE.items():
    edge(x, "solves", task, "#atlas"); edge(x, "demonstratedBy", bench, "#bench"); edge(x, "assertedIn", WML, "#atlas")
edge(RE["linear-regression"], "prerequisiteOf", RE["ridge-regression"], "#atlas"); edge(RE["linear-regression"], "prerequisiteOf", RE["lasso"], "#atlas")
edge(RE["ridge-regression"], "contrastsWith", RE["lasso"], "#atlas"); edge(RE["linear-regression"], "relatedTo", neu, "#w2")
edge(RE["regression-tree"], "prerequisiteOf", "lab:method/random-forest", "#atlas"); edge(RE["regression-tree"], "prerequisiteOf", "lab:method/gradient-boosting", "#atlas")
edge(RE["regression-tree"], "broader", "lab:topic/decision-tree", "#atlas"); edge(RE["linear-regression"], "broader", "lab:topic/linear-regression", "#atlas")
edge(RE["ridge-regression"], "contrastsWith", "lab:method/gradient-boosting", "#duel"); edge(RE["ridge-regression"], "demonstratedBy", sdu, "#duel"); edge("lab:method/gradient-boosting", "demonstratedBy", sdu, "#duel")
edge("lab:question/duel-size-vs-data", "relatedTo", sdu, "#duel")
for k, rid in [("ridge-regression", "hoerl1970ridge"), ("lasso", "tibshirani1996regression"), ("gaussian-process", "rasmussen2006gaussian")]:
    edge(RE[k], "assertedIn", "lab:work/" + rid, "#atlas"); RID[rid]["lab"]["supports"].append(RE[k])
RID["ahn_ml_atlas"]["lab"]["supports"] += list(RE.values())
edge(reg, "contrastsWith", "lab:concept/model-as-engine", "#why") if False else None
edge(reg, "raises", "lab:question/battery-factory", "#top")
kg2 = {"version": "1.0", "page": PG, "nodes": N, "edges": E}
ids = {n["id"] for n in N}
bad = [e for e in E if e["s"] not in ids or (e["o"] not in ids and not e["o"].startswith("lab:topic/"))]
iso = [n["id"] for n in N if not any(e["s"] == n["id"] or e["o"] == n["id"] for e in E)]
print("nodes", len(N), "edges", len(E), "bad", bad, "isolated", iso)
meta = json.loads((B / "meta.json").read_text(encoding="utf-8"))
meta.update({"title": "배터리 수명 예측 장치 ① 엔진부 제작 — 도감에서 회귀 엔진을 골라 장착하기", "series": "자율주행차 배터리 AI 공장", "number": "01R", "version": "1.0", "url": URL,
             "about": [eng, mlp, RE["ridge-regression"], "lab:method/gradient-boosting", task, mse, ovp], "basedOn": [r["id"] for r in refs],
             "suggestedCitation": "안상선 (2026). 배터리 수명 예측 장치 ① 엔진부 제작 — 도감에서 회귀 엔진을 골라 장착하기. 자율주행차 배터리 AI 공장 01R, v1.0."})
for f, o in [("kg_reg.json", kg2), ("refs_reg.json", refs), ("meta_reg.json", meta)]:
    (B / f).write_text(json.dumps(o, ensure_ascii=False, indent=1), encoding="utf-8")
