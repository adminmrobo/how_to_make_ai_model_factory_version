"""판정기 편(page.src.html)에서 회귀 편(reg.src.html)을 만든다. 같은 틀, 바뀌는 섹션만 갈아 끼움.
실행: python3 build/reg_make.py → node build/build.js"""
import re, pathlib
B = pathlib.Path(__file__).resolve().parent
h = (B / 'page.src.html').read_text(encoding='utf-8')

def R(a, b):
    global h
    assert a in h, a[:70]
    h = h.replace(a, b)

def block(name, new):
    """<!-- name --> 부터 다음 <!-- … --> 바로 앞까지를 바꾼다"""
    global h
    i = h.index('<!-- %s -->' % name)
    j = h.index('<!--', i + 5)
    h = h[:i] + '<!-- %s -->\n' % name + new.strip('\n') + '\n\n' + h[j:]

# ── 머리 ──
R('<title>배터리 불량품 판정기 ① 엔진부 제작 — 도감에서 엔진을 골라 장착하고 정비하기</title>', '<title>배터리 수명 예측 장치 ① 엔진부 제작 — 도감에서 회귀 엔진을 골라 장착하기</title>')
R('<meta name="description" content="배터리 셀 데이터세트로 불량품 판정기를 만든다. 머신러닝 도감과 신경망 도감에서 엔진 9종을 골라 장착·시운전·비교하고, 신경망 엔진은 AI 파라미터 카드 10장의 정비 작업장 10곳을 거친다. 엔진(모델) 조립 공장 3D 그림과 현황판으로 보여 주는 연구실 해설 1편.">',
  '<meta name="description" content="배터리 셀 데이터세트로 수명(충·방전 횟수)을 맞히는 예측 장치를 만든다. 머신러닝 도감과 신경망 도감에서 회귀 엔진 9종을 골라 장착·시운전·비교하고, 신경망 엔진은 AI 파라미터 카드 10장의 정비 작업장 10곳을 거친다. 불량품 판정기 편의 자매편.">')
R('<a class="logo" href="#top">배터리 불량품 판정기 <i>① 엔진부</i></a>', '<a class="logo" href="#top">배터리 수명 예측 장치 <i>① 엔진부</i></a>')
R('<span class="cover-chip">배터리 불량품 판정기 · ① 엔진부 제작</span>', '<span class="cover-chip">배터리 수명 예측 장치 · ① 엔진부 제작</span>')
R('data-img="cover_01"', 'data-img="cover_01r"')
R('<span class="cap">표지 그림 자리 · cover_01 (그림을 받으면 바뀝니다)</span>', '<span class="cap">표지 그림 자리 · cover_01r (그림을 받으면 바뀝니다)</span>')

i = h.index('<header class="hero" id="top">'); j = h.index('</header>', i) + 9
h = h[:i] + '''<header class="hero" id="top"><div class="wrap">
  <div class="eyebrow">배터리 수명 예측 장치 · 1편 엔진부 제작 · 교과서 모드 · <a href="index.html">불량품 판정기 편</a>의 자매편</div>
  <h1>배터리 수명 예측 장치 ① 엔진부 제작 — 도감에서 회귀 엔진을 골라 장착하기</h1>
  <p class="question">자율주행차 대용량 배터리 셀이 충·방전을 몇 번 견딜지 숫자로 맞히려면, 어떤 엔진을 달아야 하고 수명 시험 데이터가 적을 때는 무엇이 달라질까?</p>
  <p class="lead">불량품 판정기 편은 "불량이냐 아니냐"를 가렸습니다. 이번에 이 공장이 만드는 제품은 <b>자율주행차 대용량 배터리의 수명 예측 장치</b>입니다. 같은 셀 1,000개로 <b>수명(충·방전 횟수)</b>이라는 숫자를 맞히는 <b>회귀 모델</b>을 엔진으로 답니다. 머신러닝 도감에서 회귀 엔진 8종, 신경망 도감에서 DFF 1종을 꺼내 달고, 같은 조건으로 벤치를 돌립니다. 신경망 엔진은 카드 10장의 <b>정비 작업장 10곳</b>을 회귀용으로 다시 거칩니다. 수명 시험은 몇 달이 걸려 정답 셀이 적을 때가 많다는 점도 대결에서 다룹니다.</p>
  <p class="byline">글 · 안상선 ((주)M-Robo 대표) · <a href="https://adminmrobo.github.io/who_am_i/who_am_i.html">저자 소개</a> · 2026-11-14 · v1.0 · 자매편: <a href="index.html">불량품 판정기 ① 엔진부</a> · 다음 편: 2편 시뮬레이션 검증 (준비 중)</p>
  <div class="three"><b>세 줄로 먼저</b><ol>
    <li>회귀 엔진은 확률 대신 숫자를 낸다. 손실은 (예측 − 정답)², 성적은 평균 오차(회)로 잰다.</li>
    <li>수명처럼 굽은 관계가 있으면 직선 엔진은 한계가 있지만, 정답 셀이 적을 때는 단순한 엔진이 오히려 낫다.</li>
    <li>수명을 실제보다 길게 말하는 실수(과대예측)가 짧게 말하는 실수보다 위험할 수 있다. 오차의 크기와 방향을 함께 본다.</li></ol></div>
  <div class="kpis" aria-label="숫자 요약">
    <div class="kpi r"><b>1,000</b><span>배터리 셀 데이터세트 (설명용 모형)<sup>①</sup></span></div>
    <div class="kpi m"><b>9</b><span>장착해 보는 회귀 엔진 (머신러닝 8 · 신경망 1)</span></div>
    <div class="kpi a"><b>10</b><span>신경망 엔진 정비 작업장 (카드 01~10)</span></div>
    <div class="kpi g"><b><span id="k-best">—</span></b><span>벤치 상위 엔진 · 검증 평균 오차(회)<sup>①</sup></span></div>
  </div>
  <p class="muted" style="font-size:13px">① 이 페이지가 직접 만든 설명용 모형의 값(시드 2026)입니다. 실제 배터리 측정값이 아닙니다.</p>
  <div data-dlg="hero"></div>
</div></header>''' + h[j:]

R('<div class="step"><b>3D 공장부터</b>12공정을 한 바퀴 돌려 보고, 궁금한 공정을 누르면 해당 섹션으로 갑니다.</div>', '<div class="step"><b>판정기 편과 나란히</b>섹션 순서가 <a href="index.html">불량품 판정기 편</a>과 같습니다. 두 탭을 열어 견줘 보세요.</div>')
R('<h2 id="h-why">왜 "엔진부"부터 만드나</h2>', '<h2 id="h-why">분류에서 회귀로 — 무엇이 바뀌나</h2>')
R('<div class="step"><b>1. 엔진은 갈아 끼울 수 있다</b>데이터를 받고 판정을 내보내는 차체는 같아도, 안에 넣는 모델은 바꿀 수 있습니다. 그래서 먼저 여러 엔진을 같은 조건에서 견줍니다.</div>',
  '<div class="step"><b>1. 출력이 숫자다</b>판정기는 "불량일 확률"(0~1)을 냈습니다. 예측 장치는 "몇 회"라는 숫자를 그대로 냅니다. 그래서 출력에 시그모이드를 걸지 않습니다.</div>')
