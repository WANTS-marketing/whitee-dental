# 데이터 연결 명세 (API-SPEC)

이 문서와 `assets/js/api.js` 만 보면 어떤 서버(직접 만든 API, BaaS, 호스팅 게시판 등)로든 연결할 수 있게 정리한 문서입니다.
지금 사이트는 **서버 없이 동작하는 시안**입니다. 데이터는 `assets/data/*.json` 더미 + 브라우저 탭 저장소(sessionStorage)로 움직입니다.

- 작성: 2026-11-06 · 대상: 서버 연결을 맡을 개발자
- 특정 서비스에 묶여 있지 않습니다. 부록의 Supabase 예시는 **선택 사항**입니다.

---

## 1. 구조 — 무엇을 바꾸면 되나

```
화면 코드 (common.js 폼 · inquiry.js 상담 현황 · admin.js · board.js · main.js · pages.js)
        │  window.API.함수() 만 부른다. 저장 방식은 모른다
        ▼
assets/js/api.js   ← 서버 연결 때 바꾸는 곳은 여기 하나 (함수 '안쪽'만)
        │
        ▼
지금: assets/data/*.json + sessionStorage   →   나중: 서버 API
```

- **함수 이름 · 입력값 · 반환 형식은 그대로 두고, 함수 안쪽만 서버 호출로 바꿉니다.** 그러면 화면 코드는 한 줄도 고치지 않아도 됩니다.
- 서버 주소·공개 키처럼 브라우저에 보여도 되는 값은 `.env` → `scripts/build-config.js` → `assets/js/config.js` (`window.SITE_CONFIG`) 로 넣습니다.
  배포는 GitHub Secrets 에 넣으면 Actions 가 생성합니다 (`docs/DEPLOYMENT.md`). **비밀 키(관리자 키·DB 비밀번호)는 절대 넣지 않습니다** — config.js 는 누구나 볼 수 있습니다.
- `scripts/build-config.js` 의 `PUBLIC_KEYS` 에 새 키 이름을 추가하면 config.js 에 들어갑니다. 지금 이름 `SUPABASE_URL`·`SUPABASE_ANON_KEY` 는 예전 계획의 흔적이라, 다른 서버를 쓰면 `API_BASE_URL` 같은 이름으로 바꿔도 됩니다.

### 1-1. 공통 규칙 (상담문의 함수)

모든 상담문의 함수는 `Promise` 를 돌려주고, 결과는 아래 두 형식 중 하나입니다.

```json
{ "ok": true, "data": { } }
```
```json
{ "ok": false, "error": { "code": "WRONG_PASSWORD", "message": "비밀번호가 일치하지 않습니다.", "field": "password", "retryAfter": 30 } }
```

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `ok` | boolean | 필수 | 성공 여부 |
| `data` | object | 성공 시 | 함수별 반환 데이터 |
| `error.code` | string | 실패 시 | 아래 오류 코드 중 하나 |
| `error.message` | string | 실패 시 | **화면에 그대로 보여 줄 한국어 문장** (서버 응답 문구를 그대로 써도 되고, api.js 에서 코드별 문구로 바꿔도 됨) |
| `error.field` | string | 선택 | `VALIDATION` 일 때 문제 있는 칸 (`branch`·`treatment`·`name`·`phone`·`password`·`content`·`answer`·`status`) — 화면이 그 칸에 포커스 |
| `error.retryAfter` | number | 선택 | `LOCKED`·`RATE_LIMITED` 일 때 다시 시도까지 남은 초 |

| 오류 코드 | 언제 | 화면 동작 |
|---|---|---|
| `VALIDATION` | 입력값 오류 (빈 칸, 형식, 길이, 링크 포함) | 폼 아래 빨간 문구 + 해당 칸 포커스 |
| `NOT_FOUND` | 없는(삭제된) 글 | 안내 문구 |
| `WRONG_PASSWORD` | 상담 글 비밀번호 틀림 | '비밀번호가 일치하지 않습니다. (n/5)' |
| `LOCKED` | 서버가 틀린 횟수 초과로 잠금 | 안내 문구 (retryAfter 초) |
| `RATE_LIMITED` | 짧은 시간에 너무 많이 등록·조회 (같은 연락처 10분 내 재등록 등) | 안내 문구 |
| `UNAUTHORIZED` | 관리자 함수를 관리자가 아닌 사람이 부름 | 안내 문구 (관리자 로그인 화면으로 보내는 것은 서버 연결 때 추가) |
| `NETWORK` | 서버 연결 실패·서버 오류 | '잠시 후 다시 시도하거나 전화로 문의해 주세요' |

공통 값

