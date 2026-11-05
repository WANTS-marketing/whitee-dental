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
assets/data/*.json         공지·사례·FAQ·문의 더미 데이터 · news.json + news/ = 치과소식(기존 사이트 치과스토리 88개)
assets/images/             이미지 (목록: assets/images/README.md) · temp/ = 임시 스톡 이미지(Pexels)
scripts/build-config.js    환경변수 → config.js
scripts/import/            기존 사이트 치과스토리 → 치과소식 가져오기 (docs/HANDOVER.md "기존 사이트 글 가져오기")
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
| 서브페이지 왼쪽 하위 메뉴(LNB) | 각 서브페이지 `<aside class="lnb">` (같은 메뉴 묶음 페이지 모두) · 스타일 `common.css` '서브 LNB' |
| FAQ·공지 (1차) | `assets/data/*.json` |
| 치과소식 글 | `scripts/import/build-story.js` 로 생성 (분류 규칙·본문 정리도 여기) — 새 글은 2차 Supabase 게시판에서 |
| 메인 첫 방문 이용 안내(코치마크) 문구·단계 | `assets/js/onboarding.js` 의 `STEPS` (스타일: `main.css` 끝 '이용 안내') |
| 메인 의료진 사진 크기·위치 맞추기 (의료진 소개 페이지는 사진을 칸에 꽉 채움 — 보정값 안 씀) | `assets/js/site-data.js` 의 각 원장 `photoScale` · `photoOffsetY` · `photoOffsetX` (아래 '의료진 사진 보정') |

### 의료진 사진 보정 (메인 의료진 섹션)

원장마다 촬영 거리가 달라 얼굴 크기가 다르게 보이면, `site-data.js` 의 원장 항목에 보정값을 넣습니다. 사진은 `assets/images/doctor-{영문 이름}-cut.png` (400×664, 흰 배경)입니다.

| 값 | 뜻 | 예 |
|---|---|---|
| `photoScale` | 사진 배율. 1 = 기본. 얼굴이 작아 보이면 키우고 커 보이면 줄입니다 | `1.1` (10% 키움), `0.85` (15% 줄임) |
| `photoOffsetY` | 위아래 이동, 사진 칸 높이 대비 %. `+` 아래로, `-` 위로. 정수리 선을 맞출 때 | `5` (칸 높이의 5% 아래로) |
| `photoOffsetX` | 좌우 이동, 사진 칸 높이 대비 %. `+` 오른쪽, `-` 왼쪽. 없으면 0 | `-3` |

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
