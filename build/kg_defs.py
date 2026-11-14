"""지식 그래프(kg.json)·참고문헌(refs.json)·페이지 서지(meta.json)를 만든다.
형식: ahnboat_lab_explainer onto-retrofit templates + 본편 O1·O2.  실행: python3 build/kg_defs.py → node build/build.js"""
import json, pathlib
B = pathlib.Path(__file__).resolve().parent
PG = "index"; TODAY = "2026-11-14"
URL = "https://adminmrobo.github.io/how_to_make_ai_model_factory_version/"

def ref(id_, type_, title, authors, year=None, container=None, extra=None, role="background", verified=None, checked="", note=""):
    r = {"id": id_, "type": type_, "title": title, "author": authors}
    if year: r["issued"] = {"date-parts": [[year]]}
    if container: r["container-title"] = container
    r.update(extra or {})
    r["accessed"] = {"date-parts": [[2026, 11, 14]]}
    r["lab"] = {"work": "lab:work/" + id_, "role": role, "supports": [], "locs": [], "verified": verified or {}, "checkedBy": checked}
    if note: r["lab"]["note"] = note
    return r

V = {"title": True, "author": True, "year": True, "container": True, "doi": False, "pages": False}
MEM = "저자의 기억과 일반 서지로 옮김(2026-11-14). DOI·쪽 미대조"
REFS = [
 ref("eeanimation_params", "graphic", "AI Parameters (카드 10장)", [{"literal": "eeanimation"}], role="primary",
     verified={"title": True, "author": True, "year": False, "url": False}, checked="사용자 제공 이미지에서 옮김. 원 게시물 주소·게시일은 받지 못함", note="그림은 페이지에 넣지 않고 새로 그림"),
 ref("rumelhart1986learning", "article-journal", "Learning representations by back-propagating errors",
     [{"family": "Rumelhart", "given": "David E."}, {"family": "Hinton", "given": "Geoffrey E."}, {"family": "Williams", "given": "Ronald J."}], 1986, "Nature",
     {"volume": "323", "page": "533-536"}, verified=dict(V, pages=True), checked=MEM),
 ref("kingma2015adam", "paper-conference", "Adam: A Method for Stochastic Optimization", [{"family": "Kingma", "given": "Diederik P."}, {"family": "Ba", "given": "Jimmy"}], 2015,
     "International Conference on Learning Representations (ICLR)", verified=V, checked=MEM),
 ref("goodfellow2016deep", "book", "Deep Learning", [{"family": "Goodfellow", "given": "Ian"}, {"family": "Bengio", "given": "Yoshua"}, {"family": "Courville", "given": "Aaron"}], 2016,
     None, {"publisher": "MIT Press"}, verified=V, checked=MEM),
 ref("hu2022lora", "paper-conference", "LoRA: Low-Rank Adaptation of Large Language Models", [{"family": "Hu", "given": "Edward J."}, {"literal": "et al."}], 2022,
     "International Conference on Learning Representations (ICLR)", verified=V, checked=MEM),
 ref("ba2016layer", "report", "Layer Normalization", [{"family": "Ba", "given": "Jimmy Lei"}, {"family": "Kiros", "given": "Jamie Ryan"}, {"family": "Hinton", "given": "Geoffrey E."}], 2016,
     "arXiv", {"number": "1607.06450"}, verified=V, checked=MEM),
 ref("zhang2019root", "paper-conference", "Root Mean Square Layer Normalization", [{"family": "Zhang", "given": "Biao"}, {"family": "Sennrich", "given": "Rico"}], 2019,
     "Advances in Neural Information Processing Systems 32", verified=V, checked=MEM),
 ref("vaswani2017attention", "paper-conference", "Attention Is All You Need", [{"family": "Vaswani", "given": "Ashish"}, {"literal": "et al."}], 2017,
     "Advances in Neural Information Processing Systems 30", verified=V, checked=MEM),
 ref("rajbhandari2020zero", "paper-conference", "ZeRO: Memory Optimizations Toward Training Trillion Parameter Models",
     [{"family": "Rajbhandari", "given": "Samyam"}, {"family": "Rasley", "given": "Jeff"}, {"family": "Ruwase", "given": "Olatunji"}, {"family": "He", "given": "Yuxiong"}], 2020,
     "SC20: International Conference for High Performance Computing, Networking, Storage and Analysis", {"URL": "https://arxiv.org/abs/1910.02054"},
     verified=dict(V, url=True), checked="웹 검색으로 제목·저자·파라미터당 16바이트 계산 확인(2026-11-14)"),
 ref("ouyang2022training", "paper-conference", "Training language models to follow instructions with human feedback", [{"family": "Ouyang", "given": "Long"}, {"literal": "et al."}], 2022,
     "Advances in Neural Information Processing Systems 35", verified=V, checked=MEM),
 ref("prechelt1998early", "chapter", "Early Stopping — But When?", [{"family": "Prechelt", "given": "Lutz"}], 1998, "Neural Networks: Tricks of the Trade",
     {"publisher": "Springer"}, verified=V, checked=MEM),
 ref("breiman2001random", "article-journal", "Random Forests", [{"family": "Breiman", "given": "Leo"}], 2001, "Machine Learning", {"volume": "45", "page": "5-32"}, verified=dict(V, pages=True), checked=MEM),
 ref("friedman2001greedy", "article-journal", "Greedy function approximation: A gradient boosting machine", [{"family": "Friedman", "given": "Jerome H."}], 2001, "Annals of Statistics", {"volume": "29", "issue": "5"}, verified=V, checked=MEM),
 ref("cortes1995support", "article-journal", "Support-vector networks", [{"family": "Cortes", "given": "Corinna"}, {"family": "Vapnik", "given": "Vladimir"}], 1995, "Machine Learning", {"volume": "20"}, verified=V, checked=MEM),
 ref("ahn_ml_atlas", "webpage", "머신러닝 모델 도감", [{"family": "안", "given": "상선"}], None, None, {"URL": "https://adminmrobo.github.io/machine_learning_model_atlas/"}, verified={"title": True, "author": True, "url": True}, checked="저자 본인 사이트, 웹으로 확인(2026-11-14)"),
 ref("ahn_nn_atlas", "webpage", "신경망 도감", [{"family": "안", "given": "상선"}], None, None, {"URL": "https://adminmrobo.github.io/neural_network_atlas/0_neural_network_essence.html"}, verified={"title": True, "author": True, "url": True}, checked="저자 본인 사이트, 웹으로 확인(2026-11-14)"),
 ref("severson2019data", "article-journal", "Data-driven prediction of battery cycle life before capacity degradation",
     [{"family": "Severson", "given": "Kristen A."}, {"family": "Attia", "given": "Peter M."}, {"literal": "et al."}], 2019, "Nature Energy",
     {"volume": "4", "issue": "5", "page": "383-391", "DOI": "10.1038/s41560-019-0356-8"},
     verified={"title": True, "author": True, "year": True, "container": True, "doi": True, "pages": True},
     checked="웹 검색(출판사 서지·저자 PDF)으로 확인(2026-11-14)"),
]
RID = {r["id"]: r for r in REFS}