| 이름 | 값 |
|---|---|
| 지점 `branch` | `'changwon'`(창원점) · `'masan'`(마산점). 공지·소식·사례는 두 지점 공통 `'both'` 도 있음 |
| 상담 상태 `status` | `'received'`(접수) · `'answered'`(답변완료) |
| 날짜 | ISO 8601 문자열 — `'2026-11-06T14:10:00+09:00'` 또는 UTC `'2026-11-06T05:10:00.000Z'` |
| 진료과목 `treatment` | `'임플란트'`·`'치아교정'`·`'일반치료'`·`'사랑니·스케일링'`·`'심미치료'`·`'기타'` (폼 select 의 글자 그대로. 메인 빠른 상담문의는 `'기타'`) |

---

## 2. 상담문의 (게시판)

### 2-1. 화면과 흐름

| 화면 | 파일 | 부르는 함수 |
|---|---|---|
| 상담문의 작성 폼 (전송 성공 → 목록으로, 방금 쓴 글 맨 위 '내 문의') | `faq/contact-write.html` | `createInquiry` |
| 진료과목 5페이지 빠른상담 (내용 칸 없음) | `treatment/*.html` | `createInquiry` |
| 메인 FAQ 옆 빠른 상담문의 | `index.html` | `createInquiry` |
| 상담문의 목록 (FAQ > 상담문의) · 비밀번호 열람 | `faq/contact.html` (`assets/js/inquiry.js`) — 예전 주소 `faq/status.html` 은 쿼리를 유지한 채 여기로 자동 이동 | `listInquiries` · `getInquiry` |
| 모든 상담 폼·완료 문구의 시안 안내 | common.js `inquiryForm` · main.js · inquiry.js | `isDeliveryReady` |
| 관리자 | `admin/index.html` (`assets/js/admin.js`) | `adminListInquiries` · `adminGetInquiry` · `answerInquiry` · `updateInquiryStatus` · `deleteInquiry` |

'내 문의' 표시는 화면 기능이다 — 이 탭에서 쓴 글 번호를 sessionStorage(`witee-inquiry-mine`)에 남겨 표시만 한다(열람에는 여전히 비밀번호 필요). 서버 연결 뒤에도 그대로 동작한다.

흐름: 폼 작성 → `createInquiry` 저장(+ 병원 메일 알림) → 상담문의 목록 맨 위에 '접수' → 제목을 누르고 비밀번호 4자리 → `getInquiry` 로 본인 내용 → 관리자 답변 `answerInquiry` → 목록 '답변완료', 본인 화면에 답변 표시.

### 2-2. 데이터 항목 (`inquiries`)

| 필드 | 타입 | 필수 | 설명 | 공개 범위 |
|---|---|---|---|---|
| `id` | number | 필수 | 글 번호 (서버가 발급, 1부터 증가) | 누구나 |
| `branch` | `'changwon'`\|`'masan'` | 필수 | 상담 지점 | 누구나 |
| `treatment` | string | 필수 | 진료과목 | 누구나 |
| `name` | string (1~20자) | 필수 | 이름 | 목록은 **가린 이름만** (`김○○`, 두 글자 `김○`) · 실명은 관리자만 |
| `phone` | string (`010-1234-5678`) | 필수 | 연락처 | 본인에게도 **일부만** (`010-****-5678`) · 전체는 관리자만 |
| `content` | string (0~1000자) | 선택 | 문의 내용. 빠른상담 폼은 내용 칸이 없어 빈 문자열 | 비밀번호 확인 후 본인 · 관리자 |
| `password` | string | 필수 | 숫자 4자리. **서버는 해시로만 저장** (bcrypt·argon2 등). 어떤 응답에도 넣지 않음 | 없음 |
| `status` | `'received'`\|`'answered'` | 필수 | 기본 `'received'`, 답변 등록 시 자동 `'answered'` | 누구나 |
| `answer` | string (0~2000자) | 선택 | 병원 답변 | 비밀번호 확인 후 본인 · 관리자 |
| `answeredAt` | 날짜 \| null | 선택 | 마지막 답변 등록 시각 | 본인 · 관리자 |
| `createdAt` | 날짜 | 필수 | 접수 시각 (서버 시각으로) | 누구나 (목록은 날짜만 표시) |
| `source` | string | 선택 | 어느 폼에서 왔는지 — `'상담문의'`·`'빠른상담'`·`'빠른 질문'` (관리자 '경로' 칸) | 관리자 |

서버에 함께 두면 좋은 항목(화면에는 안 씀): `agreedAt`(개인정보 동의 시각), `ip`·`userAgent`(스팸 대응, 보관 기간 짧게), `deletedAt`(복구가 필요하면 소프트 삭제).