R('<div class="step"><b>2. 도감은 부품 카탈로그다</b>머신러닝 도감과 신경망 도감에는 엔진마다 장단점이 적혀 있습니다. 이 페이지는 그 엔진을 실제 데이터세트에 달아 봅니다.</div>',
  '<div class="step"><b>2. 손실과 성적표가 바뀐다</b>손실은 교차 엔트로피 대신 평균제곱오차, 성적은 F1 대신 평균 절대 오차(회)와 R²입니다. 낮을수록 좋은 숫자라는 점이 다릅니다.</div>')
R('<div class="step"><b>3. 검증은 따로 한다</b>엔진부가 완성돼도 실제 라인에서 통하는지는 모릅니다. 봉인한 시험 셀과 라인 시뮬레이션은 2편에서 합니다.</div>',
  '<div class="step"><b>3. 엔진 목록이 바뀐다</b>분류 전용(로지스틱 회귀, 나이브 베이즈, 오토인코더)이 빠지고 회귀 전용(선형 회귀, 릿지, 라쏘, 가우시안 프로세스)이 들어옵니다. 시험 셀은 이번에도 2편까지 봉인합니다.</div>')
R('<li>같은 데이터세트에 엔진 9종을 달아 보고, 판정 경계의 모양과 엔진 무게(저장 값)가 어떻게 다른지 설명할 수 있다.</li>', '<li>같은 데이터세트에 회귀 엔진 9종을 달아 보고, 예측 지형의 모양과 엔진 무게(저장 값)가 어떻게 다른지 설명할 수 있다.</li>')
R('<li>훈련·검증·시험을 나누는 이유와, 검증 셀 한 묶음만으로 순위를 매기면 왜 위험한지 말할 수 있다.</li>', '<li>정답 셀이 적을 때와 많을 때 알맞은 엔진이 왜 달라지는지, 여러 번 나눠 재야 하는 이유와 함께 말할 수 있다.</li>')

# ── 3D 공장 문단 ──
R('위쪽 줄(P1~P6)은 데이터세트를 만들고 두 도감관에서 엔진을 꺼내는 곳, 아래쪽 줄(P7~P12)은 엔진을 달고 시운전·정비·비교해 출고하는 곳입니다.', '공장 배치는 판정기 편과 같습니다. 위쪽 줄(P1~P6)은 데이터세트와 두 도감관, 아래쪽 줄(P7~P12)은 장착·시운전·정비·비교·출고입니다. 이번에 도감관에서 꺼내는 것은 회귀 엔진입니다.')
R('<div class="ptitle">배터리 불량품 판정기 엔진 조립 라인 — 끌어서 돌리기, 공정을 누르면 설명</div>', '<div class="ptitle">배터리 수명 예측 장치 엔진 조립 라인 — 끌어서 돌리기, 공정을 누르면 설명</div>')
R('<li><b>P1~P4 데이터세트</b>: 셀 측정값과 불량 판정을 받고,', '<li><b>P1~P4 데이터세트</b>: 셀 측정값과 수명 시험 결과를 받고,')
R('<li><b>P5~P6 도감관</b>: 머신러닝 도감관에서 엔진 7종, 신경망 도감관에서 2종을 꺼냅니다.', '<li><b>P5~P6 도감관</b>: 머신러닝 도감관에서 회귀 엔진 8종, 신경망 도감관에서 1종을 꺼냅니다.')

R('<div class="prod"><h3 style="color:var(--info)">벤치 순위 (검증 F1)</h3>', '<div class="prod"><h3 style="color:var(--info)">벤치 순위 (검증 평균 오차, 낮을수록 좋음)</h3>')

block('데이터세트', '''<section class="sec" id="data" aria-labelledby="h-data"><div class="wrap">
  <h2 id="h-data">P1~P4 데이터세트 — 배터리 셀 1,000개와 수명</h2>
  <div class="tags"><span class="tag nn">모델: 회귀 (수명, 회)</span><span class="tag fly">현장: 수명 시험실</span></div>
  <div class="datacard">
    <div><b>내부저항</b>평균 1.2 mΩ 근처(대용량 셀). 이 모형에서는 높을수록 수명이 짧습니다.</div>
    <div><b>초기 용량</b>평균 60 Ah 근처(수십 Ah급 차량용 셀). 이 모형에서는 클수록 수명이 깁니다.</div>
    <div><b>온도 상승</b>평균 8 °C 근처. 이 모형에서는 클수록 수명이 짧고, 저항과 함께 높으면 더 짧습니다.</div>
    <div><b>전압 편차</b>평균 10 mV 근처. 이 모형에서는 클수록 수명이 조금 짧습니다.</div>
  </div>
  <div class="pair">
    <div><div class="tl">현장에서는</div>자율주행 전기차 배터리 팩에 들어갈 대용량 셀을 수명 시험실에서 셀을 충·방전하며 용량이 처음의 80%로 떨어질 때까지의 횟수를 셉니다. 흔히 쓰는 수명의 정의입니다[11]. 셀 하나에 몇 달이 걸려, 정답이 있는 셀은 귀합니다.</div>
    <div><div class="tr">모델에서는</div>측정값 4개가 입력, 수명(회)이 정답인 <b>회귀</b> 데이터세트입니다. 학습할 때는 수명을 표준화(평균 0, 표준편차 1)해서 쓰고, 성적은 원래 단위(회)로 되돌려 잽니다.</div>
  </div>
  <div class="panel">
    <div class="ptitle">셀 1,000개 한눈에 — 가로: 내부저항, 세로: 온도 상승, 색: 수명</div>
    <div class="twin"><div class="cwrap tall"><canvas id="cvData1" aria-label="내부저항과 온도 상승 산점도. 점의 색이 수명"></canvas></div><div class="cwrap tall"><canvas id="cvData2" aria-label="수명 분포 막대그래프"></canvas></div></div>
    <div class="legend"><span style="--lc:#c9302c">짧은 수명</span><span style="--lc:#e3b23c">중간</span><span style="--lc:#1e55c8">긴 수명</span></div>
    <div class="minis" id="data-minis"></div>
  </div>
  <div class="explain"><h4>P3·P4에서 하는 일</h4><ol>
    <li><b>표준화</b>: 네 측정값과 수명을 훈련 셀의 평균·표준편차로 맞춥니다. 검증·시험 셀에도 훈련 셀의 값을 그대로 씁니다.</li>
    <li><b>나누기</b>: 훈련 600 · 검증 200 · 시험 200(2편까지 봉인). 판정기 편과 같은 셀, 같은 나누기입니다.</li></ol>
    <div class="lim">이 섹션의 한계: 측정값과 수명의 관계는 설명을 위해 지어낸 공식입니다(저항과 온도가 함께 높을 때 수명이 더 짧아지는 굽은 관계 포함). 실제 셀의 물리 관계가 아닙니다.</div></div>
  <div class="bridge field"><b>현장에 옮기면</b> 실제 배터리 연구에는 초기 충·방전 곡선 같은 시계열에서 특징을 뽑아, 용량이 줄기 전에 수명을 예측한 사례가 있습니다[11]. 수명 시험을 다 끝내지 않고 일찍 예측하는 것이 그런 연구의 목적입니다.<div class="lim">비유의 한계: 이 페이지의 네 측정값은 실제 연구의 곡선 특징과 다릅니다.</div></div>
</div></section>''')