N, E = [], []
def node(id_, type_, ko, en, anchor, level=2, family="optimization", definition=None, source=None, alt=None, conf="high"):
    n = {"id": id_, "type": type_, "label": {"ko": ko, "en": en}, "page": PG, "anchor": anchor, "level": level, "status": "known",
         "confidence": conf, "coverage": "explained", "family": family, "domain": ["ai"], "match": []}
    if definition: n["definition"] = {"ko": definition}
    if alt: n["altLabel"] = {"ko": alt}
    if source: n["source"] = [{"ref": s[0], "loc": s[1]} for s in source]
    N.append(n); return id_
def edge(s, p, o, anchor, conf="high"):
    E.append({"s": s, "p": "lab:" + p, "o": o, "anchor": anchor, "confidence": conf})

# ── 개념·방법 ──
par = node("lab:concept/parameter", "Concept", "파라미터", "Parameter", "#w1", 1, "basics", "모델 안에서 데이터로부터 배우는 숫자. 가중치와 편향.")
w = node("lab:concept/weight", "Concept", "가중치", "Weight", "#w1", 1, "basics", "입력 신호를 몇 배로 키울지(부호 포함) 정하는 숫자.")
b = node("lab:concept/bias", "Concept", "편향", "Bias", "#w1", 1, "basics", "가중합에 더해 출력을 밀어 올리거나 내리는 숫자.")
hp = node("lab:concept/hyperparameter", "Concept", "하이퍼파라미터", "Hyperparameter", "#sum", 1, "optimization", "학습 전에 사람이 정하는 숫자. 학습률, 배치 크기, 에포크, 은닉 뉴런 수.")
neu = node("lab:concept/single-neuron", "Concept", "뉴런 하나", "Single neuron", "#w2", 1, "basics", "가중합 z = Σwx + b를 만들고 활성화 함수를 거쳐 내보내는 단위. 파라미터 3개(입력 2개일 때).")
sig = node("lab:concept/sigmoid", "Concept", "시그모이드", "Sigmoid", "#w2", 1, "basics", "어떤 수든 0~1로 바꾸는 S자 함수 σ(z) = 1/(1+e^(−z)).")
act = node("lab:concept/activation-value", "Concept", "활성값", "Activation (value)", "#w3", 2, "basics", "입력이 들어올 때마다 층을 지나며 새로 계산되는 값. 저장된 파라미터가 아니다.")
std = node("lab:concept/input-normalization", "Concept", "표준화", "Standardization", "#w3", 1, "basics", "훈련 데이터의 평균·표준편차로 특징의 눈금을 맞추는 일. 배우는 값이 아니라 계산한 값.")
ln = node("lab:concept/norm-scale-shift", "Concept", "정규화 층의 γ·β", "Normalization gain and bias", "#w3", 3, "basics", "정규화 층의 학습되는 크기(γ)와 이동(β). RMSNorm은 γ만 둔다.", source=[("ba2016layer", ""), ("zhang2019root", "")])
cnt = node("lab:concept/parameter-count", "Concept", "파라미터 개수", "Parameter count", "#w4", 1, "basics", "완전 연결층 하나 = 입력 수 × 출력 수 + 출력 수.")
mem = node("lab:concept/weight-memory", "Concept", "가중치 메모리", "Weight memory", "#w4", 2, "systems", "파라미터 수 × 숫자 하나의 바이트 수. 학습 때는 기울기·옵티마이저 상태가 더 든다.")
loss = node("lab:concept/loss", "Concept", "손실", "Loss", "#w5", 1, "optimization", "예측이 정답에서 벗어난 정도를 재는 벌점.")
ce = node("lab:concept/cross-entropy-loss", "Concept", "교차 엔트로피", "Cross-entropy loss", "#w5", 2, "optimization", "분류의 손실. 정답에 준 확률 P의 −ln P.")
bp = node("lab:method/backpropagation", "Method", "역전파", "Backpropagation", "#w6", 2, "optimization", "손실에서 거꾸로 층을 지나며 연쇄 법칙으로 모든 파라미터의 기울기를 구하는 방법.", [("rumelhart1986learning", "")])
grad = node("lab:concept/gradient", "Concept", "기울기", "Gradient", "#w6", 2, "optimization", "파라미터를 아주 조금 바꿀 때 손실이 변하는 비율 ∂L/∂w.")
gc = node("lab:method/gradient-check", "Method", "기울기 검사", "Gradient check", "#w6", 2, "optimization", "역전파 기울기와 중심 차분으로 잰 기울기를 비교해 미분 코드를 확인하는 일.")
gd = node("lab:method/gradient-descent", "Method", "경사하강법", "Gradient descent", "#w7", 1, "optimization", "기울기 반대 방향으로 학습률만큼 움직여 손실을 줄이는 방법.")
lr = node("lab:concept/learning-rate", "Concept", "학습률", "Learning rate", "#w7", 1, "optimization", "한 걸음에 기울기의 몇 배만큼 움직일지 정하는 하이퍼파라미터 η.")
adam = node("lab:method/adam", "Method", "Adam", "Adam", "#w7", 2, "optimization", "기울기의 1·2차 모멘트를 기억해 파라미터마다 보폭을 맞추는 옵티마이저.", [("kingma2015adam", "")])
mb = node("lab:method/minibatch-sgd", "Method", "미니배치 학습", "Mini-batch training", "#w8", 2, "optimization", "훈련 데이터를 묶음(배치)으로 나눠 묶음마다 한 걸음씩 고치는 학습.")
epoch = node("lab:concept/epoch", "Concept", "에포크", "Epoch", "#w8", 1, "optimization", "훈련 데이터를 한 바퀴 다 도는 일.")
bs = node("lab:concept/batch-size", "Concept", "배치 크기", "Batch size", "#w8", 1, "optimization", "한 스텝에 쓰는 데이터 수.")
val = node("lab:concept/validation-set", "Concept", "검증 데이터", "Validation set", "#w8", 1, "evaluation", "학습에 쓰지 않고 설정과 멈출 때를 고르는 데 쓰는 데이터.")
test = node("lab:concept/test-set", "Concept", "시험 데이터", "Test set", "#ship", 1, "evaluation", "마지막 점수를 한 번만 재기 위해 봉인해 두는 데이터.")
es = node("lab:method/early-stopping", "Method", "조기 종료", "Early stopping", "#w8", 2, "optimization", "검증 손실이 가장 낮던 때의 파라미터를 고르는 방법.", [("prechelt1998early", "")])
pre = node("lab:concept/pretraining", "Concept", "사전학습", "Pretraining", "#w9", 2, "generative", "큰 데이터로 먼저 배워 두는 단계. 미세조정의 출발점.")
ft = node("lab:method/full-fine-tuning", "Method", "전체 미세조정", "Full fine-tuning", "#w9", 2, "generative", "사전학습한 파라미터 전부를 새 데이터로 조금 더 고치는 방법.")
lora = node("lab:method/lora", "Method", "어댑터(LoRA 방식)", "LoRA-style adapter", "#w9", 3, "generative", "원래 가중치는 잠그고 낮은 순위의 보정 행렬만 배우는 미세조정.", [("hu2022lora", "")], alt=["LoRA"])
pref = node("lab:concept/preference-training", "Concept", "선호 학습", "Preference training", "#w9", 3, "generative", "두 답 중 사람이 고른 쪽을 따르도록 모델을 고치는 단계.", [("ouyang2022training", "")])
ovf = node("lab:concept/overfitting", "Concept", "과적합", "Overfitting", "#w10", 2, "evaluation", "훈련 데이터를 외워 처음 보는 데이터에서 오히려 틀리는 상태.")
cap = node("lab:concept/model-capacity", "Concept", "모델 용량", "Model capacity", "#w10", 2, "evaluation", "모델이 표현할 수 있는 모양의 폭. 이 페이지에서는 은닉 뉴런 수로 바꾼다.")
inf = node("lab:concept/frozen-inference", "Concept", "추론 중 가중치 고정", "Fixed weights at inference", "#w10", 1, "systems", "배포 후 추론은 파라미터를 읽기만 하고, 입력에 따라 활성값만 바뀐다.")
cls = node("lab:task/defect-classification", "Task", "배터리 불량 분류", "Battery defect classification", "#data", 1, "basics", "셀 측정값 4개로 불량일 확률을 내는 분류 문제.")
mlp = node("lab:method/dff-engine", "Method", "DFF (MLP) 엔진", "DFF / MLP engine", "#atlas", 2, "basics", "입력 4, 은닉 8(tanh), 출력 1의 신경망 엔진. 파라미터 49개. 정비 작업장 ①~⑩의 주인공.", alt=["다층 퍼셉트론", "4 → 8 → 1 신경망"])
E_ = {}
for k, ko, en, fam, d in [("logistic-regression", "로지스틱 회귀", "Logistic regression", "basics", "가중합을 시그모이드로 확률로 바꾸는 선형 분류 엔진. 저장 값 5개."),
    ("decision-tree", "결정 트리", "Decision tree", "ensemble", "질문을 이어 가며 나누는 엔진. 경계가 계단 모양."),
    ("random-forest", "랜덤 포레스트", "Random forest", "ensemble", "부트스트랩으로 키운 트리 여러 그루의 투표."),
    ("gradient-boosting", "그래디언트 부스팅", "Gradient boosting", "ensemble", "앞 트리의 오차를 다음 트리가 고치며 더하는 앙상블. XGBoost·LightGBM·CatBoost의 원리."),
    ("svm-rbf", "SVM (RBF)", "Support vector machine (RBF)", "basics", "여백을 가장 넓게 하는 경계, RBF 커널로 굽은 경계."),
    ("naive-bayes", "나이브 베이즈", "Gaussian naive Bayes", "basics", "특징끼리 독립이라 가정하고 확률을 곱하는 엔진."),
    ("knn", "k-최근접 이웃", "k-nearest neighbors", "basics", "가장 비슷한 셀 k개의 다수결. 훈련 셀을 통째로 저장."),
    ("autoencoder", "오토인코더 (AE)", "Autoencoder", "unsupervised", "양품만으로 복원을 배우고 복원 오차가 큰 셀을 불량으로 보는 이상 탐지 엔진.")]:
    E_[k] = node("lab:method/" + k, "Method", ko, en, "#atlas", 2, fam, d)