화면이 만드는 값(서버가 주지 않아도 됨): 목록 번호(전체 건수 기준 역순), 자동 제목 `'{진료과목} 상담 문의입니다'` — 단, 지금 시안은 api.js 가 `title` 을 만들어 돌려줍니다. 서버가 주지 않으면 api.js 에서 붙이세요.

### 2-3. 함수별 명세

#### `listInquiries({ branch, page, perPage })` — 상담 현황 목록 (공개, 누구나)

요청

| 필드 | 타입 | 필수 | 기본 | 설명 |
|---|---|---|---|---|
| `branch` | `'changwon'`\|`'masan'` | 선택 | 전체 | 지점 필터 |
| `page` | number | 선택 | 1 | 1부터. 범위를 넘으면 마지막 페이지 |
| `perPage` | number | 선택 | 15 | 화면은 15 (지점별 건수 칩에는 1 로 불러 `total` 만 씀) |

반환 `data`

```json
{
  "items": [
    { "id": 12, "branch": "masan", "treatment": "임플란트", "title": "임플란트 상담 문의입니다",
      "maskedName": "홍○○", "status": "received", "createdAt": "2026-11-06T13:32:00+09:00" }
  ],
  "total": 12, "page": 1, "perPage": 15, "totalPages": 1
}
```

- `items` 는 최신순. **`name`·`phone`·`content`·`answer` 는 절대 넣지 않습니다** (가린 이름은 서버에서 만들어 보낼 것 — 실명을 보내고 화면에서 가리면 개발자 도구로 보입니다).
- 오류: `NETWORK`, `RATE_LIMITED`

#### `getInquiry(id, password)` — 본인 문의 열람 (비밀번호 확인)

요청: `id` number (필수), `password` string 숫자 4자리 (필수)

반환 `data`

```json
{ "id": 12, "branch": "masan", "treatment": "임플란트", "title": "임플란트 상담 문의입니다",
  "maskedName": "홍○○", "maskedPhone": "010-****-5678",
  "content": "임플란트 비용이 궁금합니다.", "status": "answered",
  "answer": "검진 후 안내드립니다.", "answeredAt": "2026-11-06T15:00:00+09:00",
  "createdAt": "2026-11-06T13:32:00+09:00" }
```

- 오류: `NOT_FOUND` · `WRONG_PASSWORD` · `LOCKED`(retryAfter) · `RATE_LIMITED` · `NETWORK`
- 비밀번호는 URL 쿼리에 넣지 말고 **POST 본문**으로 보냅니다 (서버 로그·브라우저 기록에 남지 않게).
- 시안은 화면(inquiry.js)이 같은 글 5회 연속 틀리면 30초 입력을 막습니다(sessionStorage). **새로고침·다른 브라우저로 쉽게 피할 수 있어서 실제 제한은 서버가 해야 합니다** (아래 3장).

#### `createInquiry(data)` — 상담 등록 (누구나)

요청

| 필드 | 타입 | 필수 | 규칙 |
|---|---|---|---|
| `branch` | `'changwon'`\|`'masan'` | 필수 | |
| `treatment` | string | 필수 | 진료과목 글자 |
| `name` | string | 필수 | 앞뒤 공백 제거, 1~20자 |
| `phone` | string | 필수 | `^01[016789]-?\d{3,4}-?\d{4}$` (화면이 하이픈을 넣어 보냄) |
| `password` | string | 필수 | `^\d{4}$` |
| `content` | string | 선택 | 앞뒤 공백 제거, 최대 1000자, `http://`·`https://`·`www.` 포함 금지 |
| `contentRequired` | boolean | 선택 | 내용 칸이 있는 폼이면 true → 5자 미만 금지. (서버는 `source` 로 판단해도 됨) |
| `source` | string | 선택 | `'상담문의'`·`'빠른상담'`·`'빠른 질문'` |

(개인정보 동의 체크는 화면에서 필수로 막습니다. 서버에 `agreedAt` 을 남기려면 `agreed: true` 필드를 추가하세요.)

```json
{ "branch": "masan", "treatment": "임플란트", "name": "홍길동", "phone": "010-1234-5678",
  "password": "4321", "content": "임플란트 비용이 궁금합니다.", "contentRequired": true, "source": "상담문의" }
```

반환 `data`

```json
{ "id": 12, "createdAt": "2026-11-06T13:32:00+09:00", "notified": true }
```

