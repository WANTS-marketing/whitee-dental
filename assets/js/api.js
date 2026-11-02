/* ==========================================================================
   데이터 접근 계층 (api.js)
   - 1차: /assets/data/*.json 더미 데이터를 읽는다.
   - 2차: 이 파일 안의 함수 내용만 Supabase 호출로 바꾸면 화면 코드는 그대로 둘 수 있다.
     (함수 이름·반환 형태를 유지할 것 — docs/HANDOVER.md "2차 작업" 참고)
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

  /* ---------- 게시판 ---------- */

  /** 공지사항 — [{ id, title, branch, date, pinned }] */
  async function getNotices({ limit } = {}) {
    // TODO(2차): supabase.from('notices').select('*').order('pinned', {ascending:false}).order('date', {ascending:false})
    const rows = (await fetchJson('notice')).sort((a, b) => (b.pinned - a.pinned) || byDateDesc(a, b));
    return limit ? rows.slice(0, limit) : rows;
  }

  /** 치과소식 — [{ id, title, branch, date, thumbnail }] 최신순 */
  async function getNews({ limit } = {}) {
    // TODO(2차): supabase.from('news').select('*').order('date', {ascending:false}).limit(limit)
    const rows = (await fetchJson('news')).sort(byDateDesc);
    return limit ? rows.slice(0, limit) : rows;
  }

  /** 치료사례 — [{ id, category, title, branch, date, beforeImage, afterImage }] */
  async function getCases({ limit } = {}) {
    // TODO(2차): 이미지 URL은 Supabase Storage 비공개 버킷 + 로그인 사용자에게만 signed URL
    const rows = (await fetchJson('cases')).sort(byDateDesc);
    return limit ? rows.slice(0, limit) : rows;
  }

  /** FAQ — [{ id, category, question, answer, featured, order }] */
  async function getFaqs({ featured } = {}) {
    // TODO(2차): supabase.from('faqs').select('*').order('order')
    const rows = (await fetchJson('faq')).sort((a, b) => a.order - b.order);
    return featured ? rows.filter((r) => r.featured) : rows;
  }

  /** 상담문의 목록 (관리자 화면용) */
  async function getInquiries() {
    // TODO(2차): 관리자 권한(RLS)으로만 조회 가능하게
    return (await fetchJson('inquiries')).sort(byDateDesc);
  }

  /* ---------- 상담문의 접수 ---------- */

  /**
   * 상담문의 전송 — 1차: Web3Forms 로 이메일 발송
   * @param {{branch:string, treatment:string, name:string, phone:string, message?:string, source?:string}} data
   * @returns {Promise<{ok:boolean, message:string}>}
   */
  async function submitInquiry(data) {
    // TODO(2차): supabase.from('inquiries').insert(data) 후 메일 알림은 Edge Function 으로
    if (!config.WEB3FORMS_ACCESS_KEY) {
      console.warn('[api] WEB3FORMS_ACCESS_KEY 가 없습니다. .env 설정 후 scripts/build-config.js 를 실행하세요.');
      return { ok: false, message: '현재 온라인 상담 접수 준비 중입니다. 전화로 문의해 주세요.' };
    }
    const branchName = { changwon: '창원점', masan: '마산점' }[data.branch] || data.branch;
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: config.WEB3FORMS_ACCESS_KEY,
        subject: `[화이트e치과 ${branchName}] ${data.source || '상담문의'} - ${data.name}`,
        from_name: '화이트e치과 홈페이지',
        지점: branchName,
        진료과목: data.treatment,
        이름: data.name,
        연락처: data.phone,
        문의내용: data.message || '',
        botcheck: '', // Web3Forms 자체 스팸 체크 필드
      }),
    });
    const json = await res.json().catch(() => ({}));
    return json.success
      ? { ok: true, message: '상담 신청이 접수되었습니다. 확인 후 연락드리겠습니다.' }
      : { ok: false, message: '전송에 실패했습니다. 잠시 후 다시 시도하거나 전화로 문의해 주세요.' };
  }

  /* ---------- 회원 상태 ---------- */
  // 1차는 정적 화면만: 항상 비로그인. 2차에 Supabase Auth(카카오)로 교체.

  /** 로그인 여부 */
  function isLoggedIn() {
    // TODO(2차): return !!(await supabase.auth.getSession()).data.session
    return false;
  }

  /** 현재 사용자 { id, name, role } 또는 null */
  function getCurrentUser() {
    return null;
  }

  /** 관리자 여부 */
  function isAdmin() {
    // TODO(2차): profiles.role === 'admin'
    return false;
  }

  /** 카카오 로그인 시작 */
  async function signInWithKakao() {
    // TODO(2차): supabase.auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo } })
    alert('카카오 로그인은 준비 중입니다.');
  }

  async function signOut() {
    // TODO(2차): supabase.auth.signOut()
  }

  window.API = {
    getNotices, getNews, getCases, getFaqs, getInquiries,
    submitInquiry,
    isLoggedIn, getCurrentUser, isAdmin, signInWithKakao, signOut,
  };
})();
