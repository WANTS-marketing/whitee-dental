# 인수인계 · 진행 기록

## 소유·계정

| 항목 | 내용 |
|---|---|
| 소유 | 화이트e치과의원 창원점 / 마산점 |
| GitHub 저장소 | `WANTS-marketing/whitee-dental` (Public — GitHub Pages 무료 배포 조건). 조직에서 바로 만들었으므로 Transfer 단계 없음 |
| 호스팅 | GitHub Pages (시안 공유 → 최종 배포까지 동일) |
| 문의 폼 서비스 | Web3Forms — 키 발급 이메일: **미정** (병원 수신 이메일로 발급할 것) |
| 키 보관 위치 | GitHub 저장소 Secrets (`WEB3FORMS_ACCESS_KEY`). 값은 이 문서에 쓰지 않는다 |

## 도메인

- **기존 도메인 whiteedental.co.kr 사용 예정 (업체 명의), 오픈 시 연결**
  - apex(`@`)는 **A 레코드**, `www`는 **CNAME** (`wants-marketing.github.io`)
  - **기존 MX 레코드 유지**
  - **도메인 관리 계정 확인 필요** (구매처·로그인 계정·담당자)
- 현재 이 도메인에서 기존 사이트가 운영 중 → **오픈 전까지 DNS 변경 금지**
- 갱신일: 미확인 / 자동 갱신 여부: 미확인 ← 도메인 관리 계정 확인 시 기록
- 연결 절차: `docs/DEPLOYMENT.md` "도메인 연결"
- **기존 주소 이어받기:** 기존 사이트 치과스토리 글(`/bbs/board.php?bo_table=story&wr_id=N`)은 `404.html` 이 새 주소(`community/news-view.html?id=story-N`)로 자동 이동시킨다.
  글마다 기존 번호는 `assets/data/news.json` 의 `wrId`·`legacyUrl`. 다른 게시판(공지 등)을 옮기면 같은 방식으로 404.html 에 추가

## 기존 사이트 글 가져오기 (치과스토리 → 치과소식, 2026-11-05)

- 원본: https://whiteedental.co.kr/bbs/board.php?bo_table=story — 공개된 글 88개 전부 (게시판 상단 'Total 96건'은 삭제된 글이 포함된 카운터. 목록 7페이지는 비어 있고 wr_id 1·5·91 이후는 '글이 존재하지 않습니다')
- 다시 가져오기: `cd scripts/import && npm install` → `npm run fetch` (원본 HTML → `raw/`, 1초 간격) → `npm run build` (이미지 받기·줄이기 + 데이터 생성)
  - 받은 원본 이미지는 `scripts/import/cache/` (커밋 안 함, 약 1.6GB). 없으면 다시 받는다
  - 생성물: `assets/data/news.json`(목록) · `assets/data/news/story-N.html`(본문) · `assets/images/news/N/`(이미지, 가로 최대 1200px · 썸네일 720px)
  - 생성물을 직접 고치면 다시 build 할 때 덮어쓴다 → 고칠 것은 `build-story.js` 규칙(분류 CATEGORY_RULES, 본문 정리)으로
- 분류는 제목 키워드로 자동(진료안내·치료정보·임플란트·틀니·치아교정·병원소식). 지점(branch)은 제목만으로 정할 수 없어 모두 'both'
- 본문 정리: 글꼴·크기·색 인라인 스타일과 빈 문단 삭제, 굵게·색 강조 → `<strong>`, 밑줄 → `<mark>`(형광펜), 이미지 링크(view_image) 제거. 원래 글처럼 가운데 정렬
- 본문 문구는 기존 사이트 그대로 — 의료광고 심의 기준 검토는 별도

## 기존 사이트에서 옮긴 자료

### 치료사례 (시술 전후) 14건 — 2026-11-06