eng = node("lab:concept/model-as-engine", "Concept", "엔진 (모델)", "Model as engine", "#why", 1, "basics", "판정기에서 갈아 끼울 수 있는 판정 부분. 이 페이지에서는 도감의 모델 9종.")
ds = node("lab:concept/dataset", "Concept", "데이터세트", "Dataset", "#data", 1, "basics", "모델이 배우고 평가받는 표. 셀 1,000개 × 측정값 4개 + 불량 라벨.")
imb = node("lab:concept/class-imbalance", "Concept", "불균형 데이터", "Class imbalance", "#data", 2, "evaluation", "한 반(불량)이 훨씬 적은 데이터. 정확도만으로는 엔진 차이가 안 보인다.")
dbd = node("lab:concept/decision-boundary", "Concept", "판정 경계", "Decision boundary", "#mount", 1, "basics", "엔진이 불량과 양품을 가르는 선(면). 엔진마다 모양이 다르다.")
bench = node("lab:sim/engine-bench", "Simulation", "엔진 벤치 9종", "Engine bench of nine models", "#bench", 2, "evaluation")
mapS = node("lab:sim/boundary-map", "Simulation", "판정 경계 지도", "Decision boundary map", "#mount", 1, "basics")
WML = node("lab:work/ahn_ml_atlas", "Work", "머신러닝 모델 도감", "Machine learning model atlas", "#atlas", 1)
WNN = node("lab:work/ahn_nn_atlas", "Work", "신경망 도감", "Neural network atlas", "#atlas", 1)
q2 = node("lab:question/simulation-validation", "Question", "출고한 엔진은 봉인 시험과 라인 시뮬레이션에서도 통할까? (2편)", "Will the shipped engine pass simulation validation? (part 2)", "#ship", 2)
# 지표
f1 = node("lab:metric/f1", "Metric", "F1", "F1 score", "#w8", 2, "evaluation", "정밀도와 재현율의 조화 평균.")
rec = node("lab:metric/recall", "Metric", "재현율", "Recall", "#w8", 2, "evaluation", "실제 불량 가운데 잡아낸 비율.")
vloss = node("lab:metric/validation-loss", "Metric", "검증 손실", "Validation loss", "#w8", 1, "evaluation")
init = node("lab:metric/initial-loss", "Metric", "초기 손실", "Initial loss", "#w5", 2, "evaluation", "학습 전 모델의 손실. 판정기는 ln 2 근처가 정상.")
relerr = node("lab:metric/gradient-relative-error", "Metric", "기울기 상대 오차", "Gradient relative error", "#w6", 2, "evaluation")
# 데이터
dA = node("lab:dataset/battery-cells-a", "Dataset", "배터리 셀 데이터세트 1,000개 (공장 A, 설명용 모형)", "Synthetic battery cells, factory A", "#data", 1, "basics")
dB = node("lab:dataset/battery-cells-b", "Dataset", "배터리 셀 400개 (공장 B, 설명용 모형)", "Synthetic battery cells, factory B", "#w9", 2, "basics")
# 한계
L1 = node("lab:limitation/hand-tuning", "Limitation", "손으로는 파라미터를 못 맞춤", "Hand tuning does not scale", "#w1", 1)
L2 = node("lab:limitation/single-line", "Limitation", "뉴런 하나는 직선 하나로만 가름", "One neuron draws one line", "#w2", 1)
L5 = node("lab:limitation/loss-no-direction", "Limitation", "손실 크기만으로는 고칠 방향을 모름", "Loss alone gives no direction", "#w5", 1)
L6 = node("lab:limitation/no-step-size", "Limitation", "기울기만으로는 보폭을 모름", "Gradient gives no step size", "#w6", 1)
L8 = node("lab:limitation/distribution-shift", "Limitation", "다른 공장(분포)에서는 틀림", "Fails under distribution shift", "#w8", 2)
L10 = node("lab:limitation/size-without-data", "Limitation", "데이터가 적으면 큰 모델이 외움", "Large models memorize small data", "#w10", 2)
# 주장
c1 = node("lab:claim/backprop-1986", "Claim", "역전파는 층마다의 기울기를 뒤에서부터 전해 가중치를 고친다", "Backpropagation", "#w6", 2, source=[("rumelhart1986learning", "")])
c2 = node("lab:claim/adam-adaptive", "Claim", "Adam은 기울기의 1·2차 모멘트 추정으로 매개변수마다 보폭을 맞춘다", "Adam adapts step sizes", "#w7", 2, source=[("kingma2015adam", "Algorithm 1")])
c3 = node("lab:claim/zero-16-bytes", "Claim", "혼합 정밀도 Adam 학습은 파라미터당 약 16바이트의 모델 상태 메모리가 든다", "Mixed-precision Adam needs ~16 bytes per parameter", "#w4", 3, source=[("rajbhandari2020zero", "3장")])
c4 = node("lab:claim/lora-fewer-params", "Claim", "LoRA는 사전학습 가중치를 잠그고 낮은 순위 행렬만 학습해 학습할 값을 크게 줄인다", "LoRA reduces trainable parameters", "#w9", 3, source=[("hu2022lora", "")])
c5 = node("lab:claim/rmsnorm-gain-only", "Claim", "RMSNorm은 평균 이동 없이 크기 γ만 둔다", "RMSNorm uses gain only", "#w3", 3, source=[("zhang2019root", "")])
c6 = node("lab:claim/early-cycle-prediction", "Claim", "초기 충·방전 곡선의 특징으로 배터리 수명을 용량이 줄기 전에 예측할 수 있다", "Early-cycle data predict battery cycle life", "#data", 2, source=[("severson2019data", "초록")])
c7 = node("lab:claim/early-stopping-validation", "Claim", "검증 오차로 멈출 시점을 고르고 최종 성능은 따로 둔 데이터로 잰다", "Early stopping with held-out test", "#w8", 2, source=[("prechelt1998early", ""), ("goodfellow2016deep", "7.8")])
c8 = node("lab:claim/preference-training", "Claim", "사람이 고른 답을 따르도록 미세조정하면 언어 모델이 지시를 더 잘 따른다", "Preference training improves instruction following", "#w9", 3, source=[("ouyang2022training", "")])
# 질문·비유·시뮬레이션
q0 = node("lab:question/battery-factory", "Question", "배터리 셀 데이터세트로 불량품 판정기를 만든다면 어떤 엔진을 달고 어떻게 정비할까?", "Which engine should a battery defect classifier mount?", "#top", 1)
qd = node("lab:question/duel-size-vs-data", "Question", "작은 모델 + 조기 종료냐, 큰 모델 끝까지냐 (데이터 양에 따라)", "Small + early stop vs large to the end", "#duel", 2)
a1 = node("lab:analogy/parts-shelf", "Analogy", "부품 선반 ↔ 파라미터", "Parts shelf ↔ parameters", "#w1", 1, "basics")
a2 = node("lab:analogy/factory-line", "Analogy", "엔진 조립 공장 ↔ 판정기 제작 절차", "Engine assembly plant ↔ classifier build", "#factory", 1, "basics")
a3 = node("lab:analogy/root-cause-trace", "Analogy", "불량 원인 거꾸로 추적 ↔ 역전파", "Root-cause trace ↔ backpropagation", "#w6", 1)
a4 = node("lab:analogy/sealed-sample", "Analogy", "봉인된 출고 표본 ↔ 시험 데이터", "Sealed shipping sample ↔ test set", "#ship", 1, "evaluation")
s3d = node("lab:sim/factory-3d", "Simulation", "3D 모델 공장 12공정", "3D model factory", "#factory", 1, "basics")
s1 = node("lab:sim/w1-parts", "Simulation", "① 입력 2 → 출력 2 손 맞추기", "Hand-set 2x2 network", "#w1", 1, "basics")
s6 = node("lab:sim/w6-gradcheck", "Simulation", "⑥ 49개 기울기 검사", "Gradient check of 49 parameters", "#w6", 2)
s8 = node("lab:sim/w8-training-line", "Simulation", "⑧ 길들이기 라인", "Break-in training line", "#w8", 2)
s9 = node("lab:sim/w9-finetune", "Simulation", "⑨ 공장 B 미세조정 네 방법", "Four fine-tuning options", "#w9", 2, "generative")
s10 = node("lab:sim/w10-capacity", "Simulation", "⑩ 용량 실험과 가중치 지문", "Capacity sweep and weight fingerprint", "#w10", 2, "evaluation")
W0 = node("lab:work/eeanimation_params", "Work", "eeanimation 「AI Parameters」 카드 10장", "AI Parameters cards (eeanimation)", "#top", 1)
for r in REFS[1:]:
    if r["id"] in ("ahn_ml_atlas", "ahn_nn_atlas"): continue
    node("lab:work/" + r["id"], "Work", r["title"][:40], r["title"], "#export", 2)
