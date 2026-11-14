# 표지 그림 지시문 — cover_00 · cover_04 · cover_05

연구실 스킬 v1.14 "낮의 연구실" 기준. 그림을 만들어 주시면 `img/<키>.webp`(1600×900)로 넣고 각 페이지의 `data-img` 자리(지금은 대체 그림)를 바꾼 뒤 `cover_manifest.json`의 status를 고칩니다.

**통일 규칙:** cover_01·01r·03과 같은 하얀 연구실, 같은 U자 두 줄 컨베이어, 같은 네 캐릭터(전신). 다른 것은 라인 위 제품뿐입니다. cover_00(첫 페이지)만 단지 전경입니다.

**참고 이미지 (함께 올리기):** GitHub `adminmrobo/fruitfly-lab-expressions`의 박사·조수·초파리 연구원·주판봇 기본 표정(E13) 4장. 이미 받은 표지(cover_01 등)가 있으면 함께 올리면 통일이 쉽습니다.

**아직 남은 표지:** cover_01 · cover_01r · cover_03은 기존 지시문(`COVER_01_…md`, `COVER_01r_…md`, `COVER_03_…md`)을 그대로 쓰면 됩니다.

---

## cover_00 — 자율주행차 배터리 AI 공장 — 공장 단지 전경

| 항목 | 내용 |
|---|---|
| 키 · 판 | cover_00 · L (16:9, 1920 이상) |
| 페이지 | `index.html (공장 목록 · 첫 페이지)` |
| 장면 (한국어 요약) | 햇빛 드는 하얀 산업 단지 미니어처를 위에서 비스듬히 본 장면. 작은 공장 건물 여러 채와 시험동, 멀리 이웃 시멘트 공장. 박사가 강의하듯 단지 지도를 가리킴 |
| 대체 글 (alt) | 연구실 식구 넷이 작은 공장 건물들이 모인 AI 공장 단지 모형 앞에서 강의하듯 공장을 소개하는 장면 |

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
Bright daytime laboratory mood, soft natural sunlight, clean white surfaces, light lavender, mint and pink accents.
Scene: a bright white lecture-lab room with a large tabletop miniature industrial park seen from a slightly high angle: five small factory buildings in soft pastel colors along a gentle road (one with a tiny assembly line and engine blocks, one with a gauge dial, one long building with a conveyor and flat battery modules, one with tiny dark-blue solar cells on its roof, one small glass test building with a little conveyor of fish shapes), two empty plots marked only with small dashed fences, and far in the background a small gray cement plant with a rotating kiln tube and a silo. A small plain white toy self-driving car drives along the road.
All four characters together, each shown FULL BODY from head to feet (no cropping at the waist or knees):
chibi scientist, thin teal rectangular glasses, spiky black hair with one white streak, small ponytail at the back, white lab coat over black vest and tie, standing at the center back like a lecturer, presenting the miniature park with an open palm and holding a short pointer;
girl researcher, long pink hair with two round buns and a navy streak, blue eyes, white lab coat over lavender hoodie, jeans, at the right side, holding a tablet toward the viewer as if demonstrating (blank screen, no text);
anthropomorphic fruit fly researcher, black body, big red compound eyes, blue helmet with a gold stripe and pink and blue cables, white lab coat over a black vest, black gloves, transparent wings, on the left facing right, leaning in with a magnifying glass over the solar-cell building;
boxy beige retro CRT-monitor robot, dark green screen face with mint pixel eyes and mouth, short antenna topped with a red-brown abacus bead, gray segmented arms, two small tank treads, on the right facing left, rolling along the road and holding a wooden abacus.
Visual metaphor of the topic: one curriculum turned into a small walkable factory park — each building is a different lesson (program, data analysis, model analysis), all on one table for an easy live demonstration.
Composition: keep every face and hand inside the central safe area (12% margin left and right, 10% top, 18% bottom); keep the bottom-left corner plain, bright and simple.
Mood: welcoming, clear, the start of a guided tour.
No text, no letters, no numbers, no logos, no weapons, no cigarettes, no alcohol, no blood, no real brands, no company logos.
```

---

## cover_04 — 시제품 테스트 랩실 — 생선 통조림 분류 장비

| 항목 | 내용 |
|---|---|
| 키 · 판 | cover_04 · L (16:9, 1920 이상) |
| 페이지 | `testlab.html (시제품 테스트 랩실)` |
| 장면 (한국어 요약) | 같은 연구실의 작은 시험 라인. 물고기 모형이 컨베이어를 따라 게이트를 지나 색이 다른 통조림 통 7개로 갈라짐. 한 마리에 빨간 고리 |
| 대체 글 (alt) | 연구실 시험 라인에서 연구실 식구 넷이 물고기 분류 장비를 시험하며 통조림 통으로 갈라지는 물고기를 살피는 장면 |

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
Bright daytime laboratory mood, soft natural sunlight, clean white surfaces, light lavender, mint and pink accents.
Scene: inside the same bright white laboratory, a small tabletop test line: two parallel conveyor belts joined by a U-turn, small measuring gauges (calipers and a height bar) over the belt, a little sorting gate with a swinging arm, and at the end seven small open tin cans in seven different soft colors. Seven kinds of simple stylized fish (different body shapes: tall round, long flat, small slim, etc.) ride the belt; one fish has a red ring around it. A crate of fresh fish on ice sits at the start of the line.
All four characters together, each shown FULL BODY from head to feet (no cropping at the waist or knees):
chibi scientist, thin teal rectangular glasses, spiky black hair with one white streak, small ponytail at the back, white lab coat over black vest and tie, standing at the center back, holding a clipboard with blank paper and checking the cans;
girl researcher, long pink hair with two round buns and a navy streak, blue eyes, white lab coat over lavender hoodie, jeans, at the right side, holding a fish gently with both hands over a gauge, measuring it;
anthropomorphic fruit fly researcher, black body, big red compound eyes, blue helmet with a gold stripe and pink and blue cables, white lab coat over a black vest, black gloves, transparent wings, on the left facing right, leaning in with a magnifying glass toward the fish with the red ring;
boxy beige retro CRT-monitor robot, dark green screen face with mint pixel eyes and mouth, short antenna topped with a red-brown abacus bead, gray segmented arms, two small tank treads, on the right facing left, pointing proudly at a high bar on a small blank scoreboard while holding a wooden abacus.
Visual metaphor of the topic: a device that looked perfect in the lab meets real fish for the first time — most go to the right can, one does not.
Composition: keep every face and hand inside the central safe area (12% margin left and right, 10% top, 18% bottom); keep the bottom-left corner plain, bright and simple.
Mood: curious, a little suspense, the moment the real test begins.
No text, no letters, no numbers, no logos, no weapons, no cigarettes, no alcohol, no blood, no real brands, no company logos.
```

