# 화이트e치과 홈페이지

화이트e치과의원 창원점 · 마산점 공식 홈페이지 (1차: 정적 화면)

- 소유: 화이트e치과의원 창원점 / 마산점 (제작·관리: WANTS-marketing)
- 저장소: https://github.com/WANTS-marketing/whitee-dental
- 시안 공유 주소: https://wants-marketing.github.io/whitee-dental/
- 최종 도메인(예정): whiteedental.co.kr — 오픈 시 연결 (`docs/HANDOVER.md` 참고)

## 기술 구성

- 순수 HTML / CSS / JavaScript (프레임워크·빌드 도구 없음)
- 폰트: Pretendard (jsDelivr CDN)
- 호스팅: GitHub Pages (GitHub Actions로 배포)
- 상담문의: 게시판형 — FAQ > 상담문의 = 목록(`faq/contact.html`) · 작성(`faq/contact-write.html`). 지금은 **서버 없는 시안**(더미 JSON + 브라우저 탭 저장). 병원 메일 알림은 Web3Forms
- 서버 연결: `docs/API-SPEC.md` 참고, `assets/js/api.js` 함수 안쪽만 교체 (특정 서비스에 묶이지 않음)

### 시안 확인용 더미 비밀번호

- 상담문의 목록(`faq/contact.html`)의 더미 상담 글 11건은 **비밀번호가 모두 `1234`** 입니다 (`assets/data/inquiries.json`)
- 새로 쓴 글·관리자 답변은 그 브라우저 탭에만 저장되고, 탭을 닫으면 더미로 돌아갑니다
- 관리자 화면 `admin/` 은 시안이라 로그인 없이 열립니다 (실제 운영 시 관리자 인증 필요)

## 로컬에서 실행하기

헤더·푸터를 `fetch`로 불러오기 때문에 **파일을 더블클릭하면 메뉴가 안 보입니다.** 로컬 서버로 열어 주세요.

```bash
# 1) 환경변수 파일 만들기 (처음 한 번)
cp .env.example .env        # 값 채우기 — .env 는 커밋되지 않음

# 2) 환경변수 → assets/js/config.js 생성
node scripts/build-config.js

# 3) 로컬 서버 실행 (아래 중 하나)
npx serve .                  # 또는 VS Code "Live Server" 확장
```

### 어떤 주소로 열어야 하나

모든 CSS·JS·컴포넌트 경로가 **상대경로**(`./assets/…`, 컴포넌트는 `{{ROOT}}/…`)라서 아래 두 방식 모두 똑같이 동작합니다. (404 나는 파일 없음 — 2026-11-05 확인)

| 서버 루트 | 여는 주소 |
|---|---|
| `whitee-dental` 폴더 (VS Code에서 이 폴더를 열고 Live Server, 또는 `npx serve .`) | `http://localhost:5500/` (serve 는 `:3000`) |
| 상위 폴더 (`회사` 폴더를 열고 Live Server) | `http://localhost:5500/whitee-dental/` |

※ 서버 루트와 주소가 안 맞으면(예: `whitee-dental` 폴더를 루트로 열고 `/whitee-dental/` 로 접속) 페이지 자체가 404 입니다.
※ `hero-01.jpg`·`branch-bar-bg.jpg` 등 일부 원본 사진은 아직 없어서 404 가 뜨고 `temp/` 임시 사진으로 대체됩니다 — 배포본도 같습니다.

### Live Server 로 볼 때 주의 (메가메뉴 배경이 빠지는 문제)

VS Code Live Server 는 `fetch` 로 불러오는 컴포넌트(`components/*.html`)에도 자동 새로고침 스크립트를 끼워 넣는데, `</body>` 가 없는 파일이면 **모든 `</svg>` 앞에 넣으면서 응답 길이는 1번만큼만 계산해 파일 끝이 잘립니다.** 그러면 헤더 뒷부분(메가메뉴 흰 패널 `.mega`·유틸 메뉴)이 사라져 로컬에서만 메가메뉴 배경이 빠져 보입니다.

그래서 각 컴포넌트 파일 맨 끝에 아래 한 줄이 있습니다. **지우지 말고, 새 컴포넌트를 만들 때도 끝에 넣어 주세요.** (`include.js` 가 삽입할 때 이 줄을 지우므로 화면·배포본에는 영향 없음)

```html
<template data-dev-trap></body></template>
```

### 배포 때만 하는 작업과 로컬에서 똑같이 만들기

