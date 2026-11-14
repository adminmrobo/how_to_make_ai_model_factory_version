# 표지 지시문 — 01 배터리 불량품 판정기 ① 엔진부 제작

연구실 스킬 v1.14 "낮의 연구실" 기준. 그림을 받으면 ai-lab-explainer 18-15 절차로 `index.html`의 `data-img="cover_01"` 자리(지금은 대체 표지)에 넣고 `cover_manifest.json`의 `status`를 고칩니다.

**두 표지 통일 규칙:** 판정기 표지(cover_01)와 수명 예측 장치 표지(cover_01r)는 **같은 연구실, 같은 조립 라인 배치, 같은 네 캐릭터의 같은 자리·같은 포즈**로 그립니다. 다른 곳은 컨베이어 위 제품 차체의 앞면 하나뿐입니다(판정기 = 초록·빨강 표시등 두 개, 예측 장치 = 바늘 계기판). 두 장을 나란히 놓았을 때 "같은 공장, 다른 제품"으로 보여야 합니다. 페이지 안 3D 공장도 같은 규칙(같은 12공정 배치, 같은 캐릭터 자리, 제품 얼굴만 다름)을 따릅니다.

| 항목 | 내용 |
|---|---|
| 키 · 판 | cover_01 · L (16:9, 1920 이상) |
| 제품 | 자율주행차 대용량 배터리의 **불량품 판정기** (분류 모델을 엔진으로 단 장치) |
| 장소 (앵커) | D 현장 — 햇빛이 드는 하얀 연구실 안 작은 엔진 조립 라인: 두 줄 컨베이어(U자로 이어짐), 왼쪽에 민트색 "도감관" 진열장 두 개, 라인 시작에 납작한 차량용 대용량 배터리 모듈 더미, 라인 끝에 작은 흰색 자율주행차 모형(지붕 센서) |
| 주제 은유 | 컨베이어 위 상자형 판정기 차체 앞면에 초록·빨강 둥근 표시등 두 개. 조수가 엔진 블록 하나를 차체에 끼우려는 순간 |
| 네 캐릭터 포즈 (두 표지 공통, 넷 모두 머리부터 발끝까지 전신) | 박사: 가운데 뒤에서 라인을 손바닥으로 가리킴 / 조수: 오른쪽 옆에서 엔진 블록을 두 손으로 들고 차체에 끼우려 함 / 초파리: 왼쪽에서 오른쪽을 보며 진열장의 작은 엔진 블록을 돋보기로 살핌 / 주판봇: 오른쪽에서 왼쪽을 보며 진열장의 가장 큰 엔진 블록을 가리키고 주판을 듦 |
| 대체 글 (alt) | 연구실 엔진 조립 라인에서 연구실 식구 넷이 진열장의 엔진 블록 하나를 골라, 표시등 두 개가 달린 배터리 불량품 판정기 차체에 끼우려는 장면 |
| 짝 표지와 다른 점 | cover_01r(수명 예측 장치)와 배경·배치·캐릭터 모두 같고, 차체 앞면만 다름 |

**참고 이미지 (함께 올리기):** GitHub `adminmrobo/fruitfly-lab-expressions`의 박사·조수·초파리 연구원·주판봇 기본 표정(E13) 4장. 짝 표지를 먼저 받았다면 그 그림도 함께 올려 "같은 장면, 차체 앞면만 바꿔 줘"로 요청하면 통일이 가장 쉽습니다.

**Genspark에 붙여 넣기 ↓**
```
웹페이지 맨 위에 거는 표지 그림 1장을 만들어 줘.
- 비율 16:9, 가로 1920px 이상
- 첨부한 참고 이미지의 네 캐릭터(박사, 조수, 초파리 연구원, 주판봇)를 같은 그림체·같은 외형으로, 넷 모두 등장
- 그림 안에 글자·숫자·로고를 넣지 말 것
- 얼굴과 손은 가장자리에서 떨어진 가운데 영역에, 왼쪽 아래 구석은 밝고 단순하게
아래 영어 프롬프트를 그대로 써 줘.

Website top cover illustration, wide 16:9.
Match the art style, proportions and colors of the attached reference images exactly
(if there are no reference images: 16-bit RPG style pixel art, bold dark outline, 2-3 tone shading, small highlights).
Bright daytime laboratory mood, soft natural sunlight through large windows, clean white walls, light lavender, mint and pink accents.
Scene: inside a bright white laboratory, a small tabletop assembly line: two parallel conveyor belts joined by a U-turn, two mint-green glass display cabinets on the left whose shelves hold small colorful engine blocks (each a different color and shape), a stack of flat rectangular electric-vehicle battery modules (large-capacity, plain, no labels) at the start of the line, and at the far end of the line a small plain white toy-like self-driving car model with a small rooftop sensor.
All four characters together, each shown FULL BODY from head to feet (no cropping at the waist or knees):
chibi scientist, thin teal rectangular glasses, spiky black hair with one white streak, small ponytail at the back, white lab coat over black vest and tie, standing at the center back and presenting the line with an open palm;
girl researcher, long pink hair with two round buns and a navy streak, blue eyes, white lab coat over lavender hoodie, jeans, standing at the right side holding one engine block with both hands, about to slot it into the device chassis;
anthropomorphic fruit fly researcher, black body, big red compound eyes, blue helmet with a gold stripe and pink and blue cables, white lab coat over a black vest, black gloves, transparent wings, on the left facing right, leaning in with a magnifying glass toward a small engine block on the display shelf;
boxy beige retro CRT-monitor robot, dark green screen face with mint pixel eyes and mouth, short antenna topped with a red-brown abacus bead, gray segmented arms, two small tank treads, on the right facing left, pointing at the biggest engine block on the display shelf while holding a wooden abacus.
Visual metaphor of the topic: a box-shaped device chassis on the conveyor with two small round indicator lamps on its front, one green and one red (no text); one engine block is about to be slotted into the open chassis.
Composition: keep every face and hand inside the central safe area (12% margin left and right, 10% top, 18% bottom); keep the bottom-left corner plain, bright and simple; the light falls on the device chassis and the engine block being slotted in.
Mood: curious, friendly rivalry, the moment before the result.
No text, no letters, no numbers, no logos, no weapons, no cigarettes, no alcohol, no blood, no real brands, no car brand logos, no battery brand labels.
```

**짝 표지를 이미 받았을 때 (같은 대화에서):** `Same image, same four characters in the same places and poses, same lab and line. Change only the front of the device chassis on the conveyor to: a box-shaped device chassis on the conveyor with two small round indicator lamps on its front, one green and one red (no text). Still no text.`

**고칠 때 (같은 대화에서):** `Same four characters, same art style and composition. Change only: {고칠 점}. Still no text.`
