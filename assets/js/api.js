/* ==========================================================================
   데이터 접근 계층 (api.js)
   - 1차: /assets/data/*.json 더미 데이터를 읽는다.
   - 서버 연결: 이 파일 안의 함수 내용만 서버 호출로 바꾸면 화면 코드는 그대로 둘 수 있다 (특정 서비스에 묶이지 않음).
     함수 이름·입력값·반환 형태를 유지할 것 — docs/API-SPEC.md 참고
   ========================================================================== */
(function () {
  const config = window.SITE_CONFIG || {}; // config.js (빌드 시 생성) — 없으면 빈 값

  /** 현재 페이지 기준 사이트 루트 상대경로 (<html data-root="..">) */
  function root() {
    return document.documentElement.dataset.root || '.';
  }

  async function fetchJson(name) {
    const res = await fetch(`${root()}/assets/data/${name}.json`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${name}.json 을 불러오지 못했습니다 (${res.status})`);
    return res.json();
  }

  const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date);
  /* 조회수(views) — 1차 데이터에는 없어서 0 으로 채운다 (게시판 '조회순' 정렬·조회수 표시 자리, 모두 0 이면 화면에서 조회수 칸을 숨김)
     TODO(서버): 각 게시판 views 값 + 상세를 열 때 +1 (API-SPEC '조회수') */
  const withViews = (rows) => rows.map((r) => ({ ...r, views: Number(r.views) || 0 }));
  /** 목록 rows 에서 글 하나 + 앞뒤 글 (rows = 최신순) — prev = 먼저 쓴 글, next = 나중에 쓴 글 */
  const pick = (rows, id) => { const i = rows.findIndex((r) => r.id === id); return i < 0 ? null : { post: rows[i], prev: rows[i + 1] || null, next: rows[i - 1] || null }; };

  /* ---------- 게시판 ---------- */

  /** 공지사항 — [{ id, title, branch, date, pinned }] */
  async function getNotices({ limit } = {}) {
    // TODO(서버): 공지 목록 — 고정 먼저 + 최신순 (API-SPEC '공지사항')
    const rows = withViews(await fetchJson('notice')).sort((a, b) => (b.pinned - a.pinned) || byDateDesc(a, b));
    return limit ? rows.slice(0, limit) : rows;
  }

  /** 공지사항 글 하나 — { post, prev, next } (앞뒤 = 고정 여부와 상관없이 날짜순). 없는 글이면 null
      본문: 지금은 body(없으면 summary) 문구 — TODO(서버): 게시판 본문(HTML) */
  async function getNotice(id) {
    const rows = (await getNotices()).slice().sort(byDateDesc);
    return pick(rows, id);
  }

  /** 치과소식 — [{ id, wrId, legacyUrl, title, category, date, summary, thumbnail }] 최신순
      (기존 사이트 치과스토리 게시판에서 가져온 글 — scripts/import/build-story.js 가 news.json 생성) */
  async function getNews({ limit } = {}) {
    // TODO(서버): 치과소식 목록 최신순 (API-SPEC '치과소식')
    const rows = withViews(await fetchJson('news')).sort(byDateDesc);
    return limit ? rows.slice(0, limit) : rows;
  }

  /** 치과소식 글 하나 — { post, html, prev(이전에 쓴 글), next(나중에 쓴 글) }. 없는 글이면 null
      본문: assets/data/news/{id}.html (이미지 경로는 사이트 루트 기준 'assets/...' → 현재 페이지 기준으로 바꿔 돌려준다) */
  async function getNewsPost(id) {
    // TODO(서버): 글 하나 + 본문 HTML + 앞뒤 글
    const rows = await getNews();
    const i = rows.findIndex((r) => r.id === id);
    if (i < 0) return null;
    const res = await fetch(`${root()}/assets/data/news/${encodeURIComponent(id)}.html`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`본문을 불러오지 못했습니다 (${res.status})`);
    const html = (await res.text()).replace(/(src|href)="assets\//g, `$1="${root()}/assets/`);
    return { post: rows[i], html, prev: rows[i + 1] || null, next: rows[i - 1] || null };
  }

  /** 치료사례 — [{ id, category, title, branch, date, beforeImage, afterImage }] */
  async function getCases({ limit } = {}) {
    // TODO(서버): 사진 주소는 로그인 사용자에게만 내준다 (비공개 저장소 + 기한 있는 주소, API-SPEC '치료사례')
    const rows = withViews(await fetchJson('cases')).sort(byDateDesc);
    return limit ? rows.slice(0, limit) : rows;
  }

  /** 치료사례 하나 — { post, prev, next }. 사진 잠금(로그인)은 화면에서 처리 — TODO(서버): 비로그인이면 이미지 URL 자체를 내주지 않기 */
  async function getCase(id) {
    return pick(await getCases(), id);
  }

  /** FAQ — [{ id, category, question, answer, featured, order }] */
  async function getFaqs({ featured } = {}) {
    // TODO(서버): FAQ 목록 order 순 (API-SPEC 'FAQ')
    const rows = (await fetchJson('faq')).sort((a, b) => a.order - b.order);
    return featured ? rows.filter((r) => r.featured) : rows;
  }

  /* ======================================================================
     상담문의 게시판 — 서버 없이 동작하는 시안 (docs/API-SPEC.md '상담문의')
     ----------------------------------------------------------------------
     지금 저장 방식: assets/data/inquiries.json 더미(비밀번호 모두 1234) + 이 탭에서 새로 쓴 글·답변·삭제(sessionStorage)
       → 페이지를 옮겨도 이어지고, 탭을 닫으면 처음 더미로 돌아간다. 저장소를 못 쓰면 이 페이지 메모리에서만
     서버 연결: 아래 함수 8개의 '안쪽'만 서버 호출로 바꾸면 된다. 화면 코드(common.js 폼 · inquiry.js 상담 현황 · admin.js)는
       이 함수들만 부르고 저장 방식을 모른다. 입력값·반환값·오류 형식은 바꾸지 말 것

     반환 형식 (모든 함수 공통, Promise)
       성공  { ok: true,  data: ... }
       실패  { ok: false, error: { code: string, message: string, field?: string, retryAfter?: number } }
         code: 'VALIDATION'(입력값 오류, field = 칸 이름) · 'NOT_FOUND' · 'WRONG_PASSWORD' · 'LOCKED'(retryAfter 초)
               'RATE_LIMITED'(서버 전용 — 같은 연락처 10분 내 재등록 등) · 'UNAUTHORIZED'(관리자 아님) · 'NETWORK'
         message: 화면에 그대로 보여 줄 한국어 문장
     공통 값
       branch    'changwon' | 'masan'
       status    'received'(접수) | 'answered'(답변완료)
       날짜      ISO 8601 문자열 (예: '2026-11-06T14:10:00+09:00')
     ====================================================================== */
  const INQ_KEY = 'witee-inquiries-demo'; // sessionStorage — 시안 전용
  const INQ_BRANCHES = ['changwon', 'masan'];
  const INQ_STATUS = ['received', 'answered'];
  const INQ_PER_PAGE = 15;
  let inqMemory = null; // 저장소를 못 쓸 때

  const ok = (data) => ({ ok: true, data });
  const fail = (code, message, extra) => ({ ok: false, error: { code, message, ...extra } });

  /** 이름 가리기 — 김민수 → 김○○, 이정 → 이○, 남궁민수 → 남○○○ */
  function maskName(name) {
    const s = String(name || '').trim();
    return s ? s[0] + '○'.repeat(Math.max(1, s.length - 1)) : '';
  }
  /** 연락처 가리기 — 010-1234-5678 → 010-****-5678 */
  function maskPhone(phone) {
    const d = String(phone || '').replace(/\D/g, '');
    return d.length >= 10 ? `${d.slice(0, 3)}-****-${d.slice(-4)}` : '****';
  }
  /** 자동 제목 — '임플란트 상담 문의입니다' */
  const inquiryTitle = (r) => `${r.treatment || '기타'} 상담 문의입니다`;

  /** 목록·공개용 (비밀번호 없이 누구나 볼 수 있는 항목만) */
  const publicRow = (r) => ({ id: r.id, branch: r.branch, treatment: r.treatment, title: inquiryTitle(r), maskedName: maskName(r.name), status: r.status, createdAt: r.createdAt });
  /** 본인 확인 후 (비밀번호 맞음) — 연락처는 여기서도 일부만 */
  const ownerRow = (r) => ({ ...publicRow(r), maskedPhone: maskPhone(r.phone), content: r.content || '', answer: r.answer || '', answeredAt: r.answeredAt || null });
  /** 관리자용 — 전체 항목 (비밀번호 제외) */
  const adminRow = (r) => { const { password, ...rest } = r; return { ...rest, title: inquiryTitle(r) }; };

  async function inqLoad() {
    if (inqMemory) return inqMemory;
    try { const saved = sessionStorage.getItem(INQ_KEY); if (saved) { inqMemory = JSON.parse(saved); return inqMemory; } } catch (e) { /* 아래 더미 */ }
    inqMemory = (await fetchJson('inquiries')).map((r) => ({ ...r }));
    return inqMemory;
  }
  function inqSave() {
    try { sessionStorage.setItem(INQ_KEY, JSON.stringify(inqMemory)); } catch (e) { /* 이 페이지 메모리에만 */ }
  }
  const byCreatedDesc = (a, b) => new Date(b.createdAt) - new Date(a.createdAt) || b.id - a.id;
  const pageOf = (rows, page, perPage) => {
    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const p = Math.min(Math.max(1, Number(page) || 1), totalPages);
    return { rows: rows.slice((p - 1) * perPage, p * perPage), total, page: p, perPage, totalPages };
  };
  const findInq = async (id) => (await inqLoad()).find((r) => r.id === Number(id)) || null;

  /** 글 내용 검사 — 화면(common.js 폼)과 같은 규칙. 서버도 같은 검사를 다시 해야 한다 (API-SPEC '서버에서 반드시 처리할 것') */
  const LINK_RE = /(https?:\/\/|www\.)/i;
  function validateInquiry(d) {
    if (!INQ_BRANCHES.includes(d.branch)) return fail('VALIDATION', '상담 지점을 선택해 주세요.', { field: 'branch' });
    if (!String(d.treatment || '').trim()) return fail('VALIDATION', '진료과목을 선택해 주세요.', { field: 'treatment' });
    if (!String(d.name || '').trim() || String(d.name).trim().length > 20) return fail('VALIDATION', '이름을 입력해 주세요.', { field: 'name' });
    if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(String(d.phone || ''))) return fail('VALIDATION', '연락처를 정확히 입력해 주세요. (예: 010-1234-5678)', { field: 'phone' });
    if (!/^\d{4}$/.test(String(d.password || ''))) return fail('VALIDATION', '비밀번호는 숫자 4자리로 입력해 주세요.', { field: 'password' });
    const content = String(d.content || '').trim();
    if (d.contentRequired && content.length < 5) return fail('VALIDATION', '문의 내용을 5자 이상 입력해 주세요.', { field: 'content' });
    if (content.length > 1000) return fail('VALIDATION', '문의 내용은 1000자 이내로 입력해 주세요.', { field: 'content' });
    if (LINK_RE.test(content)) return fail('VALIDATION', '링크(http, www)가 들어간 글은 등록할 수 없습니다. 주소를 빼고 다시 적어 주세요.', { field: 'content' });
    return null;
  }

  /**
   * 상담 현황 목록 (공개) — 누구나 호출
   * 입력  { branch?: 'changwon'|'masan' (없으면 전체), page?: number (1부터, 기본 1), perPage?: number (기본 15) }
   * 반환  ok → { items: [{ id, branch, treatment, title, maskedName, status, createdAt }], total, page, perPage, totalPages }
   *        items 는 최신순. 연락처·내용·답변·실명은 절대 포함하지 않는다
   * 오류  NETWORK
   */
  async function listInquiries({ branch, page = 1, perPage = INQ_PER_PAGE } = {}) {
    try {
      const rows = (await inqLoad()).filter((r) => !branch || r.branch === branch).sort(byCreatedDesc);
      const p = pageOf(rows, page, perPage);
      return ok({ items: p.rows.map(publicRow), total: p.total, page: p.page, perPage: p.perPage, totalPages: p.totalPages });
    } catch (e) {
      console.error(e);
      return fail('NETWORK', '상담 현황을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }

  /**
   * 본인 문의 열람 — 비밀번호 확인 후 내용·답변
   * 입력  id: number, password: string (숫자 4자리)
   * 반환  ok → { id, branch, treatment, title, maskedName, maskedPhone, content, status, answer, answeredAt, createdAt }
   * 오류  NOT_FOUND · WRONG_PASSWORD · LOCKED(retryAfter 초 — 서버가 틀린 횟수를 셀 때) · NETWORK
   *       시안은 WRONG_PASSWORD 만 돌려주고, 5회 연속 틀림 잠금은 화면(inquiry.js)이 처리한다
   */
  async function getInquiry(id, password) {
    const r = await findInq(id);
    if (!r) return fail('NOT_FOUND', '삭제되었거나 없는 문의입니다.');
    if (String(password) !== String(r.password)) return fail('WRONG_PASSWORD', '비밀번호가 일치하지 않습니다.');
    return ok(ownerRow(r));
  }

  /**
   * 상담문의 등록 — 빠른상담 · 메인 빠른 상담문의 · 상담문의하기 폼 공통 (common.js UI.inquiryForm)
   * 입력  { branch, treatment, name, phone ('010-1234-5678'), password (숫자 4자리), content? (5~1000자, 링크 금지),
   *         source? ('상담문의'|'빠른상담'|'빠른 질문' — 어느 폼에서 왔는지), contentRequired? (내용 칸이 있는 폼이면 true) }
   * 반환  ok → { id, createdAt, notified: boolean (병원 메일 알림 보냄 여부) }
   * 오류  VALIDATION(field) · RATE_LIMITED(서버) · NETWORK
   * 메일 알림: 지금은 저장 뒤 Web3Forms 로 병원에 메일을 보낸다(실패해도 저장은 성공). 서버가 알림을 보내게 되면 notifyByEmail 호출을 지운다
   */
  async function createInquiry(data) {
    const bad = validateInquiry(data);
    if (bad) return bad;
    try {
      const rows = await inqLoad();
      const row = {
        id: rows.reduce((m, r) => Math.max(m, r.id), 0) + 1,
        branch: data.branch, treatment: String(data.treatment).trim(), name: String(data.name).trim(), phone: data.phone,
        content: String(data.content || '').trim(), password: String(data.password), // 시안: 평문. 서버는 반드시 해시로 저장
        source: data.source || '상담문의', status: 'received', answer: '', answeredAt: null, createdAt: new Date().toISOString(),
      };
      rows.push(row);
      inqSave();
      const notified = await notifyByEmail(row).catch((e) => { console.warn('[api] 메일 알림 실패', e); return false; });
      return ok({ id: row.id, createdAt: row.createdAt, notified });
    } catch (e) {
      console.error(e);
      return fail('NETWORK', '접수하지 못했습니다. 잠시 후 다시 시도하거나 전화로 문의해 주세요.');
    }
  }

  /**
   * 접수한 상담이 실제로 병원에 전달되는지 — 화면이 '시안 안내'를 보일지 정할 때 쓴다 (동기, boolean)
   * 지금: Web3Forms 키(WEB3FORMS_ACCESS_KEY)가 있으면 true. 없으면 false → 폼 버튼 아래 시안 안내 + 접수 완료 문구 대신 시안 안내
   * TODO(서버): 서버에 저장·알림이 연결되면 true 를 돌려줄 것 (키 여부와 상관없이)
   */
  function isDeliveryReady() {
    return !!config.WEB3FORMS_ACCESS_KEY;
  }

  /** 병원 메일 알림 (Web3Forms) — createInquiry 안에서만 쓴다. 키가 없으면(로컬·키 미설정) 보내지 않고 false */
  async function notifyByEmail(row) {
    if (!config.WEB3FORMS_ACCESS_KEY) { console.warn('[api] WEB3FORMS_ACCESS_KEY 가 없어 메일 알림을 보내지 않았습니다.'); return false; }
    const branchName = { changwon: '창원점', masan: '마산점' }[row.branch] || row.branch;
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: config.WEB3FORMS_ACCESS_KEY,
        subject: `[화이트e치과 ${branchName}] ${row.source} - ${row.name}`,
        from_name: '화이트e치과 홈페이지',
        지점: branchName, 진료과목: row.treatment, 이름: row.name, 연락처: row.phone, 문의내용: row.content || '',
        botcheck: '', // Web3Forms 자체 스팸 체크 필드
      }),
    });
    const json = await res.json().catch(() => ({}));
    return !!json.success;
  }

  /* ---------- 관리자 (시안: 로그인 없이 열림 — 서버는 모든 관리자 함수에서 관리자 인증 확인, 아니면 UNAUTHORIZED) ---------- */

  /**
   * 관리자 목록 — 전체 항목
   * 입력  { branch?, status?: 'received'|'answered', q?: string (이름·연락처 일부, 연락처는 숫자만 비교), page?, perPage? (기본 15) }
   * 반환  ok → { items: [{ id, branch, treatment, title, name, phone, content, source, status, answer, answeredAt, createdAt }], total, page, perPage, totalPages, counts: { all, received, answered } }
   * 오류  UNAUTHORIZED · NETWORK
   */
  async function adminListInquiries({ branch, status, q, page = 1, perPage = INQ_PER_PAGE } = {}) {
    try {
      const word = String(q || '').trim();
      const digits = word.replace(/\D/g, '');
      const base = (await inqLoad()).filter((r) => (!branch || r.branch === branch) &&
        (!word || r.name.includes(word) || (digits.length >= 2 && r.phone.replace(/\D/g, '').includes(digits))));
      const counts = { all: base.length, received: base.filter((r) => r.status === 'received').length, answered: base.filter((r) => r.status === 'answered').length };
      const p = pageOf(base.filter((r) => !status || r.status === status).sort(byCreatedDesc), page, perPage);
      return ok({ items: p.rows.map(adminRow), total: p.total, page: p.page, perPage: p.perPage, totalPages: p.totalPages, counts });
    } catch (e) {
      console.error(e);
      return fail('NETWORK', '상담 목록을 불러오지 못했습니다.');
    }
  }

  /**
   * 관리자 상세 — 입력 id: number
   * 반환  ok → adminListInquiries 의 items 한 개와 같은 형식
   * 오류  NOT_FOUND · UNAUTHORIZED · NETWORK
   */
  async function adminGetInquiry(id) {
    const r = await findInq(id);
    return r ? ok(adminRow(r)) : fail('NOT_FOUND', '삭제되었거나 없는 문의입니다.');
  }

  /**
   * 답변 등록 (상태가 자동으로 'answered')
   * 입력  id: number, answer: string (1~2000자)
   * 반환  ok → { id, status: 'answered', answer, answeredAt }
   * 오류  VALIDATION(field 'answer') · NOT_FOUND · UNAUTHORIZED · NETWORK
   */
  async function answerInquiry(id, answer) {
    const text = String(answer || '').trim();
    if (!text) return fail('VALIDATION', '답변 내용을 입력해 주세요.', { field: 'answer' });
    if (text.length > 2000) return fail('VALIDATION', '답변은 2000자 이내로 입력해 주세요.', { field: 'answer' });
    const r = await findInq(id);
    if (!r) return fail('NOT_FOUND', '삭제되었거나 없는 문의입니다.');
    Object.assign(r, { answer: text, status: 'answered', answeredAt: new Date().toISOString() });
    inqSave();
    return ok({ id: r.id, status: r.status, answer: r.answer, answeredAt: r.answeredAt });
  }

  /**
   * 상태 변경 — 입력 id: number, status: 'received'|'answered'
   * 반환  ok → { id, status }   ('received' 로 되돌려도 답변 내용은 지우지 않는다)
   * 오류  VALIDATION(field 'status') · NOT_FOUND · UNAUTHORIZED · NETWORK
   */
  async function updateInquiryStatus(id, status) {
    if (!INQ_STATUS.includes(status)) return fail('VALIDATION', '상태 값이 올바르지 않습니다.', { field: 'status' });
    const r = await findInq(id);
    if (!r) return fail('NOT_FOUND', '삭제되었거나 없는 문의입니다.');
    r.status = status;
    inqSave();
    return ok({ id: r.id, status: r.status });
  }

  /**
   * 삭제 — 입력 id: number
   * 반환  ok → { id }
   * 오류  NOT_FOUND · UNAUTHORIZED · NETWORK
   */
  async function deleteInquiry(id) {
    const rows = await inqLoad();
    const i = rows.findIndex((r) => r.id === Number(id));
    if (i < 0) return fail('NOT_FOUND', '삭제되었거나 없는 문의입니다.');
    rows.splice(i, 1);
    inqSave();
    return ok({ id: Number(id) });
  }

  /* ---------- 회원 상태 ---------- */
  // 지금은 정적 화면만: 항상 비로그인. 서버 연결 시 카카오 로그인 등으로 교체 (API-SPEC '로그인·회원가입')
  // 주의: isLoggedIn·getCurrentUser·isAdmin 은 화면에서 동기로 부른다 → 페이지 시작 때 세션을 한 번 읽어 두고 그 값을 돌려줄 것

  /** 로그인 여부 */
  function isLoggedIn() {
    // TODO(서버): 저장해 둔 로그인 세션이 있으면 true
    return false;
  }

  /** 현재 사용자 { id, name, role } 또는 null */
  function getCurrentUser() {
    return null;
  }

  /** 관리자 여부 */
  function isAdmin() {
    // TODO(서버): 현재 사용자 권한이 관리자면 true (화면 표시용 — 실제 권한 확인은 서버에서)
    return false;
  }

  /** 카카오 로그인 시작 */
  async function signInWithKakao() {
    // TODO(서버): 카카오 OAuth 로그인 시작 → 로그인 후 원래 페이지로 돌아오기
    if (window.UI?.alert) window.UI.alert('카카오 로그인은 준비 중입니다.'); else alert('카카오 로그인은 준비 중입니다.');
  }

  async function signOut() {
    // TODO(서버): 세션 지우기
  }

  window.API = {
    getNotices, getNotice, getNews, getNewsPost, getCases, getCase, getFaqs,
    listInquiries, getInquiry, createInquiry, isDeliveryReady, adminListInquiries, adminGetInquiry, answerInquiry, updateInquiryStatus, deleteInquiry,
    isLoggedIn, getCurrentUser, isAdmin, signInWithKakao, signOut,
  };
})();