R('<h2 id="h-atlas">P5~P6 엔진 창고 — 두 도감에서 꺼낸 엔진 9종</h2>', '<h2 id="h-atlas">P5~P6 엔진 창고 — 두 도감에서 꺼낸 회귀 엔진 9종</h2>')
R('<div class="tags"><span class="tag nn">모델: 머신러닝 7 · 신경망 2</span>', '<div class="tags"><span class="tag nn">모델: 머신러닝 8 · 신경망 1</span>')
R('오른쪽 위 숫자는 그 엔진의 검증 F1(기본 설정)입니다.', '오른쪽 위 숫자는 그 엔진의 검증 평균 오차(회, 기본 설정)입니다. 낮을수록 좋습니다.')
R('<p class="lead2">흐린 카드는 이번 데이터세트에 맞지 않아 창고에 두는 엔진입니다. 이미지(CNN)나 시계열(LSTM·GRU) 엔진은 사진·충방전 곡선 데이터가 들어올 때 꺼냅니다.</p>',
  '<p class="lead2">흐린 카드는 이번 데이터세트에 맞지 않아 창고에 두는 엔진입니다. 판정기 편의 로지스틱 회귀·나이브 베이즈·오토인코더는 분류용이라 이번엔 빠집니다. 충·방전 곡선이 들어오면 시계열(LSTM·GRU) 엔진을 꺼냅니다.</p>')

block('장착·시운전', '''<section class="sec" id="mount" aria-labelledby="h-mount"><div class="wrap">
  <h2 id="h-mount">P7~P8 엔진 장착과 시운전</h2>
  <div class="tags"><span class="tag nn">모델: 같은 훈련 600 → 같은 검증 200</span><span class="tag fly">현장: 엔진 동력계(다이노) 벤치</span></div>
  <div class="pair">
    <div><div class="tl">현장에서는</div>엔진을 벤치에 올려 같은 조건에서 잽니다. 이번에 재는 것은 "수명을 몇 회 틀리게 말하나"입니다.</div>
    <div><div class="tr">모델에서는</div>모든 엔진이 같은 훈련 셀 600개로 배우고, 같은 검증 셀 200개로 잽니다. 왼쪽 그림은 엔진이 만든 <b>예측 지형</b>(색 = 예측 수명), 오른쪽은 검증 셀의 실제 수명과 예측 수명입니다.</div>
  </div>
  <div class="panel">
    <div class="ptitle" id="m-title">장착한 엔진 — </div>
    <div class="ctrl"><div class="group" id="m-knob"></div><div class="group"><button class="bt primary" id="m-run" type="button">▶ 다시 시운전</button></div></div>
    <div class="twin"><div class="cwrap tall"><canvas id="cvMap" aria-label="장착한 엔진의 예측 수명 지형. 가로 내부저항, 세로 온도 상승"></canvas></div><div class="cwrap tall"><canvas id="cvPvA" aria-label="검증 셀의 실제 수명과 예측 수명 산점도"></canvas></div></div>
    <p class="mnote" id="m-info"></p>
    <div class="minis" id="m-minis"></div>
    <h3 style="font-size:15px;margin:14px 0 4px">허용 오차와 과대예측 — 수명을 길게 틀리는 게 더 위험하다면</h3>
    <div class="ctrl"><div class="group"><label class="glabel" for="r-tol">허용 오차 ±</label><input type="range" id="r-tol" min="10" max="100" step="5" value="30"><span class="val" id="v-tol">30회</span></div><div class="group"><label class="glabel" for="r-ok">과대 1회의 비용 = 과소</label><input type="range" id="r-ok" min="1" max="5" step="0.5" value="3"><span class="val" id="v-ok">3회</span></div></div>
    <div class="minis" id="m-cost"></div>
    <div class="insight" id="i-mount" aria-live="polite"></div>
  </div>
  <div class="explain"><h4>예측 지형 읽기</h4><ol>
    <li>빨간 쪽은 엔진이 "수명이 짧다", 파란 쪽은 "길다"고 하는 곳입니다. 점은 검증 셀(색 = 실제 수명).</li>
    <li>선형 회귀·릿지·라쏘는 색이 한 방향으로 고르게 바뀌는 비탈, 트리 계열은 계단, 가우시안 프로세스·신경망은 부드럽게 굽은 지형을 만듭니다.</li>
    <li><b>과대예측</b>: 실제보다 수명을 길게 말한 셀입니다. 보증 기간이나 교체 시기를 정할 때는 이쪽 실수가 더 큰 손해일 수 있습니다. 위 슬라이더로 허용 오차를 바꿔 보세요.</li>
    <li><b>비대칭 비용과 여유분</b>: 길게 틀린 1회가 짧게 틀린 1회보다 몇 배 비싼지 정하면, 셀당 평균 비용을 잴 수 있습니다. 예측에서 일정한 여유분을 빼면 과대예측이 줄고 과소예측이 늡니다. 페이지가 그 비용이 가장 작아지는 여유분을 찾아 보여 줍니다(검증 셀로 고른 값이라 조금 낙관적입니다).</li>
    <li><b>가우시안 프로세스</b>를 달면 실제–예측 그림에 예측마다 95% 구간 막대가 그려지고, 구간 안에 실제 수명이 든 셀의 비율도 셉니다. 다른 엔진은 이 페이지에서 평균 예측만 냅니다.</li></ol>
    <div class="lim">이 칸의 한계: 지도는 네 측정값 중 둘만 움직인 단면입니다(초기 용량·전압 편차는 평균). 엔진은 넷을 모두 보고 예측합니다.</div></div>
  <div data-dlg="mount"></div>
</div></section>''')

block('벤치', '''<section class="sec" id="bench" aria-labelledby="h-bench"><div class="wrap">
  <h2 id="h-bench">P10 엔진 벤치 — 회귀 엔진 9종을 같은 조건으로</h2>
  <div class="tags"><span class="tag nn">모델: 검증 평균 오차 · R² · 엔진 크기</span><span class="tag fly">현장: 성적표</span></div>
  <div class="panel">
    <div class="ptitle">엔진 벤치 기록 — 기본 설정, 시드 11</div>
    <div class="ctrl"><div class="group"><button class="bt primary" id="b-all" type="button">▶ 9종 모두 시운전</button><span class="val" id="b-prog"></span></div></div>
    <div class="ctrl"><div class="group"><button class="bt" id="b-rep" type="button">▶ 5번 나눠 다시 재기 (평균 ± 편차)</button><span class="val" id="b-rprog"></span></div></div>
    <div class="tblwrap"><table class="lb" id="b-tb"></table></div>
    <div class="cwrap"><canvas id="cvBench" class="wide" style="height:280px" aria-label="엔진별 저장 값 수(가로, 로그)와 검증 평균 오차(세로)"></canvas></div>
    <div class="insight" id="i-bench" aria-live="polite"></div>
  </div>
  <div class="explain"><h4>풀이</h4><ol>
    <li><b>평균 절대 오차(MAE)</b>는 예측이 실제 수명에서 평균 몇 회 벗어났는지입니다. 낮을수록 좋습니다. <b>R²</b>는 수명의 흩어짐 중 엔진이 설명한 몫이고, 1에 가까울수록 좋습니다.</li>
    <li><b>훈련 오차와 검증 오차의 차이</b>가 크면 훈련 셀을 외운 엔진입니다(트리·포레스트·부스팅에서 큽니다).</li>
    <li><b>저장 값</b>은 엔진이 예측할 때 들고 다니는 숫자의 개수입니다. k-최근접 이웃과 가우시안 프로세스는 훈련 셀을 통째로, 포레스트·부스팅은 트리 마디를, 선형 엔진은 숫자 5개만 저장합니다.</li>
    <li>신경망(DFF)은 벤치에서 120 에포크를 끝까지 돕니다. 검증 셀을 보고 멈추면 그 엔진만 검증 셀에 맞춰지기 때문입니다.</li>
    <li><b>5번 나눠 다시 재기</b>: 훈련·검증 800개를 다섯 번 다르게 섞어 600 · 200으로 나누고 매번 다시 배웁니다. 평균의 차이가 편차보다 작으면 순위를 믿지 않습니다.</li></ol>
    <div class="lim">이 벤치의 한계: 엔진마다 손잡이를 기본값 하나로만 맞췄습니다. 손잡이를 잘 돌리면 순위가 바뀔 수 있습니다.</div></div>
  <div class="bridge gen"><b>생성 AI로 치면</b> 언어 모델이 숫자를 내는 일(가격 추정, 점수 매기기)도 회귀입니다. 이때도 "평균 몇 점 틀리나"와 "한쪽으로 치우쳐 틀리나"를 함께 봐야 하고, 같은 시험 문제로 여러 모델을 견줍니다.<div class="lim">비유의 한계: 언어 모델은 숫자를 글자로 만들어 내므로, 이 페이지의 회귀 엔진처럼 손실을 직접 숫자 오차로 배우지 않는 경우가 많습니다.</div></div>
  <div data-dlg="bench"></div>
  <div class="quiz" data-quiz="bench"></div>
</div></section>''')

