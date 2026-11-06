# 이미지 목록 (플레이스홀더)

실제 사진은 아래 파일명 그대로 **이 폴더**에 넣으면 자동으로 표시됩니다.
이 폴더에 파일이 없으면 → `temp/` 의 같은 이름 임시 이미지(Pexels) → 그것도 없으면 은은한 그라데이션 배경만 보입니다.
(파일명은 화면에 표시되지 않고, img alt 와 이 목록으로만 확인)

**출처·라이선스를 반드시 `docs/HANDOVER.md`의 "이미지 출처" 표에 기록하세요.**

| 파일명 | 위치 | 권장 크기 |
|---|---|---|
| `hero-bg.jpg` | 메인 히어로 뒤 어두운 배경 (원내 사진) | 1920×900 |
| `hero-01.jpg` | 히어로 슬라이드 1 (진료 장면) | 1500×750 |
| `hero-02.jpg` | 히어로 슬라이드 2 (상담 장면) | 1500×750 |
| `hero-03-night.jpg` | 히어로 슬라이드 3 (평일 야간진료) — 밤에 창마다 불이 켜진 건물 (Unsplash, 좌우 반전·가로 3600px 로 줄임, 2026-11-05) | 3600×1329 |
| `hero-03-event-implant.jpg` | 히어로 슬라이드 4 (임플란트 이벤트) | 1500×750 |
| `doctors-bg.jpg` | 메인 의료진 섹션 배경 (유리 원형 오브제, 위에 흰 막 90% = 사진 10%) | 2400×1500 |
| `doctor-lee-eunju.jpg` | 이은주 대표원장 (창원) | 600×750 (4:5) |
| `doctor-kwon-jinseon.jpg` | 권진선 원장 (창원) | 600×750 |
| `doctor-lee-hwiso.jpg` | 이휘소 원장 (창원) | 600×750 |
| `doctor-kim-youngwoo.jpg` | 김영우 원장 (창원·마산 겸직) | 600×750 |
| `doctor-jeong-hoseok.jpg` | 정호석 대표원장 (마산) | 600×750 |
| `doctor-song-heetae.jpg` | 송희태 원장 (마산) | 600×750 |
| `doctor-cho-yongjeong.jpg` | 조용정 원장 (마산) | 600×750 |
| `doctor-cho-hyejin.jpg` | 조혜진 원장 (마산) | 600×750 |
| `doctor-{영문 이름}-cut.png` (예: `doctor-lee-eunju-cut.png`, 위 원장별 사진 파일명 + `-cut.png`) | 메인 의료진 섹션 인물 나열용 **배경 제거된 상반신 사진** — 투명 PNG, 세로 1200px 이상, 모든 원장 같은 크롭 기준(머리 위 여백·어깨선 높이 동일). 사진 칸 아래 끝 기준으로 놓여 머리·어깨선이 한 줄로 맞는다. 없으면 인물 실루엣 플레이스홀더가 보인다(임시 인물 사진 쓰지 않음) | 세로 1200px 이상 |
| `clinic-implant.jpg` | 진료안내 카드 — 임플란트 | 900×560 |
| `clinic-orthodontics.jpg` | 진료안내 카드 — 치아교정 | 900×320 |
| `clinic-aesthetic.jpg` | 진료안내 카드 — 심미치료 | 740×460 |
| `clinic-wisdom-scaling.jpg` | 진료안내 카드 — 사랑니·스케일링 | 700×460 |
| `clinic-general.jpg` | 진료안내 카드 — 일반치료 (넓은 카드) | 1460×380 |
| `case-orthodontics-before.jpg` / `-after.jpg` | 치료사례 — 치아교정 | 600×800 |
| `case-prosthetics-before.jpg` / `-after.jpg` | 치료사례 — 보철치료 | 600×800 |
| `case-implant-before.jpg` / `-after.jpg` | 치료사례 — 임플란트 | 600×800 |
| `news-dummy-01~04.jpg` | 치과소식 더미 썸네일 (실데이터 연결 시 삭제) | 750×870 |
| `branch-bar-bg.jpg` | 하단 지점 바로가기 배경 (데스크 전경) | 1920×640 |
| `banner-sub.jpg` | **서브페이지 상단 배너 공통 1장** (치과소개·의료진 소개·병원소개·진료과목 5) — 같은 이름으로 실제 원내 사진을 넣으면 전체 교체. 지금은 임시 스톡(Pexels 8459996, 대기실·복도, 1920×1280) — 가로 2400px 이상 원내 전경으로 교체 권장 (docs/HANDOVER.md) | 2400×1600 이상 |
| `banner-clinic.jpg` | **병원소개 배너만** (about/clinic.html) — 마산점 진료실 통로(240307_MED_0163) 세로 사진에서 참고 이미지(자료/서브/Rectangle 1682.png) 구도대로 가로 띠(2400×777, 약 3.1:1)로 자른 것. 바꾸려면 같은 이름으로 교체, 지우면 `sub.css` `.sub-visual__bg--clinic` 도 지워 공통 배너로 | 2400×777 |
| `tour-changwon-01~06.jpg`, `tour-masan-01~06.jpg` | 병원소개(about/clinic.html) ②내부 둘러보기 갤러리 (개수·캡션은 `assets/js/site-data.js` 의 `tour`). **실제 사진 적용(2026-11-05, 긴 변 최대 2000px)** — 창원점·마산점 각 6장 | 1400×1050 (4:3) 이상 |
| `icons/quick-implant.png`, `quick-orthodontics.png`, `quick-general.png`, `quick-wisdom-scaling.png`, `quick-aesthetic.png` | 홈 퀵바(빠른 진료 안내) 아이콘 — 투명 PNG. 바꿀 때 index.html 의 width·height·`--h`(원본 높이)도 함께 수정 | 원본 크기 그대로(현재 1배) · 2배 크기 또는 SVG 권장 |
| `icons/naver-blog.png` | 퀵메뉴(오른쪽 플로팅 블로그 버튼·모바일 + 메뉴) 블로그 아이콘 — 네이버 블로그 말풍선, 투명 PNG 129×120 (제공 원본 "네이버 AI-06.png" 여백 잘라 축소). 표시 높이 19~24px | 바꿀 때 components/quick.html 의 width·height 도 함께 수정 |
| `icons/instagram.png` | 퀵메뉴(오른쪽 플로팅 인스타그램 버튼·모바일 + 메뉴) 인스타그램 로고 — 공식 그라데이션 로고, 투명 PNG 96×96 (제공 원본 "img.png" 여백 잘라 축소). 표시 20~26px | 바꿀 때 components/quick.html 의 width·height 도 함께 수정 |
| `og-image.jpg` | SNS 공유 썸네일 | 1200×630 |
| `logo.png` | 공식 로고 — 헤더(원본 색)·푸터(CSS로 흰색). 449×93 (2026-11-05 교체, 화면 198×41 · 모바일 150px 로 표시 ≈ 2배) | SVG 받으면 교체 |

> 치료사례 사진은 환자 동의서가 있는 사진만 사용합니다. 2차에서는 Supabase Storage 비공개 버킷으로 옮깁니다.
