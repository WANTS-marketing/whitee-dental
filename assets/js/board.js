/* ==========================================================================
   커뮤니티 게시판 공통 — 목록(치과소식·공지사항·치료사례) + 상세(news-view · notice-view · case-view)
   pages.js 가 <body data-page> 에 맞춰 Board.list('news') / Board.view('news') 를 부른다. 스타일: common.css '게시판'

   목록 [data-board="news|notice|cases"] 안을 통째로 그린다:
     분류 칩 줄 → 도구 줄 [총 N건 | 정렬(최신순·조회순) · 보기 방식(카드 3개·카드 4개·목록형 / 모바일: 카드·목록형) · 검색]
     → 목록(카드 또는 행) → 페이지 번호 ‹ 1 2 3 … ›
   - 상태(분류 cat · 정렬 sort · 검색 q · 페이지 page)는 주소에 남긴다 → 뒤로가기·새로고침·공유 그대로 (?page=2&cat=치아교정&sort=views&q=교정)
   - 보기 방식은 localStorage(witee-board-view-{게시판}) — 저장 못 해도 기본 보기로 동작
   - 한 페이지 12개, 카드 4개 보기는 16개. 보기를 바꾸면 보던 첫 글이 들어 있는 페이지로
   - 페이지를 바꾸면 분류 칩 줄이 헤더 아래 24px 에 오게 스크롤
   - 목록형 '펼쳐보기': 그 자리에서 본문 앞부분(약 5줄) + 대표 이미지 + '자세히 보기 →' — 한 번에 하나만
   - 공지사항: 기본 보기 = 목록형(썸네일·요약 없이 제목·날짜), 고정 공지(pinned)는 어느 페이지든 맨 위 + '공지' 태그
   - 조회수: 1차 데이터에는 없음(api.js 가 0 으로 채움) → 모두 0 이면 조회수 칸을 숨김. 조회순 정렬은 조회수 같으면 최신순
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
  // 본문 HTML → 펼쳐보기용 글자 (줄바꿈 <br> 은 띄어쓰기로)
  const textOf = (html) => { const d = new DOMParser().parseFromString(html.replace(/<br\s*\/?>/gi, ' '), 'text/html'); return [...d.querySelectorAll('p, li, h2, h3, h4')].map((e) => e.textContent.trim()).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim(); };
  const firstImg = (html) => new DOMParser().parseFromString(html, 'text/html').querySelector('img')?.getAttribute('src') || '';

  /* ---------- 게시판별 설정 ---------- */
  const BOARDS = {
    news: {
      name: '치과소식', list: 'news.html', view: 'news-view.html', idPrefix: 'news',
      load: () => window.API.getNews(),
      catsOf: (r) => [r.category],
      catOrder: NEWS_CATS,
      catLabel: '분류',
      defaultView: 'card3',
      thumb: (r) => r.thumbnail,
      summary: (r) => r.summary || '',
      search: (r) => `${r.title} ${r.summary || ''} ${r.category}`,
      empty: '등록된 소식이 없습니다.',
      async expand(r) {
        const data = await window.API.getNewsPost(r.id);
        return { text: textOf(data?.html || '') || r.summary || '', image: firstImg(data?.html || '') || window.UI.img(r.thumbnail) };
      },
    },
    notice: {
      name: '공지사항', list: 'notice.html', view: 'notice-view.html', idPrefix: 'notice',
      load: () => window.API.getNotices(),
      catsOf: (r) => BRANCH_CATS[r.branch] || [],
      catOrder: ['창원점', '마산점'],
      catLabel: '지점',
      defaultView: 'list',
      pinned: true,
      listPlain: true, // 목록형: 썸네일·요약 없이 제목·날짜
      thumb: (r) => r.thumbnail,
      summary: (r) => r.summary || '',
      search: (r) => `${r.title} ${r.summary || ''} ${r.body || ''}`,
      empty: '등록된 공지사항이 없습니다.',
      async expand(r) { return { text: r.body || r.summary || '', image: r.thumbnail ? window.UI.img(r.thumbnail) : '' }; },
    },
    cases: {
      name: '치료사례', list: 'cases.html', view: 'case-view.html', idPrefix: 'case',
      load: () => window.API.getCases(),
      catsOf: (r) => [r.categoryName],
      catOrder: null, // 글에 나온 순서
      catLabel: '진료',
      defaultView: 'card3',
      locked: () => !window.API.isLoggedIn(), // 로그인 전에는 사진 흐림
      thumb: (r) => r.beforeImage,
      summary: (r) => `${r.categoryName} 치료 전·후 사진`,
      search: (r) => `${r.title} ${r.categoryName}`,
      empty: '등록된 사례가 없습니다.',
      async expand(r) { return { text: `${r.categoryName} 치료 전·후 사진입니다. 치료 결과는 개인에 따라 다를 수 있습니다.`, image: window.UI.img(r.beforeImage) }; },
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
  const VIEW_LABEL = { card3: '카드 3개씩 보기', card4: '카드 4개씩 보기', card: '카드로 보기', list: '목록형으로 보기' };

  function fade(el) {
    if (!el) return;
    el.classList.remove('is-fade-in');
    void el.offsetWidth;
    el.classList.add('is-fade-in');
    el.addEventListener('animationend', () => el.classList.remove('is-fade-in'), { once: true });
  }

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
    try { const v = localStorage.getItem(viewKey(board)); if (['card3', 'card4', 'list'].includes(v)) view = v; } catch (e) { /* 기본 보기 */ }

    root.innerHTML = `
      <nav class="board-cats" aria-label="${esc(cfg.name)} ${esc(cfg.catLabel)}"><ul class="board-cats__list" data-b-cats></ul></nav>
      <div class="board-tools">
        <p class="board-tools__count" data-b-count aria-live="polite"></p>
        <div class="board-tools__right">
          <select class="board-tools__sort" data-b-sort aria-label="정렬">
            <option value="latest">최신순</option>
            <option value="views">조회순</option>
          </select>
          <div class="board-tools__views" role="group" aria-label="보기 방식">
            ${['card3', 'card4', 'card', 'list'].map((v) => `<button type="button" class="board-tools__view board-tools__view--${v}" data-b-view="${v}" aria-label="${VIEW_LABEL[v]}" title="${VIEW_LABEL[v]}">${ICON[v]}</button>`).join('')}
          </div>
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
      // 예전 주소: 치료사례 ?category=implant (메인 치료사례 카드) → 분류 이름
      if (!cat && board === 'cases' && p.get('category')) cat = rows.find((r) => r.category === p.get('category'))?.categoryName || '';
      if (!cats.includes(cat)) cat = '';
      return { cat, sort: p.get('sort') === 'views' ? 'views' : 'latest', q: (p.get('q') || '').trim(), page: Math.max(1, parseInt(p.get('page'), 10) || 1) };
    };
    const urlOf = ({ cat, sort, q, page }) => {
      const p = new URLSearchParams();
      if (page > 1) p.set('page', page);
      if (cat) p.set('cat', cat);
      if (sort === 'views') p.set('sort', 'views');
      if (q) p.set('q', q);
      const s = p.toString();
      return location.pathname + (s ? `?${s}` : '');
    };
    const perPage = () => (view === 'card4' && !isMobile() ? PER_PAGE_CARD4 : PER_PAGE);

    const tagsOf = (r) => `${cfg.pinned && r.pinned ? '<span class="board-tag">공지</span>' : ''}${r.branch && board !== 'news' ? branchBadge(r.branch) : ''}`;
    const metaOf = (r) => `<time datetime="${esc(r.date)}">${fullDate(r.date)}</time>${hasViews ? `<span class="board-views">조회 ${r.views.toLocaleString('ko-KR')}</span>` : ''}`;
    const href = (r) => `${cfg.view}?id=${encodeURIComponent(r.id)}`;
    const thumbHtml = (r, cls) => `<span class="${cls} img-ph${locked ? ' is-locked' : ''}"><img src="${img(cfg.thumb(r))}" alt="" loading="lazy" decoding="async">${locked ? '<span class="board-lock">로그인 후 확인</span>' : ''}</span>`;

    const cardHtml = (r) => `
      <li class="board-card${r.pinned && cfg.pinned ? ' is-pinned' : ''}" id="${cfg.idPrefix}-${esc(r.id)}">
        <a class="board-card__link" href="${href(r)}">
          <span class="board-card__media">${thumbHtml(r, 'board-card__thumb')}<span class="board-card__hover" aria-hidden="true"><span class="board-card__hover-btn">자세히 보기${ICON.arrow}</span></span></span>
          <span class="board-card__top">${tagsOf(r)}${board === 'notice' ? '' : `<span class="board-card__cat">${esc(cfg.catsOf(r).join('·'))}</span>`}</span>
          <strong class="board-card__title">${esc(r.title)}</strong>
          <span class="board-card__sum">${esc(cfg.summary(r))}</span>
          <span class="board-card__meta">${metaOf(r)}</span>
        </a>
      </li>`;
    const rowHtml = (r) => {
      const pid = `${cfg.idPrefix}-panel-${esc(r.id)}`;
      return `
      <li class="board-row${r.pinned && cfg.pinned ? ' is-pinned' : ''}${cfg.listPlain ? ' is-plain' : ''}" id="${cfg.idPrefix}-${esc(r.id)}">
        <a class="board-row__link" href="${href(r)}">
          ${cfg.listPlain ? '' : thumbHtml(r, 'board-row__thumb')}
          <span class="board-row__text">
            <span class="board-row__top">${tagsOf(r)}${cfg.listPlain ? '' : `<span class="board-row__cat">${esc(cfg.catsOf(r).join('·'))}</span>`}</span>
            <strong class="board-row__title">${esc(r.title)}</strong>
            ${cfg.listPlain ? '' : `<span class="board-row__sum">${esc(cfg.summary(r))}</span>`}
          </span>
          <span class="board-row__meta">${metaOf(r)}</span>
        </a>
        <button class="board-row__toggle" type="button" aria-expanded="false" aria-controls="${pid}" data-b-expand="${esc(r.id)}"><span class="board-row__toggle-text">펼쳐보기</span>${ICON.chevron}</button>
        <div class="board-row__panel" id="${pid}" hidden></div>
      </li>`;
    };

    function filtered({ cat, sort, q }) {
      const words = q.toLowerCase().split(/\s+/).filter(Boolean);
      let out = rows.filter((r) => (!cat || cfg.catsOf(r).includes(cat)) && words.every((w) => cfg.search(r).toLowerCase().includes(w)));
      const byDate = (a, b) => new Date(b.date) - new Date(a.date);
      out = out.slice().sort(sort === 'views' ? (a, b) => (b.views - a.views) || byDate(a, b) : byDate);
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
      catsEl.innerHTML = ['', ...cats].filter((c) => !c || n(c) || c === st.cat).map((c) => `
        <li><a class="board-cats__btn" href="${esc(urlOf({ ...st, cat: c, page: 1 }))}" data-b-cat="${esc(c)}"${c === st.cat ? ' aria-current="true"' : ''}>${c ? esc(c) : '전체'} <span class="board-cats__n">${n(c)}</span></a></li>`).join('');

      countEl.innerHTML = `총 <b>${(pinned.length + rest.length).toLocaleString('ko-KR')}</b>건${st.q ? ` <span class="board-tools__q">‘${esc(st.q)}’ 검색 결과</span> <a class="board-tools__clear" href="${esc(urlOf({ ...st, q: '', page: 1 }))}" data-b-clear>검색 지우기</a>` : ''}`;
      sortEl.value = st.sort;
      if (document.activeElement !== qInput) qInput.value = st.q;

      // 보기 방식 (모바일 = 카드 1열 / 목록형)
      const shownView = view;
      listEl.dataset.view = shownView;
      root.querySelectorAll('[data-b-view]').forEach((b) => {
        const v = b.dataset.bView;
        b.setAttribute('aria-pressed', String(v === 'card' ? view !== 'list' : v === view));
      });

      listEl.innerHTML = shown.length
        ? shown.map(view === 'list' ? rowHtml : cardHtml).join('')
        : `<li class="board-list__empty">${st.q ? `‘${esc(st.q)}’ 검색 결과가 없습니다.` : esc(cfg.empty)}</li>`;
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
      const tg = e.target.closest('[data-b-expand]');
      if (tg) toggleRow(tg);
    });
    sortEl.addEventListener('change', () => push({ ...readState(), sort: sortEl.value, page: 1 }));
    searchEl.addEventListener('submit', (e) => {
      e.preventDefault();
      push({ ...readState(), q: qInput.value.trim(), page: 1 });
      qInput.blur();
    });
    qInput.addEventListener('search', () => { if (!qInput.value && readState().q) push({ ...readState(), q: '', page: 1 }); }); // 입력칸 × 로 지우면 전체로
    window.addEventListener('popstate', () => draw({ animate: true }));
    // 화면 폭이 모바일 경계를 넘으면(카드 4개 16개 ↔ 12개) 다시 그림
    window.matchMedia('(max-width: 768px)').addEventListener('change', () => draw());

    // 목록형 펼쳐보기 — 한 번에 하나만
    async function toggleRow(btn) {
      const li = btn.closest('.board-row');
      const panel = li.querySelector('.board-row__panel');
      const open = btn.getAttribute('aria-expanded') !== 'true';
      listEl.querySelectorAll('.board-row__toggle[aria-expanded="true"]').forEach((b) => { if (b !== btn) setRow(b, false); });
      setRow(btn, open);
      if (!open || panel.dataset.loaded) return;
      panel.dataset.loaded = '1';
      const r = rows.find((x) => x.id === btn.dataset.bExpand);
      panel.innerHTML = '<p class="board-row__loading">불러오는 중입니다.</p>';
      let body = { text: '', image: '' };
      try { body = await cfg.expand(r); } catch (err) { console.error(err); body = { text: r.summary || '', image: '' }; }
      panel.innerHTML = `
        <div class="board-row__panel-in">
          ${body.image ? `<span class="board-row__panel-img img-ph${locked ? ' is-locked' : ''}"><img src="${esc(body.image)}" alt="" loading="lazy" decoding="async">${locked ? '<span class="board-lock">로그인 후 확인</span>' : ''}</span>` : ''}
          <div class="board-row__panel-text">
            <p class="board-row__body">${esc(body.text)}</p>
            <a class="board-row__more" href="${href(r)}">자세히 보기${ICON.arrow}</a>
          </div>
        </div>`;
    }
    function setRow(btn, open) {
      const li = btn.closest('.board-row');
      btn.setAttribute('aria-expanded', String(open));
      btn.querySelector('.board-row__toggle-text').textContent = open ? '접기' : '펼쳐보기';
      li.classList.toggle('is-open', open);
      li.querySelector('.board-row__panel').hidden = !open;
    }

    try {
      rows = await cfg.load();
      hasViews = rows.some((r) => r.views > 0);
      cats = cfg.catOrder ? cfg.catOrder.filter((c) => rows.some((r) => cfg.catsOf(r).includes(c))) : [...new Set(rows.flatMap(cfg.catsOf))];
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
        const locked = cfg.locked();
        const fig = (src, cap) => `<figure class="case-view__fig${locked ? ' is-locked' : ''}"><span class="case-view__img img-ph"><img src="${img(src)}" alt="${esc(post.categoryName)} 치료 ${cap} 사진${locked ? ' (흐림 처리)' : ''}" loading="lazy">${locked ? '<span class="board-lock">로그인 후 확인</span>' : ''}</span><figcaption>${cap}</figcaption></figure>`;
        body = `<div class="case-view">${fig(post.beforeImage, '치료 전')}${fig(post.afterImage, '치료 후')}</div>
          ${locked ? `<p class="notice-box">사례 사진은 <a href="../member/login.html"><strong>로그인</strong></a> 후 확인하실 수 있습니다.</p>` : ''}
          <p class="case-view__note">치료 결과는 개인에 따라 다를 수 있습니다.</p>`;
      }
      const navItem = (p, label, rel) => p
        ? `<a class="article-nav__item" href="${cfg.view}?id=${encodeURIComponent(p.id)}" rel="${rel}"><span class="article-nav__label">${label}</span><span class="article-nav__title">${esc(p.title)}</span><time class="article-nav__date" datetime="${esc(p.date)}">${fullDate(p.date)}</time></a>`
        : `<p class="article-nav__item is-empty"><span class="article-nav__label">${label}</span><span class="article-nav__title">${label === '이전글' ? '이전 글이 없습니다.' : '다음 글이 없습니다.'}</span></p>`;
      box.innerHTML = `
        <article class="article">
          <header class="article__head">
            <p class="article__cats">${tags}${catLinks}</p>
            <h2 class="article__title">${esc(post.title)}</h2>
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
