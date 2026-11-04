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
- 상담문의 폼: Web3Forms
- 2차 예정: Supabase (회원·게시판·관리자)

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

## 폴더 구조

```
index.html                 메인
about/ treatment/ community/ faq/ member/   서브페이지
fee.html, privacy.html     비급여 진료비용, 개인정보처리방침
admin/                     관리자 화면 (1차: UI만, 검색 제외)
components/                공통 헤더·푸터·퀵메뉴 (include.js가 삽입)
assets/css/                variables.css(디자인 토큰) · common.css · main.css(메인) · sub.css(서브 콘텐츠 블록) · admin.css
assets/js/
  site-data.js             지점 정보·의료진·SNS 주소  ← 병원 정보 수정은 여기서
  api.js                   데이터 불러오기·상담 전송·로그인 상태 (2차에 Supabase로 교체할 파일)
  include.js               컴포넌트 삽입
  common.js                헤더·모바일 메뉴·퀵메뉴·아코디언 등 공통 동작
  main.js / pages.js / admin.js   페이지별 동작
  onboarding.js            메인 PC 첫 방문 이용 안내(코치마크)
  config.js                자동 생성 (커밋 안 함)
assets/data/*.json         공지·소식·사례·FAQ·문의 더미 데이터
assets/images/             이미지 (목록: assets/images/README.md) · temp/ = 임시 스톡 이미지(Pexels)
scripts/build-config.js    환경변수 → config.js
docs/                      배포·인수인계 문서
```

## 자주 하는 수정

| 하고 싶은 것 | 고칠 곳 |
|---|---|
| 전화번호·주소·진료시간 | `assets/js/site-data.js` + `index.html` ③ 지점 카드 + `faq/contact.html` 오른쪽 카드 |
| 의료진 추가·순서 | `assets/js/site-data.js` 의 `doctors` |
| SNS 주소 | `assets/js/site-data.js` 의 `social` |
| 색상·글자 크기 | `assets/css/variables.css` |
| 메뉴 | `components/header.html` (데스크톱·모바일 두 군데) |
| FAQ·소식 (1차) | `assets/data/*.json` |
| 메인 첫 방문 이용 안내(코치마크) 문구·단계 | `assets/js/onboarding.js` 의 `STEPS` (스타일: `main.css` 끝 '이용 안내') |

## 서브페이지 문구 출처

진료과목·치과소개·오시는길 문구는 기존 사이트(whiteedental.co.kr) 내용을 정리한 `화이트e치과 리뉴얼 콘텐츠 정리.docx` (2026-10-30) 를 기준으로 작성했습니다. 병원 확인 전 문구이므로 오픈 전 검수가 필요합니다.

## 남은 TODO

코드 전체에서 `TODO` 를 검색하면 병원 확인이 필요한 항목이 나옵니다.
(SNS 주소, 이벤트 기간, FAQ 답변, 정호석 대표원장 진료과 표기, 비급여 비용표, 개인정보처리방침 전문, 이미지·로고 등)

---

© 화이트e치과의원 창원점 / 마산점. All rights reserved.