- 원본 게시판: https://whiteedental.co.kr/bbs/board.php?bo_table=gallery (wr_id 5~18)
- 다시 가져오기: `cd scripts/import && npm install` → `node fetch-gallery.js` (목록·원본 이미지 → `raw/gallery/`, 1초 간격) → `node build-gallery.js` (BEFORE·AFTER 나누기·흐림 미리보기 + `assets/data/cases.json`)
- ⚠️ **기존 사이트는 이 게시판 글 상세를 회원만 볼 수 있게 막아 두어**("글을 읽을 권한이 없습니다") 로그인 없이 가져올 수 있는 것만 옮겼다
  - 가져온 것: 목록의 제목·작성일(MM-DD)·썸네일 → 썸네일 이름으로 찾은 **원본 이미지 1장**(1000×600)
  - 작성 연도: 이미지 폴더 연월(`/data/editor/2610/` → 2026년 10월) + 목록 MM-DD
  - **못 가져온 것: 본문 텍스트**, 글 안에 이미지가 더 있었다면 두 번째 이후 이미지 → 본문은 이미지 위 안내 띠(교정 기간·내용)를 옮겨 적었다(`build-gallery.js` `CAPTIONS`, 환자 이니셜은 뺌). 원래 본문이 따로 있었다면 병원 관리자 계정으로 확인 필요
- 이미지 14장 모두 [안내 띠 / BEFORE | AFTER / 로고] 한 장 양식 → 흰 사진 테두리를 찾아 **자동으로 나눔(수동 확인 필요 0건)**
- 원본 합본 이미지(AFTER 가 그대로 보이고 환자 이니셜이 있음)는 사이트에도 저장소에도 올리지 않는다 — **이 저장소는 공개(Public)라 커밋하면 누구나 볼 수 있음**. 원본 14장 + 목록(`list.json`)은 프로젝트 밖 `자료/기존사이트-치료사례/` 에 보관 (오픈 후 기존 서버가 사라지므로 병원 자료와 함께 따로 백업할 것). 다시 만들 때는 `scripts/import/raw/gallery/` 에 넣고 build-gallery.js 실행 (`.gitignore`)
- 진료 분류: 제목에 '교정' → 치아교정, wr_id 5(교정·보철·임플란트) → 치아교정·보철·임플란트. wr_id 18 은 제목에 '교정'이 없지만 안내 띠가 '교정기간'이라 치아교정
- [ ] 병원 확인: 사진 게시 동의(환자 동의서) 유효 여부, 의료광고 심의 필요 여부, 지점(창원·마산) 정보(기존 글에 없음)

