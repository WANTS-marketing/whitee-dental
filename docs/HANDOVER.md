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

## 사용한 외부 서비스·라이브러리

| 이름 | 용도 | 라이선스·조건 | 계정 |
|---|---|---|---|
| Pretendard (jsDelivr CDN) | 웹폰트 | SIL Open Font License 1.1 (상업 사용 가능) | 없음 |
| Web3Forms | 상담문의 메일 발송 | 무료 플랜 월 250건 | 미정 (병원 이메일로 발급) |
| GitHub Pages / Actions | 호스팅·배포 | Public 저장소 무료 | WANTS-marketing |
| 아이콘 (인라인 SVG) | 메뉴·진료 아이콘·SNS | 이 프로젝트에서 직접 그림 | — |

## 이미지 출처 (작업하며 계속 기록)

현재 전부 플레이스홀더. 목록: `assets/images/README.md`

| 파일 | 출처 | 라이선스 | 비고 |
|---|---|---|---|
| (아직 없음) | | | |

> 시안에 쓰인 사진 중 Unsplash 등 외부 사진이 있다면 출처를 여기에 기록. 치료사례 사진은 환자 동의 확인 필수.

## 병원에 받아야 할 자료 (TODO)

- [ ] 지점별 인스타그램·블로그 주소 4개 (`assets/js/site-data.js` → `social`)
- [ ] 히어로 3번 임플란트 이벤트 기간
- [ ] FAQ 01~04 답변
- [ ] 정호석 대표원장 진료과 표기 확인 (현재 "통합치의학과")
- [ ] 의료진 사진·약력
- [ ] 공식 로고 파일(SVG), 원내 사진, 진료 사진
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
