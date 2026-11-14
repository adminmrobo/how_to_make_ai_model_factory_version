# 01번 「배터리 불량품 판정기 ① 엔진부 제작」 이미지 제작 명세서

## 1. 그림체와 고정 외형
캐릭터 팩 `CHAR_lab4` 1.4 (fruitfly-lab-expressions @ 86d04ac). 18-3 그림체, 18-4 고정 외형을 그대로 따른다. 주판봇은 v2.

## 2. 필요한 그림 전체

| 키 | 판 | 쓰는 곳 | 상태 |
|---|---|---|---|
| `cover_01` | L | index.html 맨 위 | **생성 대기** — 지금은 대체 표지(벌집 무늬 + 네 캐릭터 한 줄) |
| `cover_01r` | L | regression.html 맨 위 (회귀 편) | **생성 대기** — 지금은 대체 표지. 지시문 `COVER_01r_battery_life_regressor.md` |
| 말풍선·등장인물·대결 머리·3D 공장 캐릭터 표정 38종 | A~D | index.html | 기본 팩에 있음 (새로 그리지 않음) |

페이지에 쓰는 표정 키: `doc_front` `doc_think` `doc_magic` `doc_judge` `doc_board` · `asst_smile` `asst_report` `asst_firm` `asst_spark` `asst_shock` `asst_proud` · `fly_point` `fly_magnify` `fly_arms` `fly_coffee` `fly_clip` `fly_cry` · `robo_smile` `robo_coin` `robo_calc` `robo_happy` `robo_sigh` `robo_blush` `robo_wow` `robo_meh` `robo_chart` · `sia_explain` `sia_signal` `sia_smile` `sia_guide` · `moa_tea` `moa_cheer` `moa_report` `moa_smile` · `x1_hint` `x2_hint` `x3_hint`

## 2-1. 3D 공장의 전신 캐릭터 (두 페이지 공통)
캐릭터 팩 동작 팩(C8) fight 1.2의 서기(idle) 시트 6장을 128px로 넣는다: 박사 `D1` · 조수 `A1` · 시아 `S1` · 모아 `M1` · 초파리 `F1` · 주판봇 `R1` (합계 약 159 KB, 동작 그림 예산 600 KB 안). 자리: P2 조수, P3 시아, P4 모아, P6 주판봇, P8 초파리, P11 박사 — 판정기·예측 장치 두 공장이 같다. 키 비율은 C3(박사 1.00 · 조수 0.90 · 주판봇 0.72 · 초파리 0.41), 인턴은 조수에 맞춤. 박사·조수 좌우 반전 없음. 동작 팩을 못 읽으면 표정 그림(상반신)으로 대체한다.

## 3. 새로 그릴 그림
표지 두 장뿐이다(판정기 `cover_01`, 예측 장치 `cover_01r`). 프롬프트·포즈·alt는 `COVER_01_battery_model_factory.md`, `COVER_01r_battery_life_regressor.md`.

엔진(모델) 조립 공장 3D 그림(12공정, 도감관, 시운전·정비 고리), 판정 경계 지도, 벤치 그래프, 신경망 그림, 손실·학습 곡선, 행렬 격자는 모두 페이지 코드(Canvas 2D)가 그린다. 그림 파일이 필요 없고, 그림 안에 개념 효과(기울기, 손실 곡선)를 그려 넣지 않는다.

## 4. 일관성 지침
- 생물 앵커가 아닌 페이지(D 현장 앵커)라 현미경·초파리 해부 소품을 넣지 않는다.
- 대결 결과(조건부 C)를 암시하지 않는다 — 표지는 결과 전 장면.
- 실제 배터리 회사의 로고·상표·셀 모양(특정 규격 표기)을 넣지 않는다.

## 5. 넘겨받은 뒤 처리 (18-15)
1. 16:9·1600 이상·글자 없음·캐릭터 외형 확인 → 2. 안전 영역 → 3. WebP 1600×900(220 KB 이하)·960×540 → 4. `build/page.src.html`의 `.cover .frame` 안 캔버스·`.cast4`·`.cap`을 `<picture>`+`<img class="art">`로 바꿈 → 5. 390·768·1280 폭 확인 → 6. `cover_manifest.json`의 `status`를 `ok`로.

## 6. 매니페스트
`cover_manifest.json` 참고.