R('<p class="lead">신경망 도감에서 꺼낸 DFF 엔진(4 → 8 → 1)을 분해해,', '<p class="lead">신경망 도감에서 꺼낸 DFF 엔진(4 → 8 → 1, 출력에 시그모이드 없음)을 분해해,')
R('<tr><td>05</td><td><a href="#w5">⑤ 첫 시동</a></td><td>예측과 손실, 초기 손실 점검</td></tr>', '<tr><td>05</td><td><a href="#w5">⑤ 첫 시동</a></td><td>예측과 제곱 손실, 초기 손실 점검</td></tr>')

block('①', '''<section class="sec" id="w1" aria-labelledby="h-w1"><div class="wrap">
  <h2 id="h-w1"><span class="hex">1</span>작업장 ① 부품 창고 — 파라미터란 무엇인가 <span class="slide">카드 01</span></h2>
  <div class="tags"><span class="tag nn">모델: 가중치 w · 편향 b</span><span class="tag fly">현장: 엔진 조립 전 부품 선반</span></div>
  <div class="pair">
    <div><div class="tl">현장에서는</div>같은 설계도의 엔진이라도 어떤 부품 값을 끼우느냐에 따라 다르게 돕니다.</div>
    <div><div class="tr">모델에서는</div><b>가중치</b>는 입력 신호를 몇 배로 키울지(부호까지), <b>편향</b>은 합을 얼마나 밀어 올릴지 정합니다. 회귀에서는 출력이 그 합 자체(시그모이드 없음)입니다.</div>
  </div>
  <div class="panel">
    <div class="ptitle">입력 2개 → 출력 2개 — y₁ = 수명 점수, y₂ = 용량 유지 점수 (둘 다 Σ만, 양수 = 오래 감)</div>
    <div class="twin"><div class="cwrap tall"><canvas id="cvW1" aria-label="입력 두 개와 출력 두 개를 잇는 가중치 네 개와 편향 두 개"></canvas></div>
      <div><div class="ctrl" id="w1-sl" style="flex-direction:column;align-items:stretch"></div></div></div>
    <div class="ctrl"><div class="group"><button class="bt" id="w1-reset" type="button">카드 01의 값으로</button></div><div class="group"><span class="glabel">셀 A: 내부저항 +1.5σ, 온도 +1.2σ (실제 단수명) · 셀 B: −1.0σ, −0.8σ (실제 장수명)</span></div></div>
    <div class="tblwrap"><table class="cmp" id="w1-tb"></table></div>
    <div class="qc" id="qc1"></div>
    <div class="insight" id="i-w1" aria-live="polite"></div>
  </div>
  <div class="explain"><h4>풀이</h4><ol>
    <li>y₁ = w₁₁x₁ + w₁₂x₂ + b₁. <b>w의 첫째 첨자는 받는 뉴런, 둘째 첨자는 보내는 입력</b>입니다.</li>
    <li>카드 01의 값 그대로면 네 칸이 모두 틀립니다. 뜨겁고 저항 큰 셀 A를 오래 간다고, 셀 B를 짧다고 말합니다. 부호가 통째로 거꾸로입니다.</li>
    <li>네 가중치를 음수 쪽으로 돌려 보세요. "저항·온도가 클수록 수명이 짧다"는 관계를 부품 값으로 끼워 넣는 셈입니다.</li></ol>
    <div class="lim">이 칸의 한계: 사람이 손으로 부품을 끼웠습니다. 파라미터가 수십 개만 돼도 손으로는 못 맞춥니다. → ⑤~⑧</div></div>
  <div data-dlg="w1"></div>
  <div class="quiz" data-quiz="w1"></div>
</div></section>''')

block('②', '''<section class="sec" id="w2" aria-labelledby="h-w2"><div class="wrap">
  <h2 id="h-w2"><span class="hex">2</span>작업장 ② 뉴런 조립대 — 뉴런 하나, 파라미터 셋 <span class="slide">카드 02</span></h2>
  <div class="tags"><span class="tag nn">모델: z = w₁x₁ + w₂x₂ + b</span><span class="tag fly">현장: 부품 셋으로 만드는 수명 계산기</span></div>
  <div class="pair">
    <div><div class="tl">현장에서는</div>"저항 눈금 × 얼마 + 온도 눈금 × 얼마 + 보정값"으로 수명 점수를 내는 계산기 하나를 조립합니다.</div>
    <div><div class="tr">모델에서는</div>뉴런 하나는 가중합 z를 만들고, 회귀 출력이면 활성화 없이(항등) 그대로 냅니다. 학습되는 값은 w₁, w₂, b 세 개입니다.</div>
  </div>
  <div class="panel">
    <div class="ptitle">카드 02의 뉴런 — x₁ = 2, x₂ = 3 은 "내부저항 +2σ, 온도 +3σ"인 아주 뜨거운 셀 (실제 단수명)</div>
    <div class="twin"><div class="cwrap tall"><canvas id="cvW2" aria-label="입력 두 개와 가중치, 편향이 합쳐지는 뉴런 하나와 활성화 함수 곡선"></canvas></div>
      <div><div class="ctrl" id="w2-sl" style="flex-direction:column;align-items:stretch"></div>
      <div class="ctrl"><div class="group"><span class="glabel">활성화 f</span><span id="g-w2f"></span></div></div></div></div>
    <div class="eq" id="eq-w2"></div>
    <div class="ctrl"><div class="group"><button class="bt" id="w2-reset" type="button">카드 02의 값으로</button></div></div>
    <div class="qc" id="qc2"></div>
    <div class="insight" id="i-w2" aria-live="polite"></div>
  </div>
  <div class="explain"><h4>풀이</h4><ol>
    <li>카드 02 그대로 계산하면 z = 0.5×2 − 1×3 + 0.2 = −1.8입니다. 수명 점수가 음수, 곧 "수명이 짧다"입니다. 이번엔 맞습니다.</li>
    <li><a href="index.html#w2">판정기 편</a>에서는 같은 숫자가 "불량 확률 14%"라는 틀린 판정이었습니다. 같은 부품도 무엇을 맞히느냐(불량 점수냐 수명 점수냐)에 따라 맞기도 틀리기도 합니다. 온도에 붙은 w₂ = −1.0은 "뜨거울수록 수명이 짧다"에는 맞는 부호입니다.</li>
    <li>선형 회귀 엔진이 바로 이 뉴런 하나(입력 4개, 파라미터 5개)짜리 엔진입니다.</li></ol>
    <div class="lim">이 칸의 한계: 뉴런 하나는 평평한 비탈 하나입니다. "저항과 온도가 함께 높을 때 더 짧아진다" 같은 굽은 관계는 뉴런 여러 개가 필요합니다. → ③</div></div>
  <div data-dlg="w2"></div>
  <div class="quiz" data-quiz="w2"></div>
</div></section>''')