`.github/workflows/deploy.yml` 이 배포 때 하는 일은 두 가지뿐입니다. 파일 합치기·변환(번들·압축)은 없습니다.

1. `node scripts/build-config.js` — GitHub Secrets 값으로 `assets/js/config.js` 생성 (로컬은 `.env` 에서 읽음)
2. 배포 대상만 `_site/` 로 복사 — `index.html 404.html fee.html privacy.html favicon.svg robots.txt sitemap.xml .nojekyll about treatment community faq member admin components assets` (`docs/`·`scripts/`·`README.md` 등은 올라가지 않음)

배포본과 똑같은 결과물로 확인하고 싶을 때 (Git Bash):

```bash
node scripts/build-config.js
rm -rf _site && mkdir -p _site
cp -r index.html 404.html fee.html privacy.html favicon.svg robots.txt sitemap.xml .nojekyll \
      about treatment community faq member admin components assets _site/
npx serve _site              # → http://localhost:3000/
```

(`_site/` 는 커밋되지 않습니다 — `.gitignore`)

## 폴더 구조

```
index.html                 메인
about/ treatment/ community/ faq/ member/   서브페이지
fee.html, privacy.html     비급여 진료비용, 개인정보처리방침
admin/                     관리자 화면 (시안 — 상담 답변·상태 변경·삭제 동작, 나머지 게시판은 목록만)
components/                공통 헤더·푸터·퀵메뉴 (include.js가 삽입)
assets/css/                variables.css(디자인 토큰) · common.css · main.css(메인) · sub.css(서브 콘텐츠 블록) · admin.css
assets/js/
  site-data.js             지점 정보·의료진·SNS 주소  ← 병원 정보 수정은 여기서
  api.js                   데이터 함수 전부(게시판·상담문의·로그인 상태) — 서버 연결 때 바꾸는 파일 (docs/API-SPEC.md)
  inquiry.js               상담문의 목록·비밀번호 열람·내 문의 표시 (faq/contact.html)
  include.js               컴포넌트 삽입
  common.js                헤더·모바일 메뉴·퀵메뉴·아코디언 등 공통 동작
  main.js / pages.js / admin.js / board.js   페이지별 동작
  onboarding.js            메인 PC 첫 방문 이용 안내(코치마크)
  config.js                자동 생성 (커밋 안 함)
assets/data/*.json         공지·사례·FAQ·문의 더미 데이터 · news.json + news/ = 치과소식(기존 사이트 치과스토리 88개)
assets/images/             이미지 (목록: assets/images/README.md) · temp/ = 임시 스톡 이미지(Pexels)
scripts/build-config.js    환경변수 → config.js
scripts/import/            기존 사이트 치과스토리 → 치과소식 가져오기 (docs/HANDOVER.md "기존 사이트 글 가져오기")
docs/                      배포·인수인계 문서
```

## 자주 하는 수정

