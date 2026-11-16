# ⑤ 배터리 열폭주 실험 랩 — 실험 기록 CSV 열 설명

[⑤ 배터리 열폭주 실험 랩](https://adminmrobo.github.io/how_to_make_ai_model_factory_version/blast.html)의 "내 실험 기록 CSV" 버튼과 이 폴더의 예시 파일은 같은 열을 씁니다.

| 파일 | 내용 |
|---|---|
| `blast_trials_300.csv` | 예시 데이터 300회 — 페이지의 가정 모형에서 시드 2026으로 뽑음 (`node code/make_blast_data.js`) |
| `blast_news_4.csv` | 뉴스 사례 4점 (1,300 kg 압착: 100% 화염, 70% 연기, 50·30% 변화 없음) |

| 열 | 뜻 |
|---|---|
| `trial_id` | 실험 번호 |
| `soc_pct` | 충전율 (%), 0~100 |
| `force_kg` | 압착 힘 (kg): 650 · 1,300 · 2,000 |
| `shape` | 셀 형태: `cylindrical`(원통형) · `prismatic`(각형) · `both`(뉴스 사례, 두 형태 모두) |
| `shape_code` | 형태 부호: +1 원통형 · −1 각형 · 0 둘 다 |
| `ambient_c` | 주변 온도 (°C): 25 · 40 |
| `result` | 결과 단계 번호: 0 < 1 < 2 |
| `result_label` | `none`(변화 없음) · `smoke`(연기) · `fire`(화염) |
| `onset_s` | 연기·불꽃이 시작된 시간(초). 변화 없음이면 빈칸 |
| `peak_c` | 최고 표면 온도 (°C) |

페이지 모델 식: η = b·(충전율−70)/10 + c·ln(압력/1300) + d·형태 + e·(온도−25)/10, P(연기 이상) = σ(a_연기 + η), P(화염) = σ(a_화염 + η).
가정 모형 값: a_연기 1.735 · a_화염 −3.178 · b 2.04 · c 1.5 · d 0.3 · e 0.5.

> 모든 값은 **설명용 가정 모형**에서 뽑은 데이터입니다. 실제 배터리 시험 결과가 아닙니다. 온도·시간 값의 모양도 설명용입니다.

Colab 노트북: [`notebooks/blast_thermal_runaway_logistic.ipynb`](../notebooks/blast_thermal_runaway_logistic.ipynb) ·
[Colab에서 열기](https://colab.research.google.com/github/adminmrobo/how_to_make_ai_model_factory_version/blob/main/notebooks/blast_thermal_runaway_logistic.ipynb)
