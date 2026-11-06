# 배포 안내 (GitHub Pages)

## 구조

- `main` 브랜치에 push → GitHub Actions(`.github/workflows/deploy.yml`)가 자동 배포
- `develop` 브랜치: 작업용. 미리보기 사이트는 없음 (GitHub Pages는 사이트 1개만 가능)
  → 확인은 로컬 서버로 하고, 공유할 때 `main`으로 머지
- 빌드 도구 없음. Actions는 ① 환경변수로 `assets/js/config.js` 생성 ② 배포 대상 파일만 `_site/`로 복사 ③ Pages 업로드만 한다.

## 처음 설정 (한 번만)

1. 저장소 **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. **Settings → Secrets and variables → Actions → New repository secret**

| 이름 | 용도 | 지금 필요? |
|---|---|---|
| `WEB3FORMS_ACCESS_KEY` | 상담문의 폼 전송 키 | 예 — 서버 연결 전에는 병원이 상담을 받는 유일한 경로. 없으면 상담 글은 화면에 접수되지만 병원에 메일이 가지 않음 |
| `SUPABASE_URL` | 서버 연결 시 (서버 미정 — Supabase 가 아니면 `API_BASE_URL` 등으로 이름 변경, `docs/API-SPEC.md` 1장) | 서버 연결 때 |
| `SUPABASE_ANON_KEY` | 서버 연결 시 공개용 키 (위와 같음) | 서버 연결 때 |

`CONTACT_EMAIL`(수신 이메일)은 Secrets에 넣지 않습니다. Web3Forms는 **키를 발급받은 이메일로** 접수 메일을 보내므로,
수신 주소를 바꾸려면 새 이메일로 키를 다시 발급받아 `WEB3FORMS_ACCESS_KEY` 를 교체합니다. (`.env.example` 에는 기록용으로 남겨 둠)

> ⚠️ `config.js` 에 들어간 값은 브라우저에서 누구나 볼 수 있습니다.
> Web3Forms access key와 Supabase anon key는 공개용이라 괜찮지만, **service_role 키·비밀번호는 절대 넣지 마세요.**

3. Actions 탭에서 "Deploy to GitHub Pages" 실행 확인 → https://wants-marketing.github.io/whitee-dental/

## 환경변수 목록

| 이름 | 로컬 | 배포 |
|---|---|---|
| `WEB3FORMS_ACCESS_KEY` | `.env` | GitHub Secret |
| `CONTACT_EMAIL` | `.env` (기록용) | — |
| `SUPABASE_URL` | `.env` | GitHub Secret (2차) |
| `SUPABASE_ANON_KEY` | `.env` | GitHub Secret (2차) |

## 도메인 연결 (최종 오픈 때만 — 지금은 DNS 건드리지 않음)

현재 `whiteedental.co.kr` 에서 기존 사이트가 운영 중이므로 **오픈 시점까지 DNS를 변경하지 않습니다.**

오픈할 때:

1. 저장소 Settings → Pages → Custom domain 에 `www.whiteedental.co.kr` 입력 → Enforce HTTPS 체크
2. 도메인 구매처 DNS 관리에서
   - `www` → **CNAME** `wants-marketing.github.io`
   - `@`(apex) → **A 레코드** 4개
     `185.199.108.153` / `185.199.109.153` / `185.199.110.153` / `185.199.111.153`
   - **기존 MX 레코드(메일)는 그대로 유지** — 지우거나 바꾸지 않는다.
3. 코드에서 주소 교체: `github.io/whitee-dental` 로 검색 → `https://www.whiteedental.co.kr` 로
   (`index.html`·서브페이지의 canonical·og:url·og:image, `sitemap.xml`, `robots.txt`)
   - 서브페이지 메타는 생성 스크립트로 일괄 작성되었으므로 전체 검색·치환으로 바꾸면 됨
4. 네이버 서치어드바이저에 사이트맵 재제출 (사이트 인증 메타는 이미 포함됨)