| 자료 | 원래 제목 | 작성일 | 원본 글 | 원본 이미지 | 새 파일 |
|---|---|---|---|---|---|
| 치료사례 18 | 화이트e치과 시술 전후(덧니, 개방교합 해소) | 2026-10-27 (목록 10-27 + 이미지 폴더 2026-10) | https://whiteedental.co.kr/bbs/board.php?bo_table=gallery&wr_id=18 | https://whiteedental.co.kr/data/editor/2610/30df551de57490d6124bf12064bbc658_1793054095_2954.jpg | `assets/images/cases/case-18-before.jpg` · `-after.jpg` · `-after-blur.jpg` |
| 치료사례 17 | 화이트e치과 시술 전후(부정교합 개선 교정) | 2026-10-07 (목록 10-07 + 이미지 폴더 2026-10) | https://whiteedental.co.kr/bbs/board.php?bo_table=gallery&wr_id=17 | https://whiteedental.co.kr/data/editor/2610/d10eb5052ca7e3a3cd1e1c19508fa9cc_1791332886_2322.jpg | `assets/images/cases/case-17-before.jpg` · `-after.jpg` · `-after-blur.jpg` |
| 치료사례 16 | 화이트e치과 시술 전후(치아배열 교정) | 2026-08-31 (목록 08-31 + 이미지 폴더 2026-08) | https://whiteedental.co.kr/bbs/board.php?bo_table=gallery&wr_id=16 | https://whiteedental.co.kr/data/editor/2608/cf69db3595d73a5aece148c47ea7a314_1788149606_8551.jpg | `assets/images/cases/case-16-before.jpg` · `-after.jpg` · `-after-blur.jpg` |
| 치료사례 15 | 화이트e치과 시술 전후(덧니 개선 교정) | 2026-05-27 (목록 05-27 + 이미지 폴더 2026-05) | https://whiteedental.co.kr/bbs/board.php?bo_table=gallery&wr_id=15 | https://whiteedental.co.kr/data/editor/2605/454ed50e19393ef4c90805adde0ef862_1779868330_5295.jpg | `assets/images/cases/case-15-before.jpg` · `-after.jpg` · `-after-blur.jpg` |
| 치료사례 14 | 화이트e치과 시술 전후(덧니 개선 교정) | 2026-05-11 (목록 05-11 + 이미지 폴더 2026-05) | https://whiteedental.co.kr/bbs/board.php?bo_table=gallery&wr_id=14 | https://whiteedental.co.kr/data/editor/2605/0ce7bb52f5f93a1122f8224652c15c68_1778460248_1964.jpg | `assets/images/cases/case-14-before.jpg` · `-after.jpg` · `-after-blur.jpg` |
| 치료사례 13 | 화이트e치과 시술 전후(치아돌출 및 치열개선 목적 교정) | 2026-04-27 (목록 04-27 + 이미지 폴더 2026-04) | https://whiteedental.co.kr/bbs/board.php?bo_table=gallery&wr_id=13 | https://whiteedental.co.kr/data/editor/2604/e1ad33083ab315fdd27835dd9b34b1bf_1777253454_3635.jpg | `assets/images/cases/case-13-before.jpg` · `-after.jpg` · `-after-blur.jpg` |
| 치료사례 12 | 화이트e치과 시술 전후(전치부 총생 및 교합 개선 목적 교정) | 2026-03-20 (목록 03-20 + 이미지 폴더 2026-03) | https://whiteedental.co.kr/bbs/board.php?bo_table=gallery&wr_id=12 | https://whiteedental.co.kr/data/editor/2603/94449997946be0968ddd203b3ef0e3bf_1773971582_719.jpg | `assets/images/cases/case-12-before.jpg` · `-after.jpg` · `-after-blur.jpg` |
| 치료사례 11 | 화이트e치과 시술 전후(전치부 반대교합 개선 및 치아 사이 공간 개선 교정) | 2026-03-12 (목록 03-12 + 이미지 폴더 2026-03) | https://whiteedental.co.kr/bbs/board.php?bo_table=gallery&wr_id=11 | https://whiteedental.co.kr/data/editor/2603/9f4a90d115f29e136e4ee22842a17e83_1773279008_8676.jpg | `assets/images/cases/case-11-before.jpg` · `-after.jpg` · `-after-blur.jpg` |
| 치료사례 10 | 화이트e치과 시술 전후(삐뚤한 치아교정) | 2025-09-23 (목록 09-23 + 이미지 폴더 2025-09) | https://whiteedental.co.kr/bbs/board.php?bo_table=gallery&wr_id=10 | https://whiteedental.co.kr/data/editor/2509/2990960d34258c58a405f8a4f1c1eef1_1758590397_8362.jpg | `assets/images/cases/case-10-before.jpg` · `-after.jpg` · `-after-blur.jpg` |
| 치료사례 9 | 화이트e치과 시술 전후(삐뚤한 치아교정) | 2025-09-12 (목록 09-12 + 이미지 폴더 2025-09) | https://whiteedental.co.kr/bbs/board.php?bo_table=gallery&wr_id=9 | https://whiteedental.co.kr/data/editor/2509/767135d9815ac5b173548011e73787c1_1757651489_4745.jpg | `assets/images/cases/case-9-before.jpg` · `-after.jpg` · `-after-blur.jpg` |
| 치료사례 8 | 화이트e치과 시술 전후(덧니 해소 교정) | 2025-05-28 (목록 05-28 + 이미지 폴더 2025-05) | https://whiteedental.co.kr/bbs/board.php?bo_table=gallery&wr_id=8 | https://whiteedental.co.kr/data/editor/2505/4cb4ad7c54ae787735b23f38af6485f4_1748387561_2623.jpg | `assets/images/cases/case-8-before.jpg` · `-after.jpg` · `-after-blur.jpg` |
| 치료사례 7 | 화이트e치과 시술 전후(성장기 교정) | 2025-04-29 (목록 04-29 + 이미지 폴더 2025-04) | https://whiteedental.co.kr/bbs/board.php?bo_table=gallery&wr_id=7 | https://whiteedental.co.kr/data/editor/2504/8d61bc47d977034cf485f0cb1db358ad_1745900245_1948.jpg | `assets/images/cases/case-7-before.jpg` · `-after.jpg` · `-after-blur.jpg` |
| 치료사례 6 | 화이트e치과 시술 전후(덧니 교정) | 2025-04-07 (목록 04-07 + 이미지 폴더 2025-04) | https://whiteedental.co.kr/bbs/board.php?bo_table=gallery&wr_id=6 | https://whiteedental.co.kr/data/editor/2504/1c122374826fe7d954ac194596487cee_1743988190_6898.jpg | `assets/images/cases/case-6-before.jpg` · `-after.jpg` · `-after-blur.jpg` |
| 치료사례 5 | 화이트e치과 시술 전후(교정, 보철, 임플란트) | 2025-03-07 (목록 03-07 + 이미지 폴더 2025-03) | https://whiteedental.co.kr/bbs/board.php?bo_table=gallery&wr_id=5 | https://whiteedental.co.kr/data/editor/2503/e8a1936e1cf073499027ad1c1d2aa8a7_1741306019_9898.jpg | `assets/images/cases/case-5-before.jpg` · `-after.jpg` · `-after-blur.jpg` |