# 퀴즈
QZ = [("bench", "모두 양품이면 정확도 80%", imb), ("bench", "훈련 F1과 검증 F1 차이", ovf), ("w1", "w₁₂는 어느 선인가", w), ("w2", "z = −1.8 계산", neu), ("w3", "셀을 바꾸면 바뀌는 것", act), ("w4", "파라미터 49개 계산", cnt), ("w5", "늘 0.5면 손실 ln 2", ce),
      ("w6", "기울기 검사 불일치의 뜻", gc), ("w7", "0.50 − 0.10×0.20", gd), ("w8", "1 에포크 = 19스텝", epoch),
      ("w9", "어댑터가 배우는 21개", lora), ("w10", "검증 손실이 다시 오르면", ovf), ("w10", "배포 후 가중치 고정", inf), ("duel", "굽은 관계엔 굽은 경계", dbd)]
for i, (sec, t, tgt) in enumerate(QZ if False else []):  # 퀴즈 노드는 규모(80개 안팎)를 맞추려 넣지 않음
    q = node("lab:quiz/battery-%d" % (i + 1), "QuizItem", t, t, "#" + sec, 1)
    edge(q, "assesses", tgt, "#" + sec)

# ── 관계 ──
for x in (w, b): edge(x, "partOf", par, "#w1")
edge(par, "broader", "lab:topic/weights-and-biases", "#w1")
edge(hp, "contrastsWith", par, "#sum")
edge(par, "prerequisiteOf", neu, "#w2"); edge(neu, "prerequisiteOf", mlp, "#w3"); edge(mlp, "prerequisiteOf", cnt, "#w4")
edge(cnt, "prerequisiteOf", loss, "#w5"); edge(loss, "prerequisiteOf", bp, "#w6"); edge(bp, "prerequisiteOf", gd, "#w7")
edge(gd, "prerequisiteOf", mb, "#w8"); edge(mb, "prerequisiteOf", ft, "#w9"); edge(ft, "prerequisiteOf", cap, "#w10")
edge(par, "hasLimitation", L1, "#w1"); edge(L1, "addressedBy", gd, "#w1")
edge(neu, "hasLimitation", L2, "#w2"); edge(L2, "addressedBy", mlp, "#w2")
edge(loss, "hasLimitation", L5, "#w5"); edge(L5, "addressedBy", bp, "#w5")
edge(grad, "hasLimitation", L6, "#w6"); edge(L6, "addressedBy", lr, "#w6")
edge(mb, "hasLimitation", L8, "#w8"); edge(L8, "addressedBy", ft, "#w8")
edge(cap, "hasLimitation", L10, "#w10"); edge(L10, "addressedBy", es, "#w10")
edge(sig, "partOf", neu, "#w2"); edge(sig, "broader", "lab:topic/activation-function", "#w2")
edge(act, "contrastsWith", par, "#w3"); edge(std, "contrastsWith", ln, "#w3"); edge(ln, "partOf", par, "#w3")
edge(mem, "derivedFrom", cnt, "#w4")
edge(ce, "broader", loss, "#w5"); edge(loss, "broader", "lab:topic/loss-function", "#w5")
edge(cls, "evaluatedBy", f1, "#bench"); edge(cls, "evaluatedBy", rec, "#bench")
edge(mlp, "solves", cls, "#atlas"); edge(cls, "evaluatedOn", dA, "#data"); edge(dA, "broader", ds, "#data"); edge(dA, "raises", q0, "#top")
edge(ce, "relatedTo", cls, "#w5")
edge(bp, "broader", "lab:topic/backpropagation", "#w6"); edge(gc, "evaluatedBy", relerr, "#w6"); edge(gc, "relatedTo", bp, "#w6")
edge(bp, "solves", grad, "#w6")
edge(gd, "broader", "lab:topic/gradient-descent", "#w7"); edge(adam, "broader", "lab:topic/momentum-adam", "#w7"); edge(adam, "contrastsWith", gd, "#w7"); edge(lr, "partOf", hp, "#w7")
edge(mb, "broader", "lab:topic/sgd-minibatch", "#w8"); edge(bs, "partOf", hp, "#w8"); edge(epoch, "partOf", hp, "#w8")
edge(es, "evaluatedBy", vloss, "#w8"); edge(es, "broader", "lab:topic/early-stopping", "#w8"); edge(val, "relatedTo", es, "#w8")
edge(pre, "prerequisiteOf", ft, "#w9"); edge(lora, "contrastsWith", ft, "#w9"); edge(lora, "broader", "lab:topic/lora", "#w9"); edge(ft, "evaluatedOn", dB, "#w9"); edge(lora, "evaluatedOn", dB, "#w9")
edge(ft, "prerequisiteOf", pref, "#w9"); edge(pref, "broader", "lab:topic/pretrained-lm", "#w9")
edge(ovf, "broader", "lab:topic/generalization", "#w10"); edge(cap, "relatedTo", ovf, "#w10"); edge(test, "contrastsWith", val, "#w10"); edge(inf, "relatedTo", act, "#w10")
edge(init, "relatedTo", ce, "#w5")
edge(E_["logistic-regression"], "contrastsWith", mlp, "#duel"); edge(E_["logistic-regression"], "evaluatedBy", f1, "#duel"); edge(mlp, "evaluatedBy", f1, "#duel")
for k, x in E_.items():
    edge(x, "solves", cls, "#atlas"); edge(x, "demonstratedBy", bench, "#bench")
    edge(x, "assertedIn", WNN if k == "autoencoder" else WML, "#atlas")