R('<div class="ptitle">정비 중인 DFF 엔진(작업장 ⑧에서 학습)의 설계도 — 셀을 바꿔 넣어 보세요</div>', '<div class="ptitle">정비 중인 DFF 회귀 엔진(작업장 ⑧에서 학습)의 설계도 — 셀을 바꿔 넣어 보세요</div>')
R('<div class="tags"><span class="tag nn">모델: 입력×출력 + 출력</span><span class="tag fly">현장: 엔진 무게 달기</span></div>', '<div class="tags"><span class="tag nn">모델: 입력×출력 + 출력</span><span class="tag fly">현장: 엔진 무게 달기 (판정기 편과 같은 계산)</span></div>')
R('<h3 style="font-size:15px;margin:14px 0 4px">엔진 9종의 무게 — 저장 값 × 4바이트 (FP32)</h3>', '<h3 style="font-size:15px;margin:14px 0 4px">회귀 엔진 9종의 무게 — 저장 값 × 4바이트 (FP32)</h3>')

block('⑤', '''<section class="sec" id="w5" aria-labelledby="h-w5"><div class="wrap">
  <h2 id="h-w5"><span class="hex">5</span>작업장 ⑤ 첫 시동 — 예측하고 손실 재기 <span class="slide">카드 05</span></h2>
  <div class="tags"><span class="tag nn">모델: 손실 = (예측 − 정답)²</span><span class="tag fly">현장: 조립한 엔진 첫 시동</span></div>
  <div class="pair">
    <div><div class="tl">현장에서는</div>조립한 엔진에 처음 시동을 겁니다. 처음엔 거칠어도 괜찮지만, 너무 이상한 소리가 나면 조립부터 의심합니다.</div>
    <div><div class="tr">모델에서는</div>회귀의 손실은 <b>평균제곱오차</b>입니다. 많이 틀릴수록 제곱으로 커져서, 크게 틀린 셀 하나가 손실을 끌어올립니다. 카드 05의 −ln P는 분류의 손실이고, 회귀에서는 이것이 자리를 바꿉니다.</div>
  </div>
  <div class="panel">
    <div class="ptitle">손실 곡선 — 예측이 정답에서 멀어질수록 제곱으로 커진다</div>
    <div class="cwrap tall"><canvas id="cvW5a" aria-label="예측 오차에 따른 제곱 손실 곡선과 현재 점"></canvas></div>
    <div class="ctrl"><div class="group"><label class="glabel" for="r-w5e">예측 − 정답</label><input type="range" id="r-w5e" min="-300" max="300" step="10" value="120"><span class="val" id="v-w5e">120회</span></div></div>
    <div class="eq" id="eq-w5"></div>
    <h3 style="font-size:15px;margin:14px 0 4px">초기 손실 점검 — 학습 전 DFF 엔진을 검증 셀 200개에 돌려 보기</h3>
    <div class="ctrl"><div class="group"><span class="glabel">초깃값 크기</span><span id="g-w5i"></span></div></div>
    <div class="minis" id="w5-minis"></div>
    <div class="qc" id="qc5"></div>
    <div class="insight" id="i-w5" aria-live="polite"></div>
  </div>
  <div class="explain"><h4>풀이</h4><ol>
    <li>수명을 120회 틀리면 제곱 손실은 14,400회²입니다. 학습에서는 표준화한 수명으로 재므로 (120 ÷ 표준편차)²로 작아집니다.</li>
    <li>늘 훈련 셀의 평균 수명만 말하는 엔진의 손실(표준화 기준)은 약 1입니다. 이것이 회귀의 기준선이고, 학습 전 엔진의 손실이 이보다 훨씬 크면 초깃값이 지나친 것입니다.</li>
    <li>초깃값을 크게 하면 엔진이 처음부터 엉뚱하게 큰 숫자를 내 손실이 크게 튑니다.</li></ol>
    <div class="lim">이 칸의 한계: 손실이 얼마나 큰지는 알았지만, 어느 파라미터를 어느 쪽으로 고쳐야 줄어드는지는 모릅니다. → ⑥</div></div>
  <div data-dlg="w5"></div>
  <div class="quiz" data-quiz="w5"></div>
</div></section>''')

R('<details class="fold"><summary>수식으로 보기</summary><p>∂L/∂z = σ(z) − y. 출력층:', '<details class="fold"><summary>수식으로 보기</summary><p>회귀: ∂L/∂z = 2(z − y). 출력층:')

block('⑧', '''<section class="sec" id="w8" aria-labelledby="h-w8"><div class="wrap">
  <h2 id="h-w8"><span class="hex">8</span>작업장 ⑧ 길들이기 라인 — 미니배치로 되풀이 <span class="slide">카드 08</span></h2>
  <div class="tags"><span class="tag nn">모델: 배치 · 스텝 · 에포크</span><span class="tag fly">현장: 새 엔진 길들이기 운전</span></div>
  <div class="pair">
    <div><div class="tl">현장에서는</div>셀 600개를 한 상자(배치)씩 넣고, 상자마다 한 번 조정하고(스텝), 600개를 한 바퀴 다 돌면 1 에포크입니다.</div>
    <div><div class="tr">모델에서는</div>DFF 회귀 엔진을 미니배치로 학습합니다. 에포크마다 검증 셀 200개로 손실과 평균 오차(회)를 재고, 검증 손실이 가장 낮았던 때의 파라미터를 남깁니다.</div>
  </div>
  <div class="panel">
    <div class="ptitle">길들이기 라인 — 훈련 600 · 검증 200 (시험 200은 봉인)</div>
    <div class="ctrl">
      <div class="group"><span class="glabel">배치 크기</span><span id="g-w8b"></span></div>
      <div class="group"><span class="glabel">옵티마이저 · 학습률</span><span id="g-w8o"></span></div>
      <div class="group"><button class="bt primary" id="w8-run" type="button">▶ 길들이기 시작</button><button class="bt" id="w8-reset" type="button">기본 기록으로</button></div>
    </div>
    <div class="twin"><div class="cwrap tall"><canvas id="cvW8a" aria-label="훈련·검증 손실 곡선"></canvas></div><div class="cwrap tall"><canvas id="cvW8b" aria-label="에포크별 검증 평균 오차 곡선"></canvas></div></div>
    <h3 style="font-size:15px;margin:14px 0 4px">행동으로 보기 — 지금 라인에 오른 상자 (훈련 셀 600개 중, 분홍 = 수명 하위 20% 셀)</h3>
    <div class="cards" id="cards8" aria-label="훈련 셀 600개 중 지금 스텝에 쓰는 배치"></div>
    <div class="minis" id="w8-minis"></div>
    <div class="cwrap tall"><canvas id="cvW8c" aria-label="검증 셀의 실제 수명과 예측 수명 산점도"></canvas></div>
    <div class="qc" id="qc8"></div>
    <div class="insight" id="i-w8" aria-live="polite"></div>
  </div>
  <div class="explain"><h4>풀이</h4><ol>
    <li><b>배치</b>: 한 스텝에 쓰는 셀 묶음. <b>스텝</b>: 파라미터를 한 번 고치는 일. <b>에포크</b>: 훈련 데이터를 한 바퀴 도는 일. 배치 32면 1 에포크 = 19스텝입니다.</li>
    <li>검사 기준(예시): 검증 평균 오차 30회 이하. 실제 기준은 보증 정책과 비용이 정합니다.</li>
    <li>훈련 손실은 끝까지 내려가도 검증 손실은 어느 에포크부터 다시 오를 수 있습니다. 그때 멈추는 것이 <b>조기 종료</b>입니다[10].</li></ol>
    <div class="lim">이 칸의 한계: 공장 A의 셀로만 길들였습니다. 재료가 바뀐 공장 B에서도 맞을까요? → ⑨</div></div>
  <div class="bridge gen"><b>생성 AI로 치면</b> 대형 언어 모델의 사전학습도 같은 고리입니다. 예측하고, 손실을 재고, 역전파와 옵티마이저로 고치는 일을 아주 큰 미니배치로 되풀이합니다.<div class="lim">비유의 한계: 언어 모델의 손실은 다음 토큰의 교차 엔트로피라, 이 회귀 엔진의 제곱 손실과는 다릅니다.</div></div>
  <div data-dlg="w8"></div>
  <div class="quiz" data-quiz="w8"></div>
</div></section>''')