- `notified`: 병원 메일 알림을 보냈는지. 화면은 쓰지 않습니다(정보용).
- 오류: `VALIDATION`(field) · `RATE_LIMITED` · `NETWORK`
- **시안 안내**: `isDeliveryReady()`(동기, boolean)가 false 면 화면이 모든 상담 폼 버튼 아래와 접수 완료 문구에 '시안 화면입니다. 실제로 병원에 전달되지 않습니다. 문의는 전화로 부탁드립니다. 창원점 … · 마산점 …' 을 보입니다(전화번호는 site-data.js). 지금은 Web3Forms 키가 있으면 true. **서버에 저장·알림을 연결하면 true 를 돌려주도록 바꾸세요** — 그러면 안내가 사라지고 원래 '접수되었습니다'
- **메일 알림**: 지금은 api.js 가 저장 뒤 Web3Forms 로 병원에 메일을 보냅니다(키 `WEB3FORMS_ACCESS_KEY`, 실패해도 저장은 성공). 서버가 저장 시 알림(메일·문자·카카오 알림톡 등)을 보내게 되면 api.js 의 `notifyByEmail` 호출을 지우세요. 알림 메일에 문의 내용·연락처가 들어가므로 수신 주소 관리에 주의.
- 허니팟: 폼의 숨은 칸 `website` 에 값이 있으면 화면이 **보내지 않고** 성공처럼 보여 줍니다. 서버로 보내지 않으므로 서버 쪽 스팸 차단은 따로 필요합니다.

#### `adminListInquiries({ branch, status, q, page, perPage })` — 관리자 목록 (관리자만)

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `branch` | string | 선택 | 지점 |
| `status` | `'received'`\|`'answered'` | 선택 | 상태 |
| `q` | string | 선택 | 이름 일부 또는 연락처 숫자 2자리 이상 (하이픈 무시) |
| `page`·`perPage` | number | 선택 | 기본 1 · 15 |

반환 `data`

```json
{
  "items": [
    { "id": 12, "branch": "masan", "treatment": "임플란트", "title": "임플란트 상담 문의입니다",
      "name": "홍길동", "phone": "010-1234-5678", "content": "임플란트 비용이 궁금합니다.",
      "source": "상담문의", "status": "received", "answer": "", "answeredAt": null,
      "createdAt": "2026-11-06T13:32:00+09:00" }
  ],
  "total": 12, "page": 1, "perPage": 15, "totalPages": 1,
  "counts": { "all": 12, "received": 6, "answered": 6 }
}
```

- `counts` 는 지점·검색 조건만 적용하고 상태 필터는 빼고 센 값 (화면 위 '전체 · 접수 · 답변완료').
- `password` 는 관리자에게도 보내지 않습니다.
- 오류: `UNAUTHORIZED` · `NETWORK`

#### `adminGetInquiry(id)` — 관리자 상세 (관리자만)

반환 `data` = `adminListInquiries` 의 `items` 한 개와 같은 형식. 오류: `NOT_FOUND` · `UNAUTHORIZED` · `NETWORK`

#### `answerInquiry(id, answer)` — 답변 등록·수정 (관리자만)

요청: `id` number, `answer` string 1~2000자 (앞뒤 공백 제거)
반환 `data`: `{ "id": 12, "status": "answered", "answer": "…", "answeredAt": "2026-11-06T15:00:00+09:00" }`
- 상태는 **자동으로 `'answered'`**. 다시 등록하면 답변을 덮어쓰고 `answeredAt` 갱신 (이력이 필요하면 서버에 별도 보관).
- 오류: `VALIDATION`(field `answer`) · `NOT_FOUND` · `UNAUTHORIZED` · `NETWORK`

#### `updateInquiryStatus(id, status)` — 상태 변경 (관리자만)

요청: `id` number, `status` `'received'`\|`'answered'`
반환 `data`: `{ "id": 12, "status": "received" }` — `'received'` 로 되돌려도 답변 내용은 지우지 않습니다.
오류: `VALIDATION`(field `status`) · `NOT_FOUND` · `UNAUTHORIZED` · `NETWORK`

#### `deleteInquiry(id)` — 삭제 (관리자만)

요청: `id` number · 반환 `data`: `{ "id": 12 }` · 오류: `NOT_FOUND` · `UNAUTHORIZED` · `NETWORK`
화면은 사이트 확인 팝업(`UI.confirm`)으로 한 번 더 묻고 부릅니다.

### 2-4. REST 로 만든다면 (예시 — 형식은 자유)