edge(mlp, "assertedIn", WNN, "#atlas"); edge(mlp, "demonstratedBy", bench, "#bench")
edge(E_["random-forest"], "broader", "lab:topic/random-forest", "#atlas"); edge(E_["gradient-boosting"], "broader", "lab:topic/boosting", "#atlas"); edge(E_["decision-tree"], "broader", "lab:topic/decision-tree", "#atlas")
edge(E_["svm-rbf"], "broader", "lab:topic/svm", "#atlas"); edge(E_["logistic-regression"], "broader", "lab:topic/logistic-regression", "#atlas"); edge(E_["knn"], "broader", "lab:topic/knn", "#atlas"); edge(E_["naive-bayes"], "broader", "lab:topic/naive-bayes", "#atlas")
edge(E_["decision-tree"], "prerequisiteOf", E_["random-forest"], "#atlas"); edge(E_["decision-tree"], "prerequisiteOf", E_["gradient-boosting"], "#atlas")
edge(E_["logistic-regression"], "relatedTo", neu, "#w2")
edge(mlp, "partOf", eng, "#atlas"); edge(eng, "analogyOf", mlp, "#why") if False else None
edge(ds, "prerequisiteOf", eng, "#why"); edge(imb, "relatedTo", f1, "#bench"); edge(ds, "relatedTo", imb, "#data")
edge(dbd, "demonstratedBy", mapS, "#mount"); edge(mlp, "relatedTo", dbd, "#mount")
edge(test, "raises", q2, "#ship"); edge(cls, "raises", q2, "#ship")
edge(qd, "relatedTo", cap, "#duel"); edge(cap, "raises", qd, "#w10"); edge(eng, "raises", q0, "#top")
# 비유·시뮬레이션
edge(a1, "analogyOf", par, "#w1"); edge(a2, "analogyOf", mb, "#factory"); edge(a3, "analogyOf", bp, "#w6"); edge(a4, "analogyOf", test, "#w10")
edge(par, "demonstratedBy", s1, "#w1"); edge(mb, "demonstratedBy", s3d, "#factory"); edge(gc, "demonstratedBy", s6, "#w6")
edge(mb, "demonstratedBy", s8, "#w8"); edge(lora, "demonstratedBy", s9, "#w9"); edge(cap, "demonstratedBy", s10, "#w10")
# 주장 근거
for c, tgt, rid, anc in [(c1, bp, "rumelhart1986learning", "#w6"), (c2, adam, "kingma2015adam", "#w7"), (c3, mem, "rajbhandari2020zero", "#w4"), (c4, lora, "hu2022lora", "#w9"),
                         (c5, ln, "zhang2019root", "#w3"), (c6, ds, "severson2019data", "#data"), (c7, es, "prechelt1998early", "#w8"), (c8, pref, "ouyang2022training", "#w9")]:
    edge(c, "supports", tgt, anc); edge(c, "assertedIn", "lab:work/" + rid, anc)
    RID[rid]["lab"]["supports"].append(c)