block('⑨', '''<section class="sec" id="w9" aria-labelledby="h-w9"><div class="wrap">
  <h2 id="h-w9"><span class="hex">9</span>작업장 ⑨ 개조 공정 — 사전학습과 미세조정 <span class="slide">카드 09</span></h2>
  <div class="tags"><span class="tag nn">모델: 전체 미세조정 vs 어댑터(LoRA 방식)</span><span class="tag fly">현장: 새 공장 라인에 맞춘 엔진 개조</span></div>
  <div class="pair">
    <div><div class="tl">현장에서는</div>공장 B가 새 양극재를 쓰기 시작했습니다. 셀이 뜨거워지기 쉽고 수명이 짧습니다. 수명 시험을 마친 공장 B 셀은 아직 60개뿐입니다.</div>
    <div><div class="tr">모델에서는</div>공장 A 셀 600개로 배운 DFF 회귀 엔진(<b>사전학습</b>)을, 공장 B 셀 60개로 다시 고칩니다(<b>미세조정</b>). 전부 고치거나, 원래 가중치는 잠그고 작은 보정 행렬만 배웁니다(LoRA 방식[4]).</div>
  </div>
  <div class="panel">
    <div class="ptitle">공장 B 수명 예측 — 훈련 60 · 검증 140 (설명용 모형, 80 에포크)</div>
    <div class="ctrl"><div class="group"><span class="glabel">방법</span><span id="g-w9"></span></div><div class="group"><button class="bt primary" id="w9-run" type="button">네 방법 모두 비교</button></div></div>
    <div class="twin"><div class="cwrap tall"><canvas id="cvW9a" aria-label="동결된 가중치와 학습하는 가중치를 색으로 나눈 행렬 그림"></canvas></div><div class="cwrap tall"><canvas id="cvW9b" aria-label="방법별 공장 B 검증 평균 오차 막대"></canvas></div></div>
    <div class="tblwrap"><table class="cmp" id="w9-tb"></table></div>
    <div class="qc" id="qc9"></div>
    <div class="insight" id="i-w9" aria-live="polite"></div>
  </div>
  <div class="explain"><h4>풀이</h4><ol>
    <li><b>그대로 쓰기</b>: 공장 A의 습관 그대로라 공장 B 셀의 수명을 크게 길게 말합니다(과대예측).</li>
    <li><b>처음부터 B로만</b>: 셀 60개로 49개를 처음부터 배우니 데이터가 모자랍니다.</li>
    <li><b>전체 미세조정</b>: A에서 배운 것에서 출발해 49개를 모두 조금씩 고칩니다.</li>
    <li><b>어댑터만</b>: W₁은 잠그고, 보정 A·Bᵀ(8 + 4 = 12개)와 출력층(9개), 모두 21개만 배웁니다[4].</li></ol>
    <div class="lim">이 칸의 한계: 카드 09의 세 번째 단계 "선호 학습"은 언어 모델의 말투·안전성을 맞출 때 쓰는 단계라 여기서는 돌리지 않았습니다[9]. 셀 140개로 잰 차이라 몇 개만 달라져도 순위가 바뀔 수 있습니다.</div></div>
  <div data-dlg="w9"></div>
  <div class="quiz" data-quiz="w9"></div>
</div></section>''')

R('<div class="ptitle">용량 실험 — 훈련 셀 80개만으로 DFF 엔진, 은닉 뉴런 1~32개 (Adam 0.01, 전체 배치, 400 에포크)</div>', '<div class="ptitle">용량 실험 — 훈련 셀 80개만으로 DFF 회귀 엔진, 은닉 뉴런 1~32개 (Adam 0.01, 전체 배치, 400 에포크)</div>')
R('<canvas id="cvW10a" aria-label="은닉 뉴런 수에 따른 훈련·검증 손실">', '<canvas id="cvW10a" aria-label="은닉 뉴런 수에 따른 훈련·검증 평균 오차">')
R('<li>훈련 손실(파랑)은 뉴런이 늘수록 거의 0까지 내려갑니다. 셀 80개를 외운 것입니다. 검증 손실(빨강)은 작은 크기에서 가장 낮고, 큰 쪽으로 갈수록 크게 오릅니다.</li>',
  '<li>훈련 오차(파랑)는 뉴런이 늘수록 계속 내려갑니다. 셀 80개를 점점 외우는 것입니다. 검증 오차(빨강)는 작은 크기에서 가장 낮고, 중간에 오르내림이 있지만 큰 쪽으로 갈수록 다시 오릅니다.</li>')
R('<div class="lim">이 칸의 한계: 크기 하나만 바꿨습니다. 데이터가 충분하면 작은 엔진과 큰 엔진 중 무엇이 나을까요? → 대결</div></div>', '<div class="lim">이 칸의 한계: DFF의 크기 하나만 바꿨습니다. 정답 셀이 적을 때와 많을 때, 단순한 엔진과 복잡한 엔진의 승부는 어떻게 될까요? → 대결</div></div>')

