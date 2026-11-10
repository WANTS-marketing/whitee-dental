/* ==========================================================================
   커뮤니티 게시판 공통 — 목록(치과소식·공지사항·치료사례) + 상세(news-view · notice-view · case-view)
   pages.js 가 <body data-page> 에 맞춰 Board.list('news') / Board.view('news') 를 부른다. 스타일: common.css '게시판'

   목록 [data-board="news|notice|cases"] 안을 통째로 그린다:
     분류 칩 줄 → 도구 줄 [총 N건 | 정렬(최신순 | 오래된순 글자 버튼 — 치료사례만, BOARDS.sortable) · 보기 방식(카드 3개·카드 4개·목록형 / 모바일: 카드·목록형) · 검색]
     → 목록(카드 또는 행) → 페이지 번호 ‹ 1 2 3 … ›
   - 상태(분류 cat · 정렬 sort · 검색 q · 페이지 page)는 주소에 남긴다 → 뒤로가기·새로고침·공유 그대로 (?page=2&cat=임플란트&sort=oldest&q=교정)
   - 보기 방식은 localStorage(witee-board-view-{게시판}) — 저장 못 해도 기본 보기로 동작
   - 한 페이지 12개, 카드 4개 보기는 16개. 보기를 바꾸면 보던 첫 글이 들어 있는 페이지로
   - 페이지를 바꾸면 분류 칩 줄이 헤더 아래 24px 에 오게 스크롤
   - 공지사항: 기본 보기 = 목록형(썸네일·요약 없이 제목·날짜), 고정 공지(pinned)는 어느 페이지든 맨 위 + '공지' 태그
   - 조회수: 1차 데이터에는 없음(api.js 가 0 으로 채움) → 모두 0 이면 조회수 칸을 숨김
   - 검색: 제목 + 요약(치과소식 본문은 글마다 파일이 따로라 요약 문구까지) + 분류 이름
   상세: 이전글 / 다음글(제목·날짜) + '목록으로'(보던 목록 주소 — sessionStorage witee-board-list-{게시판})
   ========================================================================== */