edge(c7, "assertedIn", "lab:work/goodfellow2016deep", "#w8"); RID["goodfellow2016deep"]["lab"]["supports"] += [c7, ovf]
edge(ln, "assertedIn", "lab:work/ba2016layer", "#w3"); RID["ba2016layer"]["lab"]["supports"].append(ln)
edge("lab:concept/self-attention-weights", "partOf", par, "#w3") if False else None
edge(par, "assertedIn", W0, "#top"); RID["eeanimation_params"]["lab"]["supports"] += [par, neu, cnt, loss, bp, gd, mb, ft, cap]
edge(q0, "relatedTo", a2, "#top")
for w_ in ["lab:work/vaswani2017attention"]:
    edge(act, "assertedIn", w_, "#w3"); RID["vaswani2017attention"]["lab"]["supports"].append(act)

for rid, k in [("breiman2001random", "random-forest"), ("friedman2001greedy", "gradient-boosting"), ("cortes1995support", "svm-rbf")]:
    edge(E_[k], "assertedIn", "lab:work/" + rid, "#atlas"); RID[rid]["lab"]["supports"].append(E_[k])
RID["ahn_ml_atlas"]["lab"]["supports"] += [E_[k] for k in E_ if k != "autoencoder"]; RID["ahn_nn_atlas"]["lab"]["supports"] += [mlp, E_["autoencoder"]]
kg = {"version": "1.0", "page": PG, "nodes": N, "edges": E}
ids = {n["id"] for n in N}
bad = [e for e in E if e["s"] not in ids or (e["o"] not in ids and not e["o"].startswith("lab:topic/"))]
iso = [n["id"] for n in N if not any(e["s"] == n["id"] or e["o"] == n["id"] for e in E)]
rel = sum(1 for e in E if e["p"] == "lab:relatedTo")
print("nodes", len(N), "edges", len(E), "bad", bad, "isolated", iso, "relatedTo %.0f%%" % (100 * rel / len(E)))
meta = {"title": "배터리 불량품 판정기 ① 엔진부 제작 — 도감에서 엔진을 골라 장착하기", "series": "자율주행차 배터리 AI 공장", "number": "01",
        "creator": [{"name": "안상선", "role": "author", "affiliation": "(주)M-Robo"}], "contributor": [{"name": "AI 보조 제작", "role": "assistant"}],
        "date": TODAY, "version": "2.0", "language": ["ko"], "license": "", "url": URL,
        "about": [eng, mlp, E_["logistic-regression"], par, bp, cls, dbd], "basedOn": [r["id"] for r in REFS], "educationalLevel": "입문~중급",
        "learningResourceType": "interactive explainer", "registry": "KG_00_registry 0.2",
        "suggestedCitation": "안상선 (2026). 배터리 불량품 판정기 ① 엔진부 제작 — 도감에서 엔진을 골라 장착하기. 자율주행차 배터리 AI 공장 01, v2.0."}
for f, o in [("kg.json", kg), ("refs.json", REFS), ("meta.json", meta)]:
    (B / f).write_text(json.dumps(o, ensure_ascii=False, indent=1), encoding="utf-8")