block('대결', '''<section class="sec" id="duel" aria-labelledby="h-duel"><div class="wrap">
  <h2 id="h-duel">대결 — 수명 시험 셀이 적을 때, 단순한 엔진이냐 복잡한 엔진이냐</h2>
  <p class="lead">초파리 연구원은 <b>릿지</b>(벌점을 더한 선형 회귀, 저장 값 5개), 주판봇은 <b>그래디언트 부스팅</b>(트리 100그루)을 고릅니다. 판정 기준은 검증 셀 200개의 <b>평균 오차(회, 낮을수록 좋음)</b>이고, 훈련·검증을 <b>10번 다르게 나눠</b> 평균과 이긴 횟수로 판정합니다(평균 차이 1회 초과, 10번 중 8번 이상). 수명 시험은 오래 걸려서 정답 셀 수가 상황마다 다르므로 가정이 둘입니다: <b>가정 A</b> 정답 셀 40개, <b>가정 B</b> 600개.</p>
  <div class="duel">
    <div class="side l"><div class="head"><img id="d-fly" data-mood="fly_point" alt="" aria-hidden="true"><div><b style="color:var(--c-fly)">초파리 연구원 · 릿지</b><br><span class="muted">평평한 비탈 하나, 숫자 5개.</span></div></div><div data-dlg="dfly"></div></div>
    <div class="vs">VS</div>
    <div class="side r"><div class="head"><img id="d-robo" data-mood="robo_coin" alt="" aria-hidden="true"><div><b style="color:var(--c-robo)">주판봇 · 그래디언트 부스팅</b><br><span class="muted">트리 100그루, 굽은 계단.</span></div></div><div data-dlg="drobo"></div></div>
  </div>
  <div class="panel">
    <div class="ctrl"><div class="group"><span class="glabel">먼저 맞혀 보기</span><button class="bt" data-pred="fly" type="button" aria-pressed="false">초파리가 이길 것 같다</button><button class="bt" data-pred="robo" type="button" aria-pressed="false">주판봇이 이길 것 같다</button></div>
      <div class="group"><button class="bt primary" data-go type="button">결과 보기</button><button class="bt" data-close type="button" hidden>다시 닫기</button></div></div>
    <div class="duel-res" hidden>
      <p class="muted" style="font-size:13.5px;margin:0">막대 = 10번 나눈 검증 평균 오차의 평균(회). 짧을수록 좋습니다. 두 가정의 결과를 같은 크기로 나란히 놓았습니다.</p>
      <div id="d-bars"></div>
      <div id="d-say"></div>
      <div class="score"><span id="d-score"></span><span id="d-pred"></span></div>
    </div>
  </div>
  <div class="quiz" data-quiz="duel"></div>
</div></section>''')

block('출고', '''<section class="sec" id="ship" aria-labelledby="h-ship"><div class="wrap">
  <h2 id="h-ship">P11~P12 출고 — 2편 시뮬레이션 검증장으로</h2>
  <div class="tags"><span class="tag nn">모델: 엔진 선정 · 봉인 시험은 2편</span><span class="tag fly">현장: 출고 전표</span></div>
  <div class="panel">
    <div class="ptitle">출고 전표 — 벤치 순위로 고른 회귀 엔진, 바꿀 수 있음</div>
    <div class="ctrl"><div class="group"><span class="glabel">출고할 엔진</span><span id="g-ship"></span></div></div>
    <div class="minis" id="ship-minis"></div>
    <div class="insight" id="i-ship" aria-live="polite"></div>
  </div>
  <div class="next2"><b>2편 예고 — 시뮬레이션 검증장 (준비 중)</b>
    <ul style="margin:6px 0 0;padding-left:20px">
      <li>봉인한 시험 셀 200개를 한 번 열어, 출고한 판정기·예측 장치의 진짜 성적을 잽니다.</li>
      <li>라인 시뮬레이션: 판정기가 불량을 걸러 내고, 예측 장치가 남은 셀의 수명 등급을 매기는 두 엔진 연결 운전.</li>
      <li>수명 과대예측의 비용을 따져 보증 기간·교체 시기를 정하는 판단을 시뮬레이션합니다.</li>
      <li>공장 B처럼 재료가 바뀌는 상황(분포 이동)에서 엔진이 언제 다시 정비를 받아야 하는지 봅니다.</li>
    </ul></div>
</div></section>''')

R('<h2 id="h-sum">정리 — 데이터세트, 엔진 9종, 정비 작업장 10곳</h2>', '<h2 id="h-sum">정리 — 분류에서 회귀로, 엔진 9종, 정비 작업장 10곳</h2>')
R('<tr><td>모델</td><td>엔진</td><td>도감 엔진 9종</td></tr>', '<tr><td>모델</td><td>엔진</td><td>도감 회귀 엔진 9종</td></tr>\n    <tr><td>분류 vs 회귀</td><td>합격·불합격 판정 vs 수명 계기판</td><td>F1 vs 평균 오차(회)</td></tr>')
R('<tr><td>하이퍼파라미터</td><td>엔진 손잡이 · 공정 조건표</td><td>트리 깊이·수, k, γ, 은닉 수, 학습률, 배치</td></tr>', '<tr><td>하이퍼파라미터</td><td>엔진 손잡이 · 공정 조건표</td><td>λ, α, 트리 깊이·수, k, 길이 척도, 은닉 수, 학습률, 배치</td></tr>')
R('<tr><td>손실 · 역전파 · 옵티마이저</td><td>이상 소음 · 원인 추적 · 나사 조정</td><td>교차 엔트로피 · 49개 기울기 · Adam</td></tr>', '<tr><td>손실 · 역전파 · 옵티마이저</td><td>이상 소음 · 원인 추적 · 나사 조정</td><td>평균제곱오차 · 49개 기울기 · Adam</td></tr>')
R('<a href="regression.html"><b>수명 예측 장치 ① 엔진부</b><br>같은 셀로 수명(회)을 맞히는 자매편</a>', '<a href="index.html"><b>불량품 판정기 ① 엔진부</b><br>같은 셀로 불량을 가리는 자매편</a>')
R('<li>엔진 비유는 "갈아 끼우면 끝"처럼 보이게 합니다.', '<li>회귀 엔진의 평균 오차는 한 숫자라, 어느 셀에서 크게 틀리는지는 보여 주지 않습니다. 실제–예측 그림을 함께 봐야 합니다.</li>\n    <li>엔진 비유는 "갈아 끼우면 끝"처럼 보이게 합니다.')

# 바닥글 출처: 회귀 엔진 문헌
R('<tr><td>[12]</td><td>Breiman, L. (2001). Random Forests. Machine Learning 45, 5–32. · Friedman, J. H. (2001). Greedy function approximation: A gradient boosting machine. Annals of Statistics 29(5). · Cortes, C., Vapnik, V. (1995). Support-vector networks. Machine Learning 20.</td><td>엔진 창고 — 랜덤 포레스트, 그래디언트 부스팅, SVM</td></tr>',
  '<tr><td>[12]</td><td>Breiman, L. (2001). Random Forests. Machine Learning 45, 5–32. · Friedman, J. H. (2001). Greedy function approximation: A gradient boosting machine. Annals of Statistics 29(5).</td><td>엔진 창고 — 랜덤 포레스트, 그래디언트 부스팅</td></tr>\n    <tr><td>[13]</td><td>Hoerl, A. E., Kennard, R. W. (1970). Ridge regression: Biased estimation for nonorthogonal problems. Technometrics 12(1). · Tibshirani, R. (1996). Regression shrinkage and selection via the lasso. JRSS B 58(1). · Rasmussen, C. E., Williams, C. K. I. (2006). Gaussian Processes for Machine Learning. MIT Press.</td><td>엔진 창고 — 릿지, 라쏘, 가우시안 프로세스</td></tr>')
R('<td>데이터세트 — 실제 배터리 예측 연구는 충·방전 곡선을 쓴다</td>', '<td>데이터세트 — 수명의 정의(용량 80%), 실제 수명 예측 연구</td>')
R('<li>배터리 셀 1,000개(공장 A)와 400개(공장 B)의 측정값·불량 여부 —', '<li>배터리 셀 1,000개(공장 A)와 400개(공장 B)의 측정값·수명 —')
R('<li>엔진 9종은 이 페이지가 외부 라이브러리 없이 직접 구현한 단순판(예: 부스팅은 XGBoost 자체가 아니라 같은 원리의 작은 구현).', '<li>회귀 엔진 9종은 이 페이지가 외부 라이브러리 없이 직접 구현한 단순판(예: 부스팅은 XGBoost 자체가 아니라 같은 원리의 작은 구현, 가우시안 프로세스는 잡음 분산을 고정).')
R('<li>합격 기준(F1 0.80, BMS 메모리 8 KB, 초기 손실 ln 2 ± 0.25)은 설명용 예시값</li>', '<li>합격 기준(평균 오차 30회, BMS 메모리 8 KB, 초기 손실은 기준선의 2배 이하)은 설명용 예시값</li>')