| 함수 | 메서드·경로 예시 | 인증 |
|---|---|---|
| `listInquiries` | `GET /inquiries?branch=masan&page=1&perPage=15` | 없음 |
| `getInquiry` | `POST /inquiries/{id}/verify` 본문 `{ "password": "4321" }` | 없음 (횟수 제한) |
| `createInquiry` | `POST /inquiries` | 없음 (스팸·횟수 제한) |
| `adminListInquiries` | `GET /admin/inquiries?branch=&status=&q=&page=` | 관리자 |
| `adminGetInquiry` | `GET /admin/inquiries/{id}` | 관리자 |
| `answerInquiry` | `PUT /admin/inquiries/{id}/answer` 본문 `{ "answer": "…" }` | 관리자 |
| `updateInquiryStatus` | `PATCH /admin/inquiries/{id}` 본문 `{ "status": "received" }` | 관리자 |
| `deleteInquiry` | `DELETE /admin/inquiries/{id}` | 관리자 |

api.js 안에서 HTTP 상태 코드를 위 오류 코드로 바꿔 주면 됩니다 (예: 400→`VALIDATION`, 401/403→`UNAUTHORIZED` 또는 `WRONG_PASSWORD`, 404→`NOT_FOUND`, 423→`LOCKED`, 429→`RATE_LIMITED`, 그 외·연결 실패→`NETWORK`).

---

## 3. 서버에서 반드시 처리할 것

화면에서 하는 검사는 **사용 편의를 위한 것**이고 보안이 아닙니다. 브라우저 코드는 누구나 고치거나 건너뛸 수 있으므로, 아래 '서버' 칸은 전부 서버에서 다시 해야 합니다.

| 항목 | 화면에서 하는 것 (지금) | 서버가 해야 하는 것 |
|---|---|---|
| 비밀번호 저장·확인 | 숫자 4자리 형식 검사. 시안은 평문 비교 | **해시로 저장**(bcrypt·argon2, 솔트 포함), 확인도 해시 비교. 응답·로그에 비밀번호를 남기지 않음 |
| 틀린 횟수 제한 | 같은 글 5회 연속 틀리면 30초 입력 막기 (sessionStorage — 새로고침·다른 브라우저로 피할 수 있음) | 글 번호 + IP 기준 연속 실패 횟수 저장, 5회면 일정 시간 잠금(`LOCKED`, `retryAfter`). 4자리는 경우의 수가 1만 개뿐이라 **반드시 필요** |
| 목록 공개 범위 | 받은 값만 표시 | 목록 응답에는 **번호·지점·진료과목·가린 이름·상태·작성일만**. 실명·연락처·내용·답변은 넣지 않음 (가린 이름은 서버에서 만들 것) |
| 내용·연락처·답변 | 비밀번호가 맞을 때만 팝업에 표시, 연락처는 일부만 | 비밀번호 확인을 통과했을 때만, 또는 관리자에게만 응답. 본인에게도 연락처는 `010-****-5678` |
| 관리자 인증·권한 | 없음 (시안은 로그인 없이 열림, 화면 위 '시안 — 실제 운영 시 관리자 인증 필요') | 관리자 로그인(세션·토큰), 모든 관리자 함수에서 권한 확인 → 아니면 `UNAUTHORIZED`. `/admin/` 은 로그인 전 접근 시 로그인 화면으로. 관리자 계정은 병원 명의, 2단계 인증 권장 |
| 답변·상태 변경·삭제 | 관리자 화면 버튼 | 관리자만 가능. 누가 언제 바꿨는지 기록(감사 로그) 권장 |
| 입력값 검사 | 빈 칸·형식·길이·내용 5자 미만·링크 포함 막기 | 같은 규칙을 서버에서 다시 검사(`VALIDATION`). HTML 태그는 저장 전 이스케이프 또는 표시 때 이스케이프(지금 화면은 표시할 때 이스케이프함) |
| 스팸 차단 | 허니팟(숨은 칸), 링크 포함 글 막기 | 같은 연락처 **10분 안 재등록 막기**, 링크 포함 글 막기, 같은 IP 짧은 시간 다수 등록 막기(`RATE_LIMITED`). 필요하면 캡차(reCAPTCHA·Turnstile 등) |
| 요청 횟수 제한 | 없음 | 목록 조회·비밀번호 확인·등록 모두 IP 기준 요청 횟수 제한 |
| 메일 알림 | 저장 뒤 Web3Forms 로 발송 (공개 키, 실패해도 저장 유지) | 서버에서 알림을 보내면 화면 발송 제거. 알림 실패 재시도 |
| 개인정보 보관·파기 | 없음 | 보관 기간이 지나면 자동 파기(스케줄 작업) 또는 관리자 파기 절차. **기간은 개인정보처리방침과 같게** (병원 확인 필요 — 지금 동의 문구는 '병원 정책 확인 후 기재 예정'). 파기 기록 보관 |
| 통신 | — | HTTPS 만. 관리자 API 는 CORS 를 사이트 도메인으로 제한 |
| 백업 | — | 정기 백업 + 백업본도 같은 보관 기간 적용 |

