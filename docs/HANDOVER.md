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
- 치료사례 BEFORE 자리의 사진은 실제 치료 사진이 아닌 스톡 사진입니다 (흐림 처리). 오픈 전 실제 동의받은 사진으로 교체하거나 비공개

| 파일 (assets/images/temp/) | Pexels 사진 ID | 촬영자 | 라이선스 |
|---|---|---|---|
| hero-01.jpg | [3779713](https://www.pexels.com/photo/3779713/) | Andrea Piacquadio | Pexels License |
| hero-02.jpg | [3845625](https://www.pexels.com/photo/3845625/) | Pexels 페이지에서 확인 | Pexels License |
| hero-03-event-implant.jpg | [6502306](https://www.pexels.com/photo/6502306/) | cottonbro studio | Pexels License |
| hero-bg.jpg, og-image.jpg, tour-*-01/05 | [6812453](https://www.pexels.com/photo/6812453/) | Pavel Danilyuk | Pexels License |
| doctors-bg.jpg, tour-*-04/01 | [8459996](https://www.pexels.com/photo/8459996/) | Pexels 페이지에서 확인 | Pexels License |
| branch-bar-bg.jpg, tour-*-05/03 | [305568](https://www.pexels.com/photo/305568/) | Pexels 페이지에서 확인 | Pexels License |
| clinic-implant.jpg, case-implant-before.jpg | [6502340](https://www.pexels.com/photo/6502340/) | cottonbro studio | Pexels License |
| clinic-aesthetic.jpg, case-prosthetics-before.jpg | [12474261](https://www.pexels.com/photo/12474261/) | Pexels 페이지에서 확인 | Pexels License |
| clinic-orthodontics.jpg, case-orthodontics-before.jpg | [5524021](https://www.pexels.com/photo/5524021/) | Anna Avilova | Pexels License |
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
- [ ] 회원 이용약관 (2차)
- [ ] 주차·대중교통 안내

## 2차 작업 목록 — Supabase 연동

1차는 정적 화면만. 화면 코드는 그대로 두고 **`assets/js/api.js` 함수 내부만** 교체하도록 구조를 잡아 두었다.
(함수 이름과 반환 형태 유지: `getNotices / getNews / getCases / getFaqs / getInquiries / submitInquiry / isLoggedIn / getCurrentUser / isAdmin / signInWithKakao / signOut`)

### 1. Supabase Auth (카카오 로그인)
- [ ] Supabase 프로젝트 생성 (병원 또는 회사 명의 계정 — 개인 계정 금지)
- [ ] Kakao Developers 앱 생성 → REST API 키·Client Secret → Supabase Auth Providers의 Kakao에 등록
- [ ] Redirect URL: 시안 주소 + 최종 도메인 둘 다 등록
- [ ] `api.js` 의 `isLoggedIn / getCurrentUser / signInWithKakao / signOut` 구현
- [ ] 로그인 후 헤더 "로그인 → 로그아웃/마이페이지" 전환 (`components/header.html`, `common.js`)
- [ ] 이메일 회원가입을 유지할지 카카오만 쓸지 결정

### 2. 테이블 설계 (초안 — JSON 더미와 같은 필드)
| 테이블 | 주요 컬럼 |
|---|---|
| `profiles` | `id`(auth.users FK), `name`, `phone`, `role`('user'/'admin'), `created_at` |
| `notices` | `id`, `title`, `body`, `branch`('changwon'/'masan'/'both'), `pinned`, `date` |
| `news` | `id`, `title`, `body`, `branch`, `thumbnail`, `date` |
| `cases` | `id`, `category`, `category_name`, `title`, `branch`, `before_image`, `after_image`, `date` |
| `faqs` | `id`, `category`, `question`, `answer`, `featured`, `order` |
| `inquiries` | `id`, `branch`, `treatment`, `name`, `phone`, `message`, `source`, `status`('new'/'done'), `agreed_at`, `created_at` |

### 3. RLS (행 단위 보안)
- [ ] `notices / news / faqs`: 누구나 읽기, 관리자만 쓰기
- [ ] `cases`: 목록(제목·분류)은 누구나, **이미지 URL은 로그인 사용자만** (Storage 정책과 함께)
- [ ] `inquiries`: 누구나 insert만 가능(본인 것도 조회 불가), 관리자만 select/update
- [ ] `profiles`: 본인 행만 읽기·수정, `role` 컬럼은 사용자가 바꿀 수 없게

### 4. 관리자 권한
- [ ] `profiles.role = 'admin'` 판별 함수(`is_admin()`)를 RLS에서 사용
- [ ] `/admin/` 진입 시 `API.isAdmin()` 확인 → 아니면 홈으로 이동
- [ ] `admin.js` 의 수정·삭제·새로 등록 버튼 연결, 상담문의 상태 변경
- [ ] 상담 접수 시 관리자 메일 알림 (Edge Function 또는 Web3Forms 병행)

### 5. 이미지 Storage
- [ ] 버킷: `public`(소식 썸네일 등), `cases`(비공개 — 치료사례)
- [ ] 치료사례 이미지는 로그인 사용자에게 signed URL로만 제공
- [ ] 관리자 화면에서 업로드 (용량·형식 제한)

### 6. 상담 개인정보
- [ ] 보유 기간 지나면 자동 삭제(스케줄) 또는 관리자 삭제 절차
- [ ] 개인정보처리방침에 Supabase(처리 위탁·국외 이전 여부) 반영

## 작업 시 지킬 것

- 새 외부 서비스·라이브러리·폰트·이미지를 추가하면 이 문서와 `docs/DEPLOYMENT.md` 를 갱신
- 비밀번호·키 값은 절대 문서·코드에 쓰지 않는다 (이름과 보관 위치만)
- 커밋 전 개인 계정 이름·개인 이메일이 코드에 들어가지 않았는지 검색