# ── 감사 1회차 반영 (2026-11-14) ──
R('엔진 창고에서 카드를 누르면 판정기에 장착되고 바로 시운전됩니다.', '엔진 창고에서 카드를 누르면 예측 장치에 장착되고 바로 시운전됩니다.')
R('카드를 누르면 그 엔진이 판정기에 장착되고', '카드를 누르면 그 엔진이 예측 장치에 장착되고')
R('BMS) 칩에 넣을 판정기라면', 'BMS) 칩에 넣을 예측 장치라면')
R('훈련 손실은 계속 줄지만, 처음 보는 셀의 손실은 어느 크기부터 다시 늡니다.', '훈련 오차는 계속 줄지만, 처음 보는 셀의 오차는 어느 크기부터 다시 늡니다.')
R('<div class="ptitle">용량 실험 — 훈련 셀 80개만으로 DFF 회귀 엔진, 은닉 뉴런 1~32개 (Adam 0.01, 전체 배치, 400 에포크)</div>', '<div class="ptitle">용량 실험 — 훈련 셀 80개만으로 DFF 회귀 엔진, 은닉 뉴런 1~32개 (Adam 0.01, 전체 배치, 400 에포크, 시드 3개 평균)</div>')
R('검증 오차(빨강)는 작은 크기에서 가장 낮고, 중간에 오르내림이 있지만 큰 쪽으로 갈수록 다시 오릅니다.</li>', '검증 오차(빨강)는 작은 크기 쪽이 낮고, 큰 쪽으로 갈수록 다시 오릅니다. 시드 하나만 보면 중간 크기에서 순서가 뒤바뀌기도 해서, 시드 3개의 평균과 범위(옅은 막대)로 봅니다.</li>')
R('<div class="lim">이 섹션의 한계: 측정값과 수명의 관계는 설명을 위해 지어낸 공식입니다(저항과 온도가 함께 높을 때 수명이 더 짧아지는 굽은 관계 포함). 실제 셀의 물리 관계가 아닙니다.</div>',
  '<b>잡음 바닥</b>: 수명 공식에는 측정값으로 설명할 수 없는 잡음(표준편차 30회)이 들어 있습니다. 그래서 어떤 엔진도 평균 오차를 약 24회(30 × √(2/π)) 밑으로 꾸준히 내릴 수 없습니다. 벤치에서 이 선을 기준으로 읽습니다.</li></ol>\n    <div class="lim">이 섹션의 한계: 측정값과 수명의 관계는 설명을 위해 지어낸 공식입니다(저항과 온도가 함께 높을 때 수명이 더 짧아지는 굽은 관계 포함). 실제 셀의 물리 관계가 아닙니다. 실제 데이터에서는 잡음 바닥을 미리 알 수 없어, 같은 셀을 두 번 시험한 차이 등으로 짐작합니다.</div>')
R('<li><b>나누기</b>: 훈련 600 · 검증 200 · 시험 200(2편까지 봉인). 판정기 편과 같은 셀, 같은 나누기입니다.</li></ol>', '<li><b>나누기</b>: 훈련 600 · 검증 200 · 시험 200(2편까지 봉인). 판정기 편과 같은 셀, 같은 나누기입니다.</li>\n    <li>')
R('<li><b>평균 절대 오차(MAE)</b>는 예측이 실제 수명에서 평균 몇 회 벗어났는지입니다. 낮을수록 좋습니다. <b>R²</b>는 수명의 흩어짐 중 엔진이 설명한 몫이고, 1에 가까울수록 좋습니다.</li>',
  '<li><b>오차 세 가지</b>: 평균 절대 오차(MAE)는 "평균 몇 회 틀렸나"(이 페이지의 성적), RMSE는 크게 틀린 셀을 더 무겁게 친 평균(회), 평균제곱오차(MSE)는 학습이 줄이는 손실(회², 표준화 단위)입니다. <b>R²</b>는 수명의 흩어짐 중 엔진이 설명한 몫입니다. 1이면 완벽, 0이면 늘 평균만 말하는 엔진과 같고, <b>음수</b>면 그보다도 못합니다(⑨의 "그대로 쓰기").</li>\n    <li><b>잡음 바닥(점선, 약 24회)</b>: 상위 엔진들은 이미 바닥 가까이에 있습니다. 그 근처의 1~2회 차이는 엔진의 실력보다 잡음일 가능성이 큽니다.</li>')
R('<div class="lim">비유의 한계: 언어 모델은 숫자를 글자로 만들어 내므로', ' 언어 모델을 사람 취향에 맞출 때 쓰는 <b>보상 모델</b>도 답마다 점수 하나를 내는 회귀 엔진입니다. 보상 모델이 어떤 답을 실제보다 높게 매기면(과대예측) 언어 모델이 그 틈을 파고들 수 있어, 여기서 본 과대예측 문제와 닮았습니다.<div class="lim">비유의 한계: 언어 모델은 숫자를 글자로 만들어 내므로')
R('<li><b>그대로 쓰기</b>: 공장 A의 습관 그대로라 공장 B 셀의 수명을 크게 길게 말합니다(과대예측).</li>', '<li><b>그대로 쓰기</b>: 공장 A의 습관 그대로라 공장 B 셀의 수명을 크게 길게 말합니다(과대예측). R²가 음수인 것은 "늘 공장 B 평균만 말하기"보다도 못하다는 뜻입니다.</li>')
R('<li>늘 훈련 셀의 평균 수명만 말하는 엔진의 손실(표준화 기준)은 약 1입니다. 이것이 회귀의 기준선이고, 학습 전 엔진의 손실이 이보다 훨씬 크면 초깃값이 지나친 것입니다.</li>',
  '<li>늘 훈련 셀의 평균 수명만 말하는 엔진의 검증 손실(표준화 기준)은 1.14입니다. 이것이 회귀의 기준선이고, 학습 전 엔진의 손실이 이보다 훨씬 크면 초깃값이 지나친 것입니다.</li>\n    <li>학습 전 손실은 시드(초깃값 난수)에 따라 크게 달라집니다. 시드 하나가 우연히 기준선보다 낮게 나올 수도 있어, 시드 10개의 평균과 범위로 판정합니다.</li>')
R('<p class="muted" style="font-size:13.5px;margin:0">막대 = 10번 나눈 검증 평균 오차의 평균(회). 짧을수록 좋습니다. 두 가정의 결과를 같은 크기로 나란히 놓았습니다.</p>',
  '<p class="muted" style="font-size:13.5px;margin:0">막대 = 10번 나눈 검증 평균 오차의 평균(회). 짧을수록 좋습니다. 두 엔진 모두 기본 손잡이(릿지 λ 0.05, 부스팅 100그루·깊이 3)입니다.</p>')

R('<div class="quiz" data-quiz="w7"></div>', '')
R('<h2 id="h-factory">큰 그림 — 배터리 불량품 판정기 공장 12공정 (3D 모형)</h2>', '<h2 id="h-factory">큰 그림 — 배터리 수명 예측 장치 공장 12공정 (3D 모형)</h2>')
R('/*@@EN@@*/', '/*@@ER@@*/')
h = h.replace('href="index.html', 'href="classifier.html')
(B / 'reg.src.html').write_text(h, encoding='utf-8')
print('reg.src.html', len(h))