개인정보처리방침에 추가할 것: 수집 항목(이름·연락처·상담 내용·비밀번호), 보관 기간, 처리 위탁(서버·메일 서비스 업체, 국외 이전 여부), 파기 방법.

---

## 4. 그 밖의 데이터 (지금 더미 JSON 으로 동작)

이 함수들은 상담문의보다 먼저 만들어져서 **`{ ok, data }` 로 감싸지 않고 값을 바로 돌려줍니다** (실패하면 예외). 화면 코드가 이 형식으로 쓰고 있으므로 형식을 바꾸려면 화면 코드도 같이 고쳐야 합니다 — 그대로 두는 것을 권장합니다.

### 4-1. 공지사항 — `getNotices({ limit })`, `getNotice(id)`

- 더미: `assets/data/notice.json` · 화면: 메인 공지 4개, `community/notice.html`(목록), `community/notice-view.html?id=`
- `getNotices` 반환: 배열 — 고정 먼저, 그다음 최신순. `limit` 이 있으면 그 개수만

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `id` | string | 필수 | 글 id |
| `title` | string | 필수 | 제목 |
| `branch` | `'changwon'`\|`'masan'`\|`'both'` | 필수 | 지점 |
| `date` | 날짜 | 필수 | 작성일 |
| `pinned` | boolean | 필수 | 상단 고정 |
| `summary` | string | 선택 | 요약(카드 보기) |
| `body` | string | 선택 | 본문 — 지금은 글자. 서버는 HTML 권장(표시 전에 허용 태그만 남기는 정리 필요) |
| `thumbnail` | string | 선택 | 이미지 경로(`assets/images/` 기준 파일명) 또는 전체 URL |
| `views` | number | 선택 | 조회수. 없으면 api.js 가 0 → 모두 0 이면 화면에서 조회수 칸 숨김 |

- `getNotice(id)` 반환: `{ post, prev, next }` (prev = 먼저 쓴 글, next = 나중에 쓴 글, 날짜순) 또는 없으면 `null`

### 4-2. 치과소식 — `getNews({ limit })`, `getNewsPost(id)`

- 더미: `assets/data/news.json`(88개, 기존 사이트 치과스토리에서 가져옴) + 본문 `assets/data/news/{id}.html` · 화면: 메인 캐러셀, `community/news.html`, `news-view.html?id=`
- 필드: `id`(예 `story-90`), `wrId`·`legacyUrl`(기존 사이트 글 번호·주소 — 404.html 이 옛 주소를 새 주소로 넘김), `title`, `category`(진료안내·치료정보·임플란트·틀니·치아교정·병원소식), `date`, `summary`, `thumbnail`, `imageCount`, `branch`, `views`(선택)
- `getNewsPost(id)` 반환: `{ post, html, prev, next }` 또는 `null`. `html` 안의 이미지 경로는 현재 페이지 기준으로 바꿔서 돌려줍니다(서버가 전체 URL 을 주면 변환 불필요)

### 4-3. 치료사례 — `getCases({ limit })`, `getCase(id)` (로그인 후 사진 공개)

- 더미: `assets/data/cases.json` · 화면: 메인 치료사례, `community/cases.html`, `case-view.html?id=`
- 필드: `id`, `category`(영문 키), `categoryName`(분류 이름), `title`, `branch`, `date`, `beforeImage`, `afterImage`, `views`(선택)
- 지금은 화면이 `isLoggedIn()` 이 false 면 사진을 흐리게 하고 '로그인 후 확인'을 덮습니다. **이건 가림일 뿐이라 서버는 비로그인 요청에 사진 주소 자체를 주지 않아야 합니다** (비공개 저장소 + 기한 있는 서명 주소 등). 비로그인이면 `beforeImage`·`afterImage` 를 빈 값으로 주고 화면은 자리만 보여 주게 맞추면 됩니다
- 치료 전·후 사진은 환자 동의서가 있는 사진만 (의료광고 심의 기준도 확인)

### 4-4. FAQ — `getFaqs({ featured })`

- 더미: `assets/data/faq.json` · 화면: 메인 FAQ 5개(`featured`), `faq/index.html`
- 필드: `id`, `category`, `question`, `answer`(빈 값이면 화면이 '답변 준비 중'), `featured`(메인 노출), `order`(순서, 작은 수 먼저)

### 4-5. 로그인·회원가입 — `isLoggedIn()`, `getCurrentUser()`, `isAdmin()`, `signInWithKakao()`, `signOut()`