(function () {
  const PER_PAGE = 12;
  const PER_PAGE_CARD4 = 16;
  const NEWS_CATS = ['진료안내', '치료정보', '임플란트·틀니', '치아교정', '병원소식']; // build-story.js CATEGORY_RULES 와 같은 이름·순서
  const BRANCH_CATS = { changwon: ['창원점'], masan: ['마산점'], both: ['창원점', '마산점'] };
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

  const fullDate = (iso) => { const d = new Date(iso); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`; };

  /* ---------- 게시판별 설정 ---------- */
  const BOARDS = {
    news: {
      name: '치과소식', list: 'news.html', view: 'news-view.html', idPrefix: 'news',
      load: () => window.API.getNews(),
      catsOf: (r) => [r.category],
      catOrder: NEWS_CATS,
      catLabel: '분류',
      sortable: false, // 정렬 없음 — 항상 최신순
      defaultView: 'card3',
      thumb: (r) => r.thumbnail,
      summary: (r) => r.summary || '',
      search: (r) => `${r.title} ${r.summary || ''} ${r.category}`,
      empty: '등록된 소식이 없습니다.',
    },
    notice: {
      name: '공지사항', list: 'notice.html', view: 'notice-view.html', idPrefix: 'notice',
      load: () => window.API.getNotices(),
      catsOf: (r) => BRANCH_CATS[r.branch] || [],
      catOrder: ['창원점', '마산점'],
      catLabel: '지점',
      sortable: false, // 정렬 없음 — 고정 공지 맨 위 + 최신순
      defaultView: 'list',
      pinned: true,
      listPlain: true, // 목록형: 썸네일·요약 없이 제목·날짜
      lines: true, // 2026-11-09: 메인과 같은 한 줄 목록 [번호 | 지점 | 제목 | 날짜] (UI.noticeLine) — 보기 방식 버튼 없음
      perPage: 10, // 10개 넘을 때만 페이지 번호
      allCats: true, // 지점 칩(전체·창원점·마산점)은 글이 없어도 늘 보임 → 결과 0개면 빈 상태 박스
      emptyBox: { title: '등록된 공지사항이 없습니다', desc: '진료시간·휴진 안내는 아래에서 확인하실 수 있어요' },
      thumb: (r) => r.thumbnail,
      summary: (r) => r.summary || '',
      search: (r) => `${r.title} ${r.summary || ''} ${r.body || ''}`,
      empty: '등록된 공지사항이 없습니다.',
    },
    cases: {
      name: '치료사례', list: 'cases.html', view: 'case-view.html', idPrefix: 'case',
      load: () => window.API.getCases(),
      // 분류 = 큰 분류(치아교정·심미치료·보철·임플란트, 복수 가능) + 교정 세부 7종 · 심미 세부 4종(category 키 → 이름, api.js CASE_CATEGORIES)
      catsOf: (r) => [...(r.categories || [r.categoryName]), ...(r.categoryLabel ? [r.categoryLabel] : [])],
      catOrder: ['치아교정', '덧니교정', '돌출입교정', '개방교합', '과개교합', '반대교합', '부분·틈새교정', '어린이교정', '심미치료', '치아미백', '라미네이트', '올세라믹', '잇몸성형', '보철', '임플란트'],
      allCats: true, // 칩은 사례가 없어도 늘 보임(치아교정 갤러리 '치료사례 보기' → ?category= 로 들어와도 선택 상태)
      catLabel: '진료',
      sortable: true, // 정렬 = [최신순 | 오래된순] 글자 버튼 (헤더 로그인 | 회원가입처럼 나란히)
      defaultView: 'card3',
      locked: () => !window.API.isLoggedIn(), // 2026-11-09: 로그인 전에는 치료 전·후 사진 모두 흐림 자리 + '로그인 후 확인하실 수 있습니다'
      thumb: (r) => r.beforeImage,
      pair: true, // 썸네일 = [BEFORE | AFTER] 나란히 두 칸 (casePair)
      // 카드 글 = 치료 정보(진료 분류 · 치료 기간 · 발치 여부). 예전 데이터(기간 칸 없음)는 본문 첫 줄
      summary: (r) => [r.categoryLabel || r.categoryName, r.period && `치료 기간 ${r.period}`, r.extraction].filter(Boolean).join(' · ') || (r.body || '').split('\n')[0],
      note: '치료 결과는 개인의 구강 상태에 따라 다를 수 있으며 부작용이 발생할 수 있습니다.', // 모든 사례 카드 아래 고지
      search: (r) => `${r.title} ${r.originalTitle || ''} ${r.body || ''} ${r.categoryName} ${r.categoryLabel || ''}`,
      empty: '등록된 사례가 없습니다.',
      emptyBox: { title: '등록된 치료사례가 없습니다', desc: '환자분의 게시 동의를 받은 사례를 순서대로 올려 드립니다' },
    },
  };
  const listKey = (b) => `witee-board-list-${b}`;
  const viewKey = (b) => `witee-board-view-${b}`;

  const ICON = {
    card3: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="3" width="4.4" height="14" rx="1"/><rect x="7.8" y="3" width="4.4" height="14" rx="1"/><rect x="13.6" y="3" width="4.4" height="14" rx="1"/></svg>',
    card4: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="3" width="6.8" height="6.4" rx="1"/><rect x="11.2" y="3" width="6.8" height="6.4" rx="1"/><rect x="2" y="10.6" width="6.8" height="6.4" rx="1"/><rect x="11.2" y="10.6" width="6.8" height="6.4" rx="1"/></svg>',
    card: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="2.5" width="14" height="9" rx="1"/><rect x="3" y="13" width="14" height="1.6" rx=".8"/><rect x="3" y="16" width="9" height="1.6" rx=".8"/></svg>',
    list: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="3" width="4" height="4" rx="1"/><rect x="8" y="4.2" width="10" height="1.6" rx=".8"/><rect x="2" y="8" width="4" height="4" rx="1"/><rect x="8" y="9.2" width="10" height="1.6" rx=".8"/><rect x="2" y="13" width="4" height="4" rx="1"/><rect x="8" y="14.2" width="10" height="1.6" rx=".8"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
    arrow: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4"/></svg>',
    chevron: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3.5 6l4.5 4.5L12.5 6"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  };
  const SORTS = [{ v: 'latest', label: '최신순' }, { v: 'oldest', label: '오래된순' }];
  const VIEW_LABEL = { card3: '카드 3개씩 보기', card4: '카드 4개씩 보기', card: '카드로 보기', list: '목록형으로 보기' };

  function fade(el) {
    if (!el) return;
    el.classList.remove('is-fade-in');
    void el.offsetWidth;
    el.classList.add('is-fade-in');
    el.addEventListener('animationend', () => el.classList.remove('is-fade-in'), { once: true });
  }

  /** 치료사례 썸네일 두 칸 — BEFORE(선명) / AFTER(로그인 전: 미리 흐리게 만든 미리보기 + 자물쇠 '로그인 후 확인')
      AFTER 원본 주소는 로그인일 때만 데이터에 있다(api.js getCases) — 없으면 흐림 미리보기 */
  const LOCK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';
  /* 2026-11-09: [BEFORE | AFTER] 나란히. 로그인 전 = 두 칸 모두 흐림 자리 + 가운데 '로그인 후 확인하실 수 있습니다' + 로그인(카드 전체가 로그인으로 감)
     로그인 후 = 사진(없으면 회색 '사진 자리' — 시안·예시 사례) */
  function casePair(r, locked) {
    const { img, esc } = window.UI;
    const half = (src, tag, alt) => `<span class="case-pair__half img-ph${locked ? ' is-locked' : ''}">${src ? `<img src="${img(src)}" alt="${locked ? '' : alt}" loading="lazy" decoding="async">` : `<span class="case-pair__ph"${locked ? ' aria-hidden="true"' : ''}>${locked ? '' : '사진 자리'}</span>`}<span class="case-pair__tag">${tag}</span></span>`;
    return half(locked ? null : r.beforeImage, 'BEFORE', `${esc(r.title)} 치료 전`)
      + half(locked ? null : r.afterImage, 'AFTER', `${esc(r.title)} 치료 후`)
      + (locked ? `<span class="case-pair__lock">${LOCK_SVG}<span class="case-pair__lock-text">로그인 후 확인하실 수 있습니다</span><span class="case-pair__login">로그인</span></span>` : '');
  }
  const caseLoginHref = (id) => `../member/login.html?return=${encodeURIComponent(`community/case-view.html?id=${id}`)}`;

  /* ======================================================================
     목록
     ====================================================================== */
  async function list(board) {
    const cfg = BOARDS[board];
    const root = document.querySelector(`[data-board="${board}"]`);
    if (!cfg || !root) return;
    const { esc, img, branchBadge } = window.UI;
    const locked = cfg.locked ? cfg.locked() : false;
    const loginNote = board === 'cases' && document.querySelector('[data-cases-login]');
    if (loginNote) loginNote.hidden = !locked; // 치료사례 '로그인 후 확인' 안내

    // 보기 방식 (localStorage)
    let view = cfg.defaultView;
    if (!cfg.lines) { try { const v = localStorage.getItem(viewKey(board)); if (['card3', 'card4', 'list'].includes(v)) view = v; } catch (e) { /* 기본 보기 */ } }

    root.innerHTML = `
      <nav class="board-cats" aria-label="${esc(cfg.name)} ${esc(cfg.catLabel)}"><ul class="board-cats__list" data-b-cats></ul></nav>
      <div class="board-tools">
        <p class="board-tools__count" data-b-count aria-live="polite"></p>
        <div class="board-tools__right">
          ${cfg.sortable ? `<div class="board-sort" role="group" aria-label="정렬" data-b-sort>${SORTS.map((s) => `<button type="button" class="board-sort__btn" data-b-sort-val="${s.v}">${s.label}</button>`).join('')}</div>` : ''}
          ${cfg.lines ? '' : `<div class="board-tools__views" role="group" aria-label="보기 방식">
            ${['card3', 'card4', 'card', 'list'].map((v) => `<button type="button" class="board-tools__view board-tools__view--${v}" data-b-view="${v}" aria-label="${VIEW_LABEL[v]}" title="${VIEW_LABEL[v]}">${ICON[v]}</button>`).join('')}
          </div>`}
        </div>
        <form class="board-search" role="search" data-b-search>
          <input class="board-search__input" type="search" name="q" placeholder="제목·내용 검색" aria-label="${esc(cfg.name)} 제목·내용 검색" enterkeyhint="search">
          <button class="board-search__btn" type="submit" aria-label="검색">${ICON.search}</button>
        </form>
      </div>
      <ul class="board-list" data-b-list><li class="board-list__empty">불러오는 중입니다.</li></ul>
      <nav class="pager" aria-label="페이지" data-b-pager></nav>`;
    const $ = (s) => root.querySelector(s);
    const catsEl = $('[data-b-cats]'); const countEl = $('[data-b-count]'); const listEl = $('[data-b-list]'); const pagerEl = $('[data-b-pager]');
    const sortEl = $('[data-b-sort]'); const searchEl = $('[data-b-search]'); const qInput = searchEl.elements.q;
    window.UI.initSelects(root); // 정렬 = 사이트 커스텀 드롭다운

    let rows = [];
    let cats = [];
    let hasViews = false;

    const readState = () => {
      const p = new URLSearchParams(location.search);
      let cat = p.get('cat') || '';
      // 치료사례 ?category= : 예전 주소(implant 등 — 메인 치료사례 카드) · 교정 세부 7종(ortho-crowding 등 — 치아교정 갤러리 '치료사례 보기') → 분류 이름
      if (!cat && board === 'cases' && p.get('category')) cat = { orthodontics: '치아교정', aesthetic: '심미치료', prosthetics: '보철', implant: '임플란트', ...(window.API.CASE_CATEGORIES || {}) }[p.get('category')] || '';
      if (!cats.includes(cat)) cat = '';
      return { cat, sort: cfg.sortable && p.get('sort') === 'oldest' ? 'oldest' : 'latest', q: (p.get('q') || '').trim(), page: Math.max(1, parseInt(p.get('page'), 10) || 1) };
    };
    const urlOf = ({ cat, sort, q, page }) => {
      const p = new URLSearchParams();
      if (page > 1) p.set('page', page);
      if (cat) p.set('cat', cat);
      if (sort === 'oldest') p.set('sort', 'oldest');
      if (q) p.set('q', q);
      const s = p.toString();
      return location.pathname + (s ? `?${s}` : '');
    };
    const perPage = () => cfg.perPage || (view === 'card4' && !isMobile() ? PER_PAGE_CARD4 : PER_PAGE);

    const tagsOf = (r) => `${cfg.pinned && r.pinned ? '<span class="board-tag">공지</span>' : ''}${r.branch && board !== 'news' ? branchBadge(r.branch) : ''}`;
    const metaOf = (r) => `<time datetime="${esc(r.date)}">${fullDate(r.date)}</time>${hasViews ? `<span class="board-views">조회 ${r.views.toLocaleString('ko-KR')}</span>` : ''}`;
    // 치료사례 로그인 전: 카드를 누르면 로그인(로그인 후 그 사례로 돌아옴 — pages.js loginReturnUrl)
    const href = (r) => (board === 'cases' && locked ? caseLoginHref(r.id) : `${cfg.view}?id=${encodeURIComponent(r.id)}${window.API.mockQuery ? window.API.mockQuery() : ''}`);
    // 빈 상태 박스 (공지사항 0개 · 지점 필터 결과 0개) — 버튼: 진료시간·오시는길 / 상담문의
    const EMPTY_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10v4a1 1 0 001 1h2l5 4V5L7 9H5a1 1 0 00-1 1z"/><path d="M16 9a4 4 0 010 6M18.5 6.5a7.5 7.5 0 010 11"/></svg>';
    const emptyBoxHtml = () => `<li class="board-empty"><span class="board-empty__icon">${EMPTY_ICON}</span><p class="board-empty__title">${esc(cfg.emptyBox.title)}</p><p class="board-empty__desc">${esc(cfg.emptyBox.desc)}</p><p class="board-empty__btns"><a class="board-empty__btn board-empty__btn--fill" href="../about/clinic.html">진료시간·오시는길</a><a class="board-empty__btn" href="../faq/contact.html">상담문의</a></p></li>`;
    const lineHtml = (r, no) => `<li id="${cfg.idPrefix}-${esc(r.id)}">${window.UI.noticeLine(r, { href: href(r), no, table: true })}</li>`;
    const thumbHtml = (r, cls) => (cfg.pair ? `<span class="${cls} case-pair">${casePair(r, locked)}</span>`
      : `<span class="${cls} img-ph${locked ? ' is-locked' : ''}"><img src="${img(cfg.thumb(r))}" alt="" loading="lazy" decoding="async">${locked ? '<span class="board-lock">로그인 후 확인</span>' : ''}</span>`);

    const cardHtml = (r) => `
      <li class="board-card${r.pinned && cfg.pinned ? ' is-pinned' : ''}" id="${cfg.idPrefix}-${esc(r.id)}">
        <a class="board-card__link" href="${href(r)}">
          <span class="board-card__media">${thumbHtml(r, 'board-card__thumb')}<span class="board-card__hover" aria-hidden="true"><span class="board-card__hover-btn">자세히 보기${ICON.arrow}</span></span></span>
          <span class="board-card__top">${tagsOf(r)}${board === 'notice' ? '' : `<span class="board-card__cat">${esc(cfg.catsOf(r).join('·'))}</span>`}</span>
          <strong class="board-card__title">${esc(r.title)}</strong>
          <span class="board-card__sum">${esc(cfg.summary(r))}</span>
          <span class="board-card__meta">${metaOf(r)}</span>
          ${cfg.note ? `<span class="board-card__note">${esc(cfg.note)}</span>` : ''}
        </a>
      </li>`;
    const rowHtml = (r) => {
      return `
      <li class="board-row${r.pinned && cfg.pinned ? ' is-pinned' : ''}${cfg.listPlain ? ' is-plain' : ''}" id="${cfg.idPrefix}-${esc(r.id)}">
        <a class="board-row__link" href="${href(r)}">
          ${cfg.listPlain ? '' : thumbHtml(r, 'board-row__thumb')}
          <span class="board-row__text">
            <span class="board-row__top">${tagsOf(r)}${cfg.listPlain ? '' : `<span class="board-row__cat">${esc(cfg.catsOf(r).join('·'))}</span>`}</span>
            <strong class="board-row__title">${esc(r.title)}</strong>
            ${cfg.listPlain ? '' : `<span class="board-row__sum">${esc(cfg.summary(r))}</span>`}
            ${cfg.note ? `<span class="board-row__note">${esc(cfg.note)}</span>` : ''}
          </span>
          <span class="board-row__meta">${metaOf(r)}</span>
        </a>
      </li>`;
    };

    function filtered({ cat, sort, q }) {
      const words = q.toLowerCase().split(/\s+/).filter(Boolean);
      let out = rows.filter((r) => (!cat || cfg.catsOf(r).includes(cat)) && words.every((w) => cfg.search(r).toLowerCase().includes(w)));
      const byDate = (a, b) => new Date(b.date) - new Date(a.date);
      out = out.slice().sort(sort === 'oldest' ? (a, b) => byDate(b, a) : byDate);
      if (cfg.pinned) return { pinned: out.filter((r) => r.pinned), rest: out.filter((r) => !r.pinned) };
      return { pinned: [], rest: out };
    }

    function pagerHtml(page, pages, st) {
      if (pages <= 1) return '';
      const btn = (p, label, cls = '', aria = '') => `<a class="pager__btn ${cls}" href="${esc(urlOf({ ...st, page: p }))}" data-b-page="${p}"${aria}>${label}</a>`;
      const off = (label, cls) => `<span class="pager__btn ${cls} is-disabled" aria-hidden="true">${label}</span>`;
      const gap = '<span class="pager__gap" aria-hidden="true">…</span>';
      let h = page > 1 ? btn(page - 1, ICON.left, 'pager__arrow', ' aria-label="이전 페이지"') : off(ICON.left, 'pager__arrow');
      // 현재 기준 앞뒤 2개 + 처음·마지막, 사이가 비면 …
      const from = Math.max(1, Math.min(page - 2, pages - 4));
      const to = Math.min(pages, from + 4);
      const num = (p) => btn(p, p, p === page ? 'is-current' : '', p === page ? ' aria-current="page"' : ` aria-label="${p}페이지"`);
      if (from > 1) { h += num(1); if (from > 2) h += gap; }
      for (let p = from; p <= to; p++) h += num(p);
      if (to < pages) { if (to < pages - 1) h += gap; h += num(pages); }
      h += page < pages ? btn(page + 1, ICON.right, 'pager__arrow', ' aria-label="다음 페이지"') : off(ICON.right, 'pager__arrow');
      return h;
    }

    function draw({ animate = false } = {}) {
      const st = readState();
      const { pinned, rest } = filtered(st);
      const per = perPage();
      const pages = Math.max(1, Math.ceil(rest.length / per));
      const page = Math.min(st.page, pages);
      const slice = rest.slice((page - 1) * per, page * per);
      const shown = [...pinned, ...slice];
      try { sessionStorage.setItem(listKey(board), location.pathname + location.search); } catch (e) { /* 목록으로 = 첫 페이지 */ }

      // 분류 칩 (검색 결과 기준 글 수 — 0 개면 숨김, 지금 분류는 남김)
      const base = filtered({ ...st, cat: '' });
      const all = [...base.pinned, ...base.rest];
      const n = (c) => (c ? all.filter((r) => cfg.catsOf(r).includes(c)).length : all.length);
      catsEl.innerHTML = ['', ...cats].filter((c) => !c || n(c) || c === st.cat || cfg.allCats).map((c) => `
        <li><a class="board-cats__btn" href="${esc(urlOf({ ...st, cat: c, page: 1 }))}" data-b-cat="${esc(c)}"${c === st.cat ? ' aria-current="true"' : ''}>${c ? esc(c) : '전체'} <span class="board-cats__n">${n(c)}</span></a></li>`).join('');

      countEl.innerHTML = `총 <b>${(pinned.length + rest.length).toLocaleString('ko-KR')}</b>건${st.q ? ` <span class="board-tools__q">‘${esc(st.q)}’ 검색 결과</span> <a class="board-tools__clear" href="${esc(urlOf({ ...st, q: '', page: 1 }))}" data-b-clear>검색 지우기</a>` : ''}`;
      sortEl?.querySelectorAll('[data-b-sort-val]').forEach((s) => s.setAttribute('aria-pressed', String(s.dataset.bSortVal === st.sort)));
      if (document.activeElement !== qInput) qInput.value = st.q;

      // 보기 방식 (모바일 = 카드 1열 / 목록형)
      const shownView = view;
      listEl.dataset.view = shownView;
      root.querySelectorAll('[data-b-view]').forEach((b) => {
        const v = b.dataset.bView;
        b.setAttribute('aria-pressed', String(v === 'card' ? view !== 'list' : v === view));
      });

      if (cfg.lines) {
        // 한 줄 표: 번호 = 고정 공지 빼고 최신 글이 큰 번호 (전체 rest 기준)
        listEl.classList.add('notice-lines', 'notice-lines--table');
        const head = '<li class="notice-lines__head" aria-hidden="true"><span>번호</span><span>지점</span><span>제목</span><span>작성일</span></li>';
        listEl.innerHTML = shown.length
          ? head + shown.map((r) => lineHtml(r, r.pinned ? '' : String(rest.length - rest.indexOf(r)))).join('')
          : (st.q ? `<li class="board-list__empty">‘${esc(st.q)}’ 검색 결과가 없습니다.</li>` : emptyBoxHtml());
      } else {
        listEl.innerHTML = shown.length
          ? shown.map(view === 'list' ? rowHtml : cardHtml).join('')
          : (st.q ? `<li class="board-list__empty">‘${esc(st.q)}’ 검색 결과가 없습니다.</li>` : cfg.emptyBox ? emptyBoxHtml() : `<li class="board-list__empty">${esc(cfg.empty)}</li>`);
      }
      listEl.querySelectorAll('img').forEach((im) => im.addEventListener('error', () => im.classList.add('is-missing'), { once: true }));
      pagerEl.innerHTML = pagerHtml(page, pages, st);
      if (animate) { fade(listEl); fade(pagerEl); }
    }

    // 분류 칩 줄이 헤더 아래 24px 에 오게
    function toTop() {
      const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
      const y = root.getBoundingClientRect().top + window.scrollY - headerH - 24;
      window.scrollTo({ top: Math.max(0, y), behavior: reduceMotion() ? 'auto' : 'smooth' });
    }
    const push = (st, { scroll = false } = {}) => {
      history.pushState(null, '', urlOf(st));
      draw({ animate: true });
      if (scroll) toTop();
    };

    // 칩·페이지 번호·검색 지우기: 주소만 바꾸고 다시 그림 (새 창·가운데 클릭은 브라우저 기본)
    root.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-b-cat], a[data-b-page], a[data-b-clear]');
      if (a && !(e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) {
        e.preventDefault();
        history.pushState(null, '', a.getAttribute('href'));
        draw({ animate: true });
        if (a.hasAttribute('data-b-page')) toTop();
        return;
      }
      const vb = e.target.closest('[data-b-view]');
      if (vb) {
        const next = vb.dataset.bView === 'card' ? 'card3' : vb.dataset.bView;
        if (next === view) return;
        // 보던 첫 글이 들어 있는 페이지로
        const st = readState();
        const first = (st.page - 1) * perPage();
        view = next;
        try { localStorage.setItem(viewKey(board), view); } catch (err) { /* 이번 페이지에만 적용 */ }
        const page = Math.floor(first / perPage()) + 1;
        history.replaceState(null, '', urlOf({ ...st, page }));
        draw({ animate: true });
        return;
      }
    });
    sortEl?.addEventListener('click', (e) => { const s = e.target.closest('[data-b-sort-val]'); if (s && s.dataset.bSortVal !== readState().sort) push({ ...readState(), sort: s.dataset.bSortVal, page: 1 }); });
    searchEl.addEventListener('submit', (e) => {
      e.preventDefault();
      push({ ...readState(), q: qInput.value.trim(), page: 1 });
      qInput.blur();
    });
    qInput.addEventListener('search', () => { if (!qInput.value && readState().q) push({ ...readState(), q: '', page: 1 }); }); // 입력칸 × 로 지우면 전체로
    window.addEventListener('popstate', () => draw({ animate: true }));
    // 화면 폭이 모바일 경계를 넘으면(카드 4개 16개 ↔ 12개) 다시 그림
    window.matchMedia('(max-width: 768px)').addEventListener('change', () => draw());

    try {
      rows = await cfg.load();
      hasViews = rows.some((r) => r.views > 0);
      cats = cfg.allCats ? cfg.catOrder.slice() : cfg.catOrder ? cfg.catOrder.filter((c) => rows.some((r) => cfg.catsOf(r).includes(c))) : [...new Set(rows.flatMap(cfg.catsOf))];
      // 예전 주소(#news-story-89 · #notice-nt7 — 메인 카드)로 들어오면 상세로
      const m = location.hash.match(/^#(news|notice|case)-(.+)$/);
      if (m) { const id = decodeURIComponent(m[2]); if (rows.some((r) => r.id === id)) { location.replace(`${cfg.view}?id=${encodeURIComponent(id)}`); return; } }
      draw();
    } catch (err) {
      console.error(err);
      listEl.innerHTML = '<li class="board-list__empty">목록을 불러오지 못했습니다.</li>';
    }
  }

  /* ======================================================================
     상세
     ====================================================================== */
  async function view(board) {
    const cfg = BOARDS[board];
    const box = document.querySelector('[data-board-view]');
    if (!cfg || !box) return;
    const { esc, img, branchBadge } = window.UI;
    let listUrl = cfg.list;
    try { const saved = sessionStorage.getItem(listKey(board)); if (saved && saved.split('?')[0].endsWith(`/${cfg.list}`)) listUrl = saved; } catch (e) { /* 기본 목록 */ }
    const foot = `<div class="article__foot"><a class="btn article__list" href="${esc(listUrl)}">목록으로</a></div>`;
    const id = new URLSearchParams(location.search).get('id');
    try {
      const data = id && (board === 'news' ? await window.API.getNewsPost(id) : board === 'notice' ? await window.API.getNotice(id) : await window.API.getCase(id));
      if (!data) { box.innerHTML = `<p class="board-list__empty">글을 찾을 수 없습니다. 삭제되었거나 주소가 바뀌었을 수 있습니다.</p>${foot}`; return; }
      const { post, prev, next } = data;
      document.title = `${post.title} | ${cfg.name} | 화이트e치과`;
      document.querySelector('meta[name="description"]')?.setAttribute('content', cfg.summary(post) || post.title);
      const canon = document.createElement('link'); // 글마다 주소가 달라 canonical 은 여기서 (?id= 포함)
      canon.rel = 'canonical';
      canon.href = `${location.origin}${location.pathname}?id=${encodeURIComponent(post.id)}`;
      document.head.appendChild(canon);

      const catLinks = cfg.catsOf(post).map((c) => `<a class="article__cat" href="${cfg.list}?cat=${encodeURIComponent(c)}">${esc(c)}</a>`).join('<span class="article__cat-sep" aria-hidden="true">·</span>');
      const tags = `${cfg.pinned && post.pinned ? '<span class="board-tag">공지</span>' : ''}${board === 'cases' && post.branch ? branchBadge(post.branch) : ''}`;
      const views = post.views > 0 ? ` · 조회 ${post.views.toLocaleString('ko-KR')}` : '';
      let body = '';
      if (board === 'news') body = data.html;
      else if (board === 'notice') {
        body = `${post.thumbnail ? `<figure><img src="${img(post.thumbnail)}" alt="" loading="lazy"></figure>` : ''}<p>${esc(post.body || post.summary || '')}</p>`; // TODO(2차): 공지 본문(HTML)
      } else {
        // 치료사례 (2026-11-09): BEFORE | AFTER 모두 로그인 회원만 — 비로그인 = 흐림 자리 + '로그인 후 확인하실 수 있습니다' + 로그인(로그인 후 이 글로 돌아옴)
        //   + 치료 정보(진료 분류 · 치료 기간 · 발치 여부) + 고지. 로그인했지만 사진 주소가 없으면(시안·예시) 회색 '사진 자리'
        const locked = cfg.locked();
        const back = encodeURIComponent(location.pathname.split('/').slice(-2).join('/') + location.search); // 'community/case-view.html?id=…'
        const fig = (src, tag, cap) => `<figure class="case-view__fig${locked ? ' is-locked' : ''}"><span class="case-view__img img-ph">${!locked && src ? `<img src="${img(src)}" alt="${esc(post.title)} ${cap} 사진">` : `<span class="case-pair__ph">${locked ? '' : '사진 자리'}</span>`}</span><figcaption><b>${tag}</b> ${cap}</figcaption></figure>`;
        const info = [['진료 분류', post.categoryLabel || post.categoryName], ['치료 기간', post.period], ['발치 여부', post.extraction]].filter(([, v]) => v);
        body = `<div class="case-view${locked ? ' is-locked' : ''}">
            ${fig(post.beforeImage, 'BEFORE', '치료 전')}${fig(post.afterImage, 'AFTER', '치료 후')}
            ${locked ? `<span class="case-view__lock">${LOCK_SVG}<span>로그인 후 확인하실 수 있습니다</span><a class="btn btn--point case-view__login" href="../member/login.html?return=${back}">로그인</a></span>` : ''}
          </div>
          ${info.length ? `<dl class="case-view__info">${info.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
          ${post.body ? `<p class="case-view__body">${esc(post.body)}</p>` : ''}
          <p class="case-view__note">${esc(cfg.note)}</p>`;
      }
      const navItem = (p, label, rel) => p
        ? `<a class="article-nav__item" href="${cfg.view}?id=${encodeURIComponent(p.id)}" rel="${rel}"><span class="article-nav__label">${label}</span><span class="article-nav__title">${esc(p.title)}</span><time class="article-nav__date" datetime="${esc(p.date)}">${fullDate(p.date)}</time></a>`
        : `<p class="article-nav__item is-empty"><span class="article-nav__label">${label}</span><span class="article-nav__title">${label === '이전글' ? '이전 글이 없습니다.' : '다음 글이 없습니다.'}</span></p>`;
      box.innerHTML = `
        <article class="article">
          <header class="article__head">
            <p class="article__cats">${tags}${catLinks}</p>
            <h2 class="article__title">${esc(board === 'cases' && post.originalTitle ? post.originalTitle : post.title)}</h2>
            <p class="article__meta"><time datetime="${esc(post.date)}">${fullDate(post.date)}</time>${views}</p>
          </header>
          <div class="article__body">${body}</div>
        </article>
        <nav class="article-nav" aria-label="이전글 다음글">
          ${navItem(next, '다음글', 'next')}
          ${navItem(prev, '이전글', 'prev')}
        </nav>
        ${foot}`;
      box.querySelectorAll('img').forEach((im) => im.addEventListener('error', () => im.classList.add('is-missing'), { once: true }));
    } catch (err) {
      console.error(err);
      box.innerHTML = `<p class="board-list__empty">글을 불러오지 못했습니다.</p>${foot}`;
    }
  }

  window.Board = { list, view };
})();