## 사용한 외부 서비스·라이브러리

| 이름 | 용도 | 라이선스·조건 | 계정 |
|---|---|---|---|
| Pretendard (jsDelivr CDN) | 웹폰트 | SIL Open Font License 1.1 (상업 사용 가능) | 없음 |
| Web3Forms | 상담문의 메일 발송 | 무료 플랜 월 250건 | 미정 (병원 이메일로 발급) |
| GitHub Pages / Actions | 호스팅·배포 | Public 저장소 무료 | WANTS-marketing |
| 카카오맵 지도 퍼가기 (API 키 없음) | 병원소개 ③오시는길 지도 — 코드 붙여넣을 위치: `about/clinic.html` 의 `▼▼▼ [창원점]/[마산점] 카카오맵` 주석 | 카카오맵 이용약관. 지도 로드 시 방문자 정보가 카카오로 전송됨 → 개인정보처리방침 반영 필요 | 없음 (퍼가기 코드 생성에 카카오 로그인 필요할 수 있음) |
| 네이버 지도 단축 링크 | 병원소개 ③오시는길 "네이버 지도로 보기" 버튼 (창원 naver.me/FY3f3LdP · 마산 naver.me/xWTYEspr) | 링크만 사용 | 없음 |
| Pexels 스톡 이미지 | 임시 이미지 | Pexels License (아래 표) | 없음 |
| 아이콘 (인라인 SVG) | 메뉴·진료 아이콘·SNS | 이 프로젝트에서 직접 그림 | — |
| uiverse.io — [elijahgummer/bright-chicken-11](https://uiverse.io/elijahgummer/bright-chicken-11) | 오른쪽 플로팅 퀵메뉴 [인스타그램][블로그] 버튼 hover 효과(빛 지나가기·바깥 링) — Tailwind 를 순수 CSS 로 바꿔 `assets/css/common.css` 퀵메뉴 부분에 적용 | MIT License (상업 사용·수정 가능, 저작권·라이선스 고지 유지) | 없음 |
| uiverse.io — [doniaskima/nervous-wombat-2](https://uiverse.io/doniaskima/nervous-wombat-2) | 하단 지점 바로가기 바(창원점·마산점 칸) hover 줄무늬 채우기 — 지점 색 4칸 줄무늬가 위·아래에서 맞물림, mix-blend-mode 제외하고 순수 CSS 로 `assets/css/common.css` 에 적용 | MIT License (상업 사용·수정 가능, 저작권·라이선스 고지 유지) | 없음 |

## 이미지 출처 (작업하며 계속 기록)

### 임시 이미지 — `assets/images/temp/` (2026-11-02 추가)

실제 병원 사진을 받기 전, 디자인 확인용으로 넣은 스톡 이미지입니다. **실제 사진이 오면 교체 대상입니다.**

- 출처: Pexels (https://www.pexels.com) — 다운로드 주소 `images.pexels.com/photos/{ID}/`
- 라이선스: [Pexels License](https://www.pexels.com/license/) — 상업적 사용 무료, 출처 표기 의무 없음, 수정 가능.
  금지: 이미지 자체를 그대로 판매, 사진 속 인물이 병원·제품을 보증하는 것처럼 표현, 상표·로고로 사용
- ⚠️ 의료진·환자·원내 사진처럼 **실제 병원을 대표하는 것처럼 보일 수 있는 사진은 오픈 전 반드시 실제 사진으로 교체** (의료광고·소비자 오인 방지)
- 치료사례는 기존 사이트 '시술 전후' 14건의 실제 사진으로 바꿨습니다 (2026-11-06, 위 '기존 사이트에서 옮긴 자료'). 예전 스톡 더미 사진은 지웠습니다

| 파일 (assets/images/temp/) | Pexels 사진 ID | 촬영자 | 라이선스 |
|---|---|---|---|
| hero-01.jpg | [3779713](https://www.pexels.com/photo/3779713/) | Andrea Piacquadio | Pexels License |
| hero-02.jpg | [3845625](https://www.pexels.com/photo/3845625/) | Pexels 페이지에서 확인 | Pexels License |
| hero-03-event-implant.jpg | [6502306](https://www.pexels.com/photo/6502306/) | cottonbro studio | Pexels License |
| hero-bg.jpg, og-image.jpg, tour-*-01/05 | [6812453](https://www.pexels.com/photo/6812453/) | Pavel Danilyuk | Pexels License |
| doctors-bg.jpg, tour-*-04/01 | [8459996](https://www.pexels.com/photo/8459996/) | Pexels 페이지에서 확인 | Pexels License |
| branch-bar-bg.jpg, tour-*-05/03 | [305568](https://www.pexels.com/photo/305568/) | Pexels 페이지에서 확인 | Pexels License |
| clinic-implant.jpg | [6502340](https://www.pexels.com/photo/6502340/) | cottonbro studio | Pexels License |
| clinic-aesthetic.jpg | [12474261](https://www.pexels.com/photo/12474261/) | Pexels 페이지에서 확인 | Pexels License |
| clinic-orthodontics.jpg | [5524021](https://www.pexels.com/photo/5524021/) | Anna Avilova | Pexels License |
| clinic-wisdom-scaling.jpg, visual-wisdom-scaling.jpg(본문·공지 더미), tour-*-06 | [6812456](https://www.pexels.com/photo/6812456/) | Pavel Danilyuk | Pexels License |
| visual-general.jpg(치과소개 본문) | [5355715](https://www.pexels.com/photo/5355715/) | Tima Miroshnichenko | Pexels License |
| clinic-general.jpg | [33359445](https://www.pexels.com/photo/33359445/) | Marta Branco | Pexels License |
| visual-intro.jpg(진료과목 본문·공지 더미), news-dummy-04.jpg | [12745979](https://www.pexels.com/photo/12745979/) | Esma Karagoz | Pexels License |
| news-dummy-01.jpg | [3845767](https://www.pexels.com/photo/3845767/) | Anna Shvets | Pexels License |
| news-dummy-02.jpg | [5355720](https://www.pexels.com/photo/5355720/) | Tima Miroshnichenko | Pexels License |
| news-dummy-03.jpg | [6627424](https://www.pexels.com/photo/6627424/) | kaboompics.com | Pexels License |
| tour-*-02/03, tour-*-04/02 | [30902075](https://www.pexels.com/photo/30902075/) · [4269276](https://www.pexels.com/photo/4269276/) | Duy Tân Đại học · Cedric Fauntleroy | Pexels License |

### 실제 화면에 쓰는 스톡 사진 — `assets/images/` (temp 아님)

| 파일 | 출처 | 촬영자 | 라이선스 |
|---|---|---|---|
| clinic-implant.jpg (메인 진료안내 임플란트 카드 — 2026-11-06 교체, 7200×4066 → 1600×904) | 제공 자료 `자료/메인페이지/pc0040716569.jpg` — **출처·라이선스 확인 필요** (구매한 스톡 이미지인지, 웹 사용 범위) | 확인 필요 | 확인 필요 |
| banner-sub.jpg (서브페이지 공통 배너 — 임시, 실제 원내 사진으로 교체 대상) | [Pexels 8459996](https://www.pexels.com/photo/8459996/) (temp/doctors-bg.jpg 와 같은 사진) | Pexels 페이지에서 확인 | Pexels License |
| hero-03-night.jpg (메인 히어로 3번, 좌우 반전·축소) | [Unsplash J39gT2aIgOM](https://unsplash.com/photos/J39gT2aIgOM) | Klarin Steffens | Unsplash License (상업 사용·수정 가능, 출처 표기 의무 없음) |

### 교체 방법
같은 파일명으로 `assets/images/` 에 넣으면 자동으로 실제 사진이 먼저 표시됩니다 (`temp/` 는 실제 파일이 없을 때만 사용).
모두 교체한 뒤 `assets/images/temp/` 폴더를 지우면 됩니다. 의사 사진(`doctor-*.jpg`)은 임시 이미지 없이 그라데이션 자리만 표시됩니다.
참고: 실제 파일을 먼저 찾고 없으면 temp 로 넘어가는 방식이라, 교체 전까지는 브라우저 콘솔에 404가 보입니다 (동작에는 영향 없음).

## 병원에 받아야 할 자료 (TODO)

- [x] 지점별 인스타그램·블로그 주소 4개 (`assets/js/site-data.js` → `social`)
- [ ] **서브페이지 공통 배너 사진 1장** (가로 2400px 이상, 원내 전경, 두 지점 공통 느낌 — 특정 지점 간판·인물이 드러나지 않는 컷) → `assets/images/banner-sub.jpg` 로 덮어쓰면 치과소개·의료진 소개·병원소개·진료과목 배너가 모두 바뀜. 받은 원내 사진(240307_MED_0090 간판 · 0180 로고 · 0162 진료실)은 마산점이 드러나 공통 배너로는 쓰지 않음
- [ ] **지점별 네이버 예약 링크 2개** (`assets/js/site-data.js` → `branches[].naverBooking`) — 퀵메뉴 '네이버예약' 칩·모바일 '+' 메뉴에 쓰임. 받기 전까지는 각 지점 네이버 지도(`naverMap`)로 대신 연결됨
- [ ] 히어로 4번 임플란트 이벤트 기간
- [ ] FAQ 01·02 답변 (03·04는 기존 사이트 문구로 작성 — 병원 확인)
- [ ] 이벤트 가격 배지(임플란트 49만원 · 교정 350만원~ · 어린이 교정 100만원) 유지 여부·기간, 의료광고 심의 검토
- [ ] 창원점 대중교통 안내, 마산점 주차 안내
- [ ] 협력업체 로고 이미지 29개, 기공센터 소개 문구, 부산대학병원 협력·경찰 자문 상세 내용
- [x] 정호석 대표원장 진료과 표기 확인 — 원내 약력(2023.04)에도 "통합치의학과", 통합치의학과 전문의 추가 (2026-11-06)
- [ ] 의료진 사진, 약력 검수 (기존 사이트 이미지에서 옮겨 적어 오탈자 가능 — `assets/js/site-data.js` 의 `career`)
  - 이은주·정호석: 원내 약력 파일(`자료/원내 원장님 약력_2023.04월 원내약력.hwp`)과 대조해 반영함 (2026-11-06). 나머지 6명(권진선·이휘소·송희태·조용정·조혜진·김영우)은 아직 원내 약력 자료 없음
  - 같은 파일에 있는 **조세인 원장(구강악안면외과)** 은 사이트 의료진에 없음 — 현재 근무 여부 병원 확인 후 추가
- [ ] **약력 분류 병원 확인** — 메인 의료진 패널은 약력을 학력 / 경력 / 학회 활동으로 자동 분류해 보여준다 (`assets/js/main.js` `initDoctors` 의 `classify`)
  - 규칙: "보건복지부 인증 ○○ 전문의" → 전문의(굵게) · 졸업·석사·박사·학사 → 학력 · 학회·연맹의 회원·정회원·인정의·펠로우 → 학회 활동 · 나머지 → 경력
  - 분류가 애매해 경력으로 들어간 항목 (병원 확인 필요):
    - 정호석 — "원광대학교 치과대학원 수료"(학력?), "대한치과보철학회 인증 우수보철치과의사과정 수료"
    - 이은주 — "대한치과교정학회 우수포스터 수상"
    - 송희태 — "인코그니토·인비절라인·MTA(Mini tube appliance) 인증의", "「Plus+ smile excellence」 2016 편저", "대한치과교정학회 우수증례상 (2020, 2022)"
    - 이휘소 — "대한치과의사협회지 2021.06 논문 저자", "오스템 엔도 세미나, 김평식 엔도 세미나 수료"
  - 다르게 분류해야 하면 `site-data.js` 에 그룹을 직접 적는 방식으로 바꾸는 것을 권장
- [x] 오시는길 카카오맵 퍼가기 코드 2개 (2026-11-02 적용). 카카오 장소정보 주소(창원 "301호", 마산 "본관 9-10층")는 사이트 표기와 달라 지도 아래 주소 블록을 CSS로 숨김 — 카카오맵 장소정보 수정 요청 여부는 병원과 상의
- [x] 히어로 3번(평일 야간진료) 사진 — Unsplash 야경 건물 사진(좌우 반전)으로 교체 (2026-11-05). 원내·건물 실사진으로 바꾸려면 assets/images/hero-03-night.jpg 교체
- [ ] 배경 제거된 상반신 사진(PNG, 세로 1200px 이상, 같은 크롭 기준) — 메인 의료진 섹션 인물 나열용. **받음(7명, 2026-11-04)**: 이은주(2026-11-06 배경 투명 PNG 로 교체)·권진선·이휘소·김영우·정호석·조혜진·송희태 (흰 배경 400×664 — 고해상도 받으면 교체 권장) / **남은 1명**: 조용정. (정정원 원장 퇴사로 사이트에서 삭제, 2026-11-06) 파일명 `assets/images/doctor-{영문 이름}-cut.png` (예: doctor-lee-eunju-cut.png, `assets/images/README.md` 표 참고). 지금은 실루엣 플레이스홀더
- [ ] 공식 로고 고해상도(SVG 또는 2배 PNG) — 현재 1배 PNG(logo.png) 적용됨, 원내 사진, 진료 사진
- [ ] 흰색 로고 파일 요청 (SVG 또는 2배 PNG, 투명 배경) — 메인 투명 헤더(히어로 위)·푸터용. 지금은 컬러 logo.png 를 CSS filter 로 흰색 처리 중 (main.css '투명 헤더', common.css .logo__img--white)
- [ ] 비급여 진료비용 표
- [ ] 개인정보처리방침 전문 (Web3Forms 처리 위탁 문구 포함), 상담 정보 보유 기간
- [ ] **기존 홈페이지 상담문의 74건 이전 여부 (병원 확인)** — 이름·연락처·상담 내용이 든 개인정보라 **옮기지 않는 것을 기본**으로 함. 옮겨야 한다면 병원이 이용 목적·보유 기간·동의 범위를 확인한 뒤, 서버 연결 후 관리자만 볼 수 있게 이전 (상담 현황 공개 목록에 섞지 않는 것을 권장)
- [ ] 회원 이용약관 (서버 연결·회원가입 때)
- [ ] 주차·대중교통 안내

## 서버 연결 (회원·게시판·상담문의·관리자)

**`docs/API-SPEC.md` 참고 — `assets/js/api.js` 만 교체하면 서버 연결됨.** 화면 코드는 `window.API` 함수만 부르고 저장 방식을 모른다.
함수 이름·입력값·반환 형식은 유지하고 함수 안쪽만 바꾼다. 어떤 서버를 쓸지는 아직 정하지 않음(특정 서비스에 묶지 않음). Supabase 를 고를 때의 테이블·RLS 예시는 API-SPEC 부록(선택 사항).

지금 상태 (2026-11-06): 상담문의는 **서버 없는 시안** — 폼(`faq/contact-write.html`·빠른상담) → 상담문의 목록(`faq/contact.html`) → 비밀번호 열람 → 관리자 답변(`admin/`) 흐름이 더미 JSON + 브라우저 탭 저장(sessionStorage)으로 동작. 더미 비밀번호는 모두 `1234`. 병원 메일 알림은 지금처럼 Web3Forms.

- [ ] ⚠️ **오픈 전 필수: 서버 연결 또는 최소한 Web3Forms 키(`WEB3FORMS_ACCESS_KEY`) 등록** — 지금 시안 주소에는 키가 비어 있어 접수한 글이 방문자 브라우저 탭에만 남고 병원에는 전달되지 않음 (2026-11-06 확인). 그래서 키가 없으면 모든 상담 폼 버튼 아래와 접수 완료 문구에 '시안 화면입니다. 실제로 병원에 전달되지 않습니다. 문의는 전화로 부탁드립니다. 창원점 055-716-2884 · 마산점 055-255-2000' 이 나온다 (api.js `isDeliveryReady`). 키를 등록하면 자동으로 사라지고 원래 '접수되었습니다' 문구
- [ ] 서버 선택 (병원 또는 회사 명의 계정 — 개인 계정 금지) · 비용·데이터 보관 위치(국외 이전 여부) 확인
- [ ] 상담문의 8개 함수 연결 (`listInquiries` · `getInquiry` · `createInquiry` · `adminListInquiries` · `adminGetInquiry` · `answerInquiry` · `updateInquiryStatus` · `deleteInquiry`)
- [ ] **API-SPEC 3장 '서버에서 반드시 처리할 것'** 전부 — 비밀번호 해시·틀린 횟수 제한, 목록은 공개 필드만, 관리자 인증·권한, 스팸(같은 연락처 10분 내 재등록·링크 글)·요청 횟수 제한, 보관 기간 지나면 파기
- [ ] 관리자 로그인 + `/admin/` 접근 막기 (지금은 로그인 없이 열림 — 화면 맨 위 '시안' 안내)
- [ ] 메일 알림을 서버에서 보내게 되면 api.js `notifyByEmail` 호출 제거
- [ ] 서버 연결 후 api.js `isDeliveryReady()` 가 true 를 돌려주게 (시안 안내 자동 제거)
- [ ] 공지·치과소식·치료사례·FAQ 함수 연결 (API-SPEC 4장) — 치료사례 사진은 로그인 사용자에게만 주소 제공
- [ ] 카카오 로그인 (Kakao Developers 앱, Redirect URI 에 시안 주소 + 최종 도메인) · 이메일 회원가입 유지 여부 결정
- [ ] 메인 이벤트 배너를 관리자에서 바꾸려면 `getBanners` 추가 (지금은 index.html 에 직접 적혀 있음)
- [ ] 개인정보처리방침에 상담 수집 항목(비밀번호 포함)·보관 기간·처리 위탁(서버·메일 서비스) 반영

## 작업 시 지킬 것

- 새 외부 서비스·라이브러리·폰트·이미지를 추가하면 이 문서와 `docs/DEPLOYMENT.md` 를 갱신
- 비밀번호·키 값은 절대 문서·코드에 쓰지 않는다 (이름과 보관 위치만)
- 커밋 전 개인 계정 이름·개인 이메일이 코드에 들어가지 않았는지 검색