- 화면: `member/login.html`·`member/join.html`(지금은 화면만 — 전송 안 함), 헤더 로그인·회원가입 링크, 치료사례 사진 잠금
- **`isLoggedIn`·`getCurrentUser`·`isAdmin` 은 화면에서 동기(바로 값)로 부릅니다.** 페이지가 열릴 때 세션을 한 번 읽어 두고(쿠키·저장소) 그 값을 돌려주도록 만들고, 세션을 읽은 뒤 화면을 다시 그려야 하면 `document.dispatchEvent(new Event('auth:change'))` 같은 이벤트를 추가해 board.js·main.js 에서 받게 하세요
- `getCurrentUser()` 반환: `{ id: string, name: string, role: 'user'|'admin' }` 또는 `null`
- `signInWithKakao()`: 카카오 OAuth 로그인 시작(로그인 후 원래 페이지로). Kakao Developers 앱 등록 · Redirect URI 에 시안 주소와 최종 도메인 둘 다 등록 · 앱 키는 병원 명의 계정으로
- 이메일 회원가입을 유지할지, 카카오만 쓸지 결정 필요 (회원가입 폼 필드: 이름·이메일·비밀번호 8자 이상·연락처(선택)·약관 동의·개인정보 동의). 회원 이용약관 문서도 필요
- `isAdmin()` 은 화면 표시용일 뿐, 관리자 권한은 서버 API 마다 다시 확인

### 4-6. 이벤트 배너 (메인 히어로)

- 지금은 **데이터 함수 없이 `index.html` 의 히어로 슬라이드 4장에 직접 적혀** 있습니다 (문구·이미지·가격 배지 — 이미지 `assets/images/hero-*.jpg`)
- 관리자가 바꾸게 하려면 `getBanners()` 를 api.js 에 추가하고 main.js `initHero` 가 그걸로 슬라이드를 그리게 바꾸는 작업이 필요합니다. 제안 형식:

```json
[{ "id": "b1", "order": 1, "title": "평일 야간진료", "subtitle": "…", "image": "hero-03-night.jpg",
   "link": "treatment/implant.html", "badge": "49만원", "startAt": "2026-11-01", "endAt": "2026-11-30", "visible": true }]
```

- 가격·이벤트 문구는 의료광고 심의 대상인지 병원 확인

### 4-7. 조회수

- 게시판 함수들은 `views` 가 없으면 0 으로 채웁니다(`withViews`). 서버에서 상세를 열 때 +1 하고 목록에 `views` 를 담아 주면 화면에 '조회 N' 과 정렬용 값이 생깁니다

---

## 5. 시안 데이터 (지금)

- `assets/data/inquiries.json`: 더미 11건(창원 6 · 마산 5, 접수·답변완료 섞음). **비밀번호는 모두 `1234`**. 이름·연락처(`010-0000-xxxx`)는 가짜
- 새로 쓴 글·답변·삭제는 **이 브라우저 탭의 sessionStorage(`witee-inquiries-demo`)** 에만 저장 → 페이지를 옮겨도 이어지고, 탭을 닫거나 저장소를 비우면 더미로 돌아갑니다. 다른 사람·다른 기기에는 보이지 않습니다
- 비밀번호 틀린 횟수: sessionStorage `witee-inquiry-fail`
- 기존 홈페이지 상담 글 74건은 개인정보라 **옮기지 않는 것이 기본**입니다 (병원 확인 필요 — `docs/HANDOVER.md`)

---

## 부록. Supabase 를 쓸 경우 예시 (선택 사항)

다른 서버를 써도 됩니다. Supabase(PostgreSQL + Row Level Security)를 고르는 경우의 출발점 예시입니다. 그대로 쓰기 전에 보안 검토를 하세요.