---

## cover_05 — ④ 태양광 패널 셀 생산 공장 — 6시그마와 판정 기준

| 항목 | 내용 |
|---|---|
| 키 · 판 | cover_05 · L (16:9, 1920 이상) |
| 페이지 | `solar.html (④ 태양광 패널 셀 생산 공장)` |
| 장면 (한국어 요약) | 같은 연구실의 셀 라인. 짙은 남색 태양광 셀이 흐르고, 라인 시작에 색이 다른 웨이퍼 상자 셋(수입처), 창밖 절반은 낮·절반은 밤(교대), 벽에 종 모양 곡선 그림(글자 없음) |
| 대체 글 (alt) | 연구실 태양광 셀 라인에서 연구실 식구 넷이 수입처가 다른 웨이퍼와 셀의 판정 기준을 두고 의논하는 장면 |

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
Bright daytime laboratory mood, soft natural sunlight, clean white surfaces, light lavender, mint and pink accents.
Scene: inside the same bright white laboratory, a small tabletop solar-cell line: two parallel conveyor belts joined by a U-turn carrying small square dark-navy solar cells with thin silver lines; at the start three wafer crates in three different colors (blue, orange, purple); a small light box testing a cell, and a small sorting gate with one cell set aside in a red tray. The large window behind is split: the left half bright daytime sky, the right half a calm night sky with stars (shift work). On the wall, a simple bell-shaped curve drawing with one vertical line, no text or numbers.
All four characters together, each shown FULL BODY from head to feet (no cropping at the waist or knees):
chibi scientist, thin teal rectangular glasses, spiky black hair with one white streak, small ponytail at the back, white lab coat over black vest and tie, standing at the center back, pointing at the bell-curve drawing on the wall with an open palm;
girl researcher, long pink hair with two round buns and a navy streak, blue eyes, white lab coat over lavender hoodie, jeans, at the right side, holding one solar cell up to the light with both hands;
anthropomorphic fruit fly researcher, black body, big red compound eyes, blue helmet with a gold stripe and pink and blue cables, white lab coat over a black vest, black gloves, transparent wings, on the left facing right, leaning in with a magnifying glass toward the purple wafer crate;
boxy beige retro CRT-monitor robot, dark green screen face with mint pixel eyes and mouth, short antenna topped with a red-brown abacus bead, gray segmented arms, two small tank treads, on the right facing left, pushing a stack of finished cells forward while holding a wooden abacus.
Visual metaphor of the topic: the same cell line behaves a little differently by supplier, day or night, so the pass line on the bell curve must move.
Composition: keep every face and hand inside the central safe area (12% margin left and right, 10% top, 18% bottom); keep the bottom-left corner plain, bright and simple.
Mood: thoughtful, friendly debate, the moment before choosing the rule.
No text, no letters, no numbers, no logos, no weapons, no cigarettes, no alcohol, no blood, no real brands, no company logos.
```

---

**고칠 때 (같은 대화에서):** `Same four characters, same art style and composition. Change only: {고칠 점}. Still no text.`