| 하고 싶은 것 | 고칠 곳 |
|---|---|
| 전화번호·주소·진료시간 | `assets/js/site-data.js` + `index.html` ③ 지점 카드 + `faq/contact-write.html` 오른쪽 카드 |
| 의료진 추가·순서 | `assets/js/site-data.js` 의 `doctors` |
| SNS 주소 | `assets/js/site-data.js` 의 `social` |
| 색상·글자 크기 | `assets/css/variables.css` (색은 아래 '색 역할 규칙'대로) |
| 버튼·탭·입력칸 모서리 | `assets/css/variables.css` 의 `--radius-btn` (지금 4px) — 한 곳만 바꾸면 전체 적용 |
| 서브 본문 제목 아래 부제 (진료과목) | 각 진료과목 페이지 `.sub-head__desc` |
| 메뉴 | `components/header.html` (데스크톱·모바일 두 군데) |
| 서브페이지 왼쪽 하위 메뉴(LNB) 행·타이틀 블록(대메뉴 이름·영문) | 각 서브페이지 `<aside class="lnb">` (같은 메뉴 묶음 페이지 모두) · 스타일 `common.css` '서브 LNB' |
| 서브 배너 문구(영문 라벨·슬로건) · 본문 맨 위 경로·페이지 제목 | 각 서브페이지 `.sub-visual` (대메뉴 묶음마다 같은 문구) · `.sub-head` |
| 서브 배너 사진 (공통 1장 + 병원소개·의료진 소개 예외) | `assets/images/banner-sub.jpg` 를 같은 이름으로 교체 (지정: `sub.css` `.sub-visual__bg`) · 어두운 막·위쪽 그라데이션도 한 값 · **병원소개** `assets/images/banner-clinic.jpg` · **의료진 소개** `banner-doctors.jpg` 만 예외 (`sub.css` `.sub-visual__bg--clinic` · `--doctors`) |
| 서브 배너 높이 (PC 화면 높이 60%·520~680px, 모바일 45%·최소 320px) | `common.css` '.has-lnb .sub-visual' (모바일은 768px 이하 반응형 쪽) |
| 서브페이지 시작 위치 (같은 대메뉴 안 이동 = 본문부터, 그 밖 = 배너 맨 위부터) | `assets/js/lnb-jump.js` (맨 위 설명에 규칙 정리) |
| FAQ·공지 (시안) | `assets/data/*.json` |
| 비급여 진료비용 금액·항목·기준일 | **`assets/data/fee.json` 만** — 한 줄 = 항목 하나 `{ code, name, category, unit, amountText, amount, min, max, note }`. 금액은 `amountText`(화면 표기, 예 `"150,000"`)와 `amount`(숫자 150000)를 같이 고치고, 범위 금액은 `min`·`max` 숫자(`amountText` 는 비움), 금액 없음은 `""`·`null`. 화면·인쇄에서 뺄 행은 지우지 말고 `"hidden": true` (지금 내부 관리용 7행). 기준일은 맨 위 `baseDate`(`2025-02`)·`baseDateLabel`(`2025년 2월`). 분류 칩 순서 = `categories` (새 상세구분을 쓰면 여기에도 추가). 화면 `fee.html` · `pages.js` `renderFeePage` · 스타일 `sub.css` '비급여 진료비용' |
| 상담문의 폼 칸·검사(비밀번호 4자리·내용 5자·링크 막기) | 각 폼 HTML (`faq/contact-write.html` · `treatment/*.html` 빠른상담 · `index.html` 빠른 상담문의) + `common.js` `inquiryForm` |
| 상담문의 목록(15개·지점 칩·모바일 카드형·내 문의) · 비밀번호 팝업 — 연결: 메뉴·LNB 상담문의 = 목록, 퀵메뉴·하단 바·FAQ 하단 상담문의 = 작성 | `assets/js/inquiry.js` · 스타일 `common.css` '상담 현황' · 팝업 `common.js` `UI.dialog` |
| 상담 데이터 저장 방식 (지금 더미 → 서버) | `assets/js/api.js` 상담문의 함수 8개 + `docs/API-SPEC.md` |
| 치료사례 (기존 사이트 시술 전후 14건) | `assets/data/cases.json` — 다시 만들기: `scripts/import` 의 `fetch-gallery.js` → `build-gallery.js` (BEFORE·AFTER 나누기·흐림 미리보기). AFTER 는 로그인 회원만 — 원본 14장은 저장소 밖(자료/기존사이트-치료사례/after/), 시안은 `?login=1` 이어도 흐림 미리보기 + 시안 안내 (`?login=0` 해제) |
| 의료진 소개 페이지 사진 크롭(김영우 원장 구도 기준 — 얼굴 크기·정수리 높이 통일) | `assets/js/site-data.js` 각 원장 `staffCrop: { scale, x, y }` (scale = 사진 높이 ÷ 사진 칸 높이, x = 얼굴 가운데 가로 위치, y = 정수리 세로 위치 — 사진 대비 0~1). 메인 의료진 `photoScale`·`photoOffset*` 과 따로. 페이지 가로 배치(위쪽 [LNB | 소개 블록]·원장 목록이 같은 가운데·같은 폭, 최대 1600px, 좌우 여백 같음·퀵메뉴와 32px 이상)는 `pages.js` `setDocRight`(--doc-side) · `common.css` `.page-doctors .sub-layout`·`.doc-list`. 약력 2열(두 묶음 나란히, 한 열 최대 절반, 남는 폭은 열 사이)·1열 전환은 `pages.js` `setCols` |
| 메인 의료진 나열 순서 | `assets/js/site-data.js` 의 `mainDoctorOrder` |
| 메인 히어로 슬라이드별 사진 위치·확대·인물 이름표 (PC) | `assets/js/site-data.js` 의 `heroSlides` (`pos` · `scale` · `origin` · `caption {name, role, x, y}`) — `main.js` `initHero` 가 적용. 모바일 사진 위치는 `main.css` 768px 이하 |
| 의료진 소개 지점 이동 버튼(화면 아래 [창원점 N][마산점 N]) · 지점별 묶음 | `assets/js/pages.js` `renderDoctorsPage` · `initDoctorBranchNav` (원장 수는 site-data.js 에서 자동) · 스타일 `common.css` '의료진 소개 — 소개 블록' · '의료진 소개 — 원장' · '지점 이동 버튼' |
| 의료진 소개 위 소개 블록(네이비 문구 · 원형 배지 · 하단 바 · 오른쪽 흑백 사진) | `about/doctors.html` `.doc-intro` — 사진은 임시 `tour-masan-04.jpg` (CSS 로 흑백) |
| 의료진 소개 약력 상자 색 | `variables.css` `--color-doctor-box` (지금 #F3F6FB 아주 옅은 파랑) |
| 의료진 소개 본문 폭 (이 페이지만 폭 제한 없음 — LNB 오른쪽 ~ 플로팅 퀵메뉴 앞 32px) | `common.css` `.page-doctors .sub-layout` + `pages.js` `renderDoctorsPage` 의 `setDocRight` (퀵메뉴 위치를 재서 `--doc-right`) |
| 의료진 소개 주요 진료 · 학회·학교 로고 | `assets/js/site-data.js` 각 원장 `focus` · `logos: [{ src, alt }]` (로고 파일은 `assets/images/`, 이름 줄 오른쪽 끝) |
| 약력 분류(학력·경력·학회 활동 — 메인 팝업 · 의료진 소개 공통) | `assets/js/site-data.js` `SITE.classifyCareer` · `isTraining`(연수·세미나) · `splitSociety` |
| 커뮤니티 게시판 목록·상세 (분류 칩·정렬·보기 방식·검색·페이지 번호·이전/다음글) | `assets/js/board.js` 맨 위 `BOARDS` (게시판별 분류·기본 보기·검색 대상) · 스타일 `common.css` '게시판 목록' — 한 페이지 12개(카드 4개 16개) |
| 게시판 조회수 | 지금 데이터에는 없음 — `api.js` 가 0 으로 채우고 모두 0 이면 화면에서 조회수 칸을 숨김. 서버 연결 때 `views` 값으로 (API-SPEC 4-7) |
| 치과소식 글 | `scripts/import/build-story.js` 로 생성 (분류 규칙·본문 정리도 여기) — 새 글은 서버 연결 후 게시판에서 |
| 메인 첫 방문 이용 안내(코치마크) 문구·단계 | `assets/js/onboarding.js` 의 `STEPS` (스타일: `main.css` 끝 '이용 안내') |
| 의료진 사진 크기·위치 맞추기 (메인 의료진 · 의료진 소개 카드 공통 — 칸 아래 맞춤 + 같은 보정값) | `assets/js/site-data.js` 의 각 원장 `photoScale` · `photoOffsetY` · `photoOffsetX` (아래 '의료진 사진 보정') |

### 색 역할 규칙

| 색 | 변수 | 쓰는 곳 |
|---|---|---|
| 딥 네이비 `#16233F` | `--color-point` (옅은 면 `--color-point-soft`) | **면** — 블록·버튼 배경·선택 행 (LNB 타이틀 블록·현재 행, 주요 버튼, 공지 태그) · 선(메가메뉴 열 위 선, 카드 hover 테두리)<br>**+ 고정된 라벨·번호·아이콘** — 섹션 라벨(NOTICE·STORY 포함), 분류 글자(치과소식 카드·글 보기), 선택 상태 글자(현재 LNB 행), 번호·불릿·화살표(흰 헤더 대메뉴 화살표, 치과소식 넘김 화살표) |
| 파랑 `#194EBF` | `--color-accent` | **강조 글자** — 타이틀 강조(`.text-point`, 메인 FAQ 타이틀의 'FAQ')<br>**진행 표시** — 페이지 점 현재 막대, 히어로 진행 단계, 치과소식 진행 바, LNB 현재 행 왼쪽 세로 막대<br>**hover·링크·체크** — 헤더 메뉴·LNB hover, 약력 보기 hover, 선택 목록 체크 등 |
| 창원 핑크 `#FD5B9B` · 마산 주황 `#FE6D33` · 지점 그라데이션 | `--color-changwon` · `--color-masan` · `--color-point-gradient(-v)` | **창원·마산 구분용만** — 지점 탭(메인 의료진·병원소개), 지점 카드, 의료진 진료과·지점 태그, 지점 바로가기, 퀵메뉴 지점 버튼, 지점 선택 토글, 선택 목록 지점 점 |

- **클릭해서 고르는 선택 상태(칩·보기 토글·탭·페이지 번호)는 `--color-accent` 면** — 선택 = 파랑 면 + 흰 글자·아이콘, hover = 옅은 파랑 테두리·글자, 눌림 = `--color-accent-hover` (게시판 분류 칩·보기 토글·페이지 번호, FAQ 카테고리). 고정 표시(공지 태그, LNB 타이틀 블록·현재 행)는 네이비 그대로
- **예외: 플로팅 퀵메뉴 상담문의 버튼은 `--color-accent` 면 사용** — 파랑 면·테두리 + 흰 아이콘·글자, hover `--color-accent-hover` (페이지 점 현재 막대와 같은 파랑으로 맞춤, `common.css` `.quick__sns-btn--consult`)
- 사이트 강조는 중립색인 파랑으로 통일 — 지점 색을 강조에 쓰면 한 지점에 치우쳐 보인다
- 어두운 배경 위에서는 네이비·파랑 대신 흰색(+밑줄) — 예: 히어로 '49만원'
- 새로 색을 쓸 때 이 표에 맞춘다

### 의료진 사진 보정 (메인 의료진 섹션 · 의료진 소개 카드)

원장마다 촬영 거리가 달라 얼굴 크기가 다르게 보이면, `site-data.js` 의 원장 항목에 보정값을 넣습니다. 사진은 `assets/images/doctor-{영문 이름}-cut.png` (400×664, 흰 배경)입니다.

| 값 | 뜻 | 예 |
|---|---|---|
| `photoScale` | 사진 배율. 1 = 기본. 얼굴이 작아 보이면 키우고 커 보이면 줄입니다 | `1.1` (10% 키움), `0.85` (15% 줄임) |
| `photoOffsetY` | 위아래 이동, 사진 칸 높이 대비 %. `+` 아래로, `-` 위로. 정수리 선을 맞출 때 | `5` (칸 높이의 5% 아래로) |
| `photoOffsetX` | 좌우 이동, 사진 칸 높이 대비 %. `+` 오른쪽, `-` 왼쪽. 없으면 0 | `-3` |
| `photoHeadTop` | **의료진 소개만** — 사진 안 머리 위 끝 위치(사진 높이 대비 0~1). 이 값으로 머리가 약력 상자 위로 100px 나오게 사진 높이를 정한다(사진 칸 너비도 사진 비율대로 자동). 사진을 자르지 않으려고 이 페이지에서는 `photoScale`·`photoOffsetY`·`photoOffsetX` 를 쓰지 않음(메인 의료진에서만, 값은 그대로 둠). 사진을 바꾸면 다시 잴 것 | `0.08` |

```js
{ name: '이은주', ..., photo: 'doctor-lee-eunju.jpg', photoScale: 1.06, photoOffsetY: 4.8, ... }
```

새 사진을 넣었을 때 값 구하기 (사진 원본 400×664 기준 픽셀):

1. 사진에서 정수리 위치 `t`, 턱 끝 위치 `c` 를 잽니다 (위에서부터 px).
2. `photoScale = 225 ÷ (c − t)` — 모든 원장의 '정수리 ~ 턱' 높이를 225px 로 맞춥니다.
3. `photoOffsetY = (0.07 − 1 + photoScale × (1 − t ÷ 664)) × 100` — 정수리를 사진 칸 위에서 7% 선에 맞춥니다.
4. 메인에서 확인하고 눈으로 조금씩 다듬습니다. 사진 아래 끝·좌우 끝은 자동으로 흐리게 녹고, 옆 사람과 어깨가 조금 겹쳐도 괜찮습니다.

사진이 아직 없으면 (`-cut.png` 파일 없음) 회색 인물 실루엣이 보이고 보정값은 쓰이지 않습니다.

## 서브페이지 문구 출처

진료과목·치과소개·오시는길 문구는 기존 사이트(whiteedental.co.kr) 내용을 정리한 `화이트e치과 리뉴얼 콘텐츠 정리.docx` (2026-10-30) 를 기준으로 작성했습니다. 병원 확인 전 문구이므로 오픈 전 검수가 필요합니다.

## 남은 TODO

코드 전체에서 `TODO` 를 검색하면 병원 확인이 필요한 항목이 나옵니다.
(이벤트 기간, FAQ 답변, 정호석 대표원장 진료과 표기, 비급여 비용표, 개인정보처리방침 전문, 이미지·로고 등)

---

© 화이트e치과의원 창원점 / 마산점. All rights reserved.