```sql
-- 상담 문의
create extension if not exists pgcrypto;

create table public.inquiries (
  id bigint generated always as identity primary key,
  branch text not null check (branch in ('changwon','masan')),
  treatment text not null,
  name text not null check (char_length(name) between 1 and 20),
  phone text not null,
  content text not null default '' check (char_length(content) <= 1000),
  password_hash text not null,                  -- crypt(password, gen_salt('bf'))
  source text,
  status text not null default 'received' check (status in ('received','answered')),
  answer text not null default '',
  answered_at timestamptz,
  agreed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index on public.inquiries (branch, created_at desc);

-- 비밀번호 실패 기록 (횟수 제한)
create table public.inquiry_attempts (
  inquiry_id bigint references public.inquiries(id) on delete cascade,
  ip inet, failed_at timestamptz not null default now()
);

alter table public.inquiries enable row level security;
alter table public.inquiry_attempts enable row level security;
-- 일반 사용자(anon)에게는 테이블 직접 select/insert 권한을 주지 않고, 아래 함수로만 접근

-- 관리자 판별 (profiles.role = 'admin')
create table public.profiles (id uuid primary key references auth.users(id), name text, role text not null default 'user');
alter table public.profiles enable row level security;
create policy "본인만 읽기" on public.profiles for select using (auth.uid() = id);
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public
  as $$ select exists (select 1 from profiles where id = auth.uid() and role = 'admin') $$;

create policy "관리자 전체" on public.inquiries for all using (public.is_admin()) with check (public.is_admin());

-- 공개 목록 (가린 이름만)
create or replace function public.list_inquiries(p_branch text default null, p_page int default 1, p_per int default 15)
returns table (id bigint, branch text, treatment text, masked_name text, status text, created_at timestamptz, total bigint)
language sql stable security definer set search_path = public as $$
  select i.id, i.branch, i.treatment,
         left(i.name, 1) || repeat('○', greatest(char_length(i.name) - 1, 1)),
         i.status, i.created_at, count(*) over ()
  from inquiries i
  where p_branch is null or i.branch = p_branch
  order by i.created_at desc
  limit least(p_per, 50) offset (greatest(p_page, 1) - 1) * least(p_per, 50)
$$;

-- 본인 열람 (비밀번호 확인 + 실패 횟수 제한: 최근 10분 5회)
create or replace function public.get_inquiry(p_id bigint, p_password text)
returns json language plpgsql security definer set search_path = public as $$
declare r inquiries; fails int;
begin
  select count(*) into fails from inquiry_attempts where inquiry_id = p_id and failed_at > now() - interval '10 minutes';
  if fails >= 5 then return json_build_object('error', 'LOCKED'); end if;
  select * into r from inquiries where id = p_id;
  if not found then return json_build_object('error', 'NOT_FOUND'); end if;
  if r.password_hash <> crypt(p_password, r.password_hash) then
    insert into inquiry_attempts (inquiry_id) values (p_id);
    return json_build_object('error', 'WRONG_PASSWORD');
  end if;
  delete from inquiry_attempts where inquiry_id = p_id;
  return json_build_object('id', r.id, 'branch', r.branch, 'treatment', r.treatment,
    'maskedName', left(r.name, 1) || repeat('○', greatest(char_length(r.name) - 1, 1)),
    'maskedPhone', left(regexp_replace(r.phone, '\D', '', 'g'), 3) || '-****-' || right(regexp_replace(r.phone, '\D', '', 'g'), 4),
    'content', r.content, 'status', r.status, 'answer', r.answer, 'answeredAt', r.answered_at, 'createdAt', r.created_at);
end $$;

-- 등록 (검사 + 같은 연락처 10분 내 재등록 막기 + 비밀번호 해시)
create or replace function public.create_inquiry(p jsonb)
returns json language plpgsql security definer set search_path = public as $$
declare new_id bigint; c text := btrim(coalesce(p->>'content', ''));
begin
  if (p->>'password') !~ '^\d{4}$' then return json_build_object('error', 'VALIDATION', 'field', 'password'); end if;
  if c ~* '(https?://|www\.)' then return json_build_object('error', 'VALIDATION', 'field', 'content'); end if;
  if exists (select 1 from inquiries where phone = p->>'phone' and created_at > now() - interval '10 minutes') then
    return json_build_object('error', 'RATE_LIMITED');
  end if;
  insert into inquiries (branch, treatment, name, phone, content, password_hash, source)
  values (p->>'branch', p->>'treatment', btrim(p->>'name'), p->>'phone', c, crypt(p->>'password', gen_salt('bf')), p->>'source')
  returning id into new_id;
  return json_build_object('id', new_id, 'createdAt', now());
end $$;

grant execute on function public.list_inquiries, public.get_inquiry, public.create_inquiry to anon, authenticated;
```

- 나머지 검사(이름·연락처 형식, 내용 5자 등)도 `create_inquiry` 에 추가하세요. IP 기준 요청 제한은 DB 함수만으로 어렵기 때문에 Edge Function·프록시·WAF 에서 거는 것을 권장합니다
- 관리자 함수(`adminListInquiries` 등)는 로그인한 관리자 세션으로 `inquiries` 테이블을 직접 조회·수정하면 RLS(`is_admin()`)가 막아 줍니다. `password_hash` 는 select 목록에서 빼세요
- 게시판 예시: `notices`·`news`·`faqs` 는 `select` 누구나, 쓰기는 `is_admin()` 만. `cases` 는 목록 누구나 + 사진은 비공개 Storage 버킷 + 로그인 사용자에게만 signed URL
- 보관 기간 파기: `pg_cron` 으로 `delete from inquiries where created_at < now() - interval '…'` (기간은 개인정보처리방침과 같게)
- 메일 알림: Database Webhook 또는 Edge Function 에서 발송
