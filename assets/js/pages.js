/* ==========================================================================
   서브페이지 동작 — <body data-page="..."> 값에 따라 필요한 것만 실행
   상담문의 폼([data-inquiry-form])은 어느 페이지에 있든 동작
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  const run = {
    doctors: renderDoctorsPage,
    clinic: renderClinic,
    notice: renderNoticeList,
    news: renderNewsList,
    'news-view': renderNewsView,
    cases: renderCasesList,
    faq: renderFaqList,
  }[page];
  run?.();
  document.querySelectorAll('[data-inquiry-form]').forEach((f) => window.UI.inquiryForm(f)); // common.js
  document.querySelectorAll('[data-kakao-login]').forEach((btn) => btn.addEventListener('click', () => window.API.signInWithKakao()));
});

/** 페이지 안에서 내용이 바뀔 때 서서히 나타나기 (common.css .is-fade-in — 서브페이지 열 때와 같은 효과) */
function fadeIn(el) {
  if (!el) return;
  el.classList.remove('is-fade-in');
  void el.offsetWidth; // 다시 붙여도 애니메이션이 처음부터 돌게
  el.classList.add('is-fade-in');
  el.addEventListener('animationend', () => el.classList.remove('is-fade-in'), { once: true });
}

/* ---------- 의료진 소개 ---------- */
function renderDoctorsPage() {
  const box = document.querySelector('[data-doctors-page]');
  if (!box) return;
  const { esc, img, branchBadge } = window.UI;
  box.innerHTML = window.SITE.branches.map((b) => `
    <section class="doctor-group" id="${b.id}" data-branch="${b.id}" aria-labelledby="doctor-group-${b.id}">
      <h2 class="doctor-group__title" id="doctor-group-${b.id}">화이트e치과 <span class="text-${b.id}">${esc(b.name)}</span> 의료진</h2>
      <div class="doctor-profiles">
        ${window.SITE.getDoctorsByBranch(b.id).map((d) => `
          <article class="doctor-profile" id="${b.id}-${window.SITE.doctorSlug(d)}">
            <div class="doctor-profile__photo img-ph"><img src="${img(d.photo)}" alt="${esc(d.name)} ${esc(d.title)} 사진" loading="lazy"></div>
            <div class="doctor-profile__body">
              <p class="doctor-profile__tag">${branchBadge(d.branches.length > 1 ? 'both' : d.branches[0])}<span class="doctor-profile__dept">${esc(d.dept)}</span></p>
              <h3 class="doctor-profile__name">${esc(d.name)} <small>${esc(d.title)}</small></h3>
              ${d.career?.length ? `<ul class="doctor-profile__career">${d.career.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
            </div>
          </article>`).join('')}
      </div>
    </section>`).join('');
  // 메인 '의료진 자세히 보기'(#changwon-lee-eunju 등)로 들어오면 내용을 그린 뒤 해당 원장으로 이동
  if (location.hash) requestAnimationFrame(() => document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ behavior: 'instant', block: 'start' }));
}

/* ---------- 병원소개 (about/clinic.html) = 예전 병원 둘러보기 + 오시는길 ----------
   지점 탭(창원점·마산점): 선택한 지점 패널만 보이고 주소 해시가 #changwon / #masan 으로 바뀐다(직접 링크·뒤로가기 가능)
   패널마다 ① 지점명 ② 내부 둘러보기(갤러리 + 라이트박스) ③ 오시는길(카카오맵 + 주소·전화·이메일·진료시간) ④ 교통·주차 안내
   지도: .loc__map 안의 카카오맵 '지도 퍼가기' 코드는 페이지를 읽는 동안 실행돼야 해서 HTML 에 그대로 둔다(API 키 불필요).
   숨긴 패널은 display:none 이 아니라 화면 밖에 같은 너비로 두므로(sub.css .clinic-panel) 지도가 처음부터 제 크기로 그려지고,
   탭이 열릴 때 relayout(지도 다시 맞추기)도 한 번 더 한다 */
function renderClinic() {
  const panels = [...document.querySelectorAll('.clinic-panel')];
  if (!panels.length) return;
  const { esc, telHref, img } = window.UI;
  const DOT = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="4" fill="currentColor"/></svg>';

  // ③ 지점 정보 · ④ 교통·주차
  window.SITE.branches.forEach((b) => {
    const info = document.querySelector(`[data-loc-info="${b.id}"]`);
    if (info) {
      info.innerHTML = `
        <dl>
          <dt>주소</dt><dd><strong>${esc(b.address)}</strong><strong>(${esc(b.addressNote)})</strong>${b.landmark ? `<span class="loc__sub">${esc(b.landmark)}</span>` : ''}</dd>
          <dt class="loc__dt--mid">전화</dt><dd><a class="loc__tel" href="${telHref(b.tel)}">${esc(b.tel)}</a></dd>
          <dt>이메일</dt><dd>${esc(b.email)}</dd>
          <dt>진료시간</dt><dd><strong>${esc(b.hoursShort)}</strong></dd>
        </dl>`;
    }
    const transit = document.querySelector(`[data-loc-transit="${b.id}"]`);
    if (transit) {
      const rows = [
        { type: '주차', lines: [b.parking || '주차 가능 · 자세한 안내는 전화로 문의해 주세요'] },
        ...b.transit,
      ];
      transit.innerHTML = `
        <ul class="transit__list">
          ${rows.map((t) => `<li class="transit__item"><strong>${esc(t.type)}</strong><div>${t.lines.map((l) => `<p>${esc(l)}</p>`).join('')}</div></li>`).join('')}
        </ul>
        <ul class="amenities clinic-amenities" aria-label="이용안내">${b.amenities.map((a) => `<li>${DOT}${esc(a)}</li>`).join('')}</ul>`;
    }
  });

  // ② 내부 둘러보기: 지점별 갤러리
  const galleries = [...document.querySelectorAll('[data-tour-gallery]')];
  galleries.forEach((g) => {
    const photos = window.SITE.tour[g.dataset.tourGallery] || [];
    g.innerHTML = photos.map((p, i) => `
      <button type="button" class="gallery__item img-ph" data-index="${i}" aria-label="${esc(p.caption)} 크게 보기">
        <img src="${img(p.file)}" alt="${esc(p.caption)}" loading="lazy">
        <span class="gallery__cap">${esc(p.caption)}</span>
      </button>`).join('');
  });

  // 지점 탭 (+ 주소 해시)
  const tabs = [...document.querySelectorAll('.branch-tabs [role="tab"]')];
  const ids = tabs.map((t) => t.dataset.branch);
  function relayoutMaps(panel) {
    // 카카오맵이 숨겨졌다 보일 때 깨지지 않게 다시 맞춘다 — 퍼가기 지도는 창 크기 변화(resize)를 받아 다시 그린다
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
      panel.querySelectorAll('.root_daum_roughmap').forEach((m) => { m.style.width = '99.9%'; requestAnimationFrame(() => { m.style.width = ''; }); });
    });
  }
  function select(branch, { focus = false, push = false } = {}) {
    if (!ids.includes(branch)) branch = ids[0];
    const changed = !panels.find((p) => p.dataset.branch === branch)?.classList.contains('is-active');
    tabs.forEach((t) => {
      const on = t.dataset.branch === branch;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    panels.forEach((p) => {
      const on = p.dataset.branch === branch;
      p.classList.toggle('is-active', on);
      p.inert = !on;
      p.setAttribute('aria-hidden', String(!on));
      if (on) relayoutMaps(p);
      if (on && changed) fadeIn(p); // 지점 탭을 바꿀 때 서서히
    });
    const hash = `#${branch}`;
    if (location.hash !== hash) history[push ? 'pushState' : 'replaceState'](null, '', hash);
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab.dataset.branch, { push: true }));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      select(tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length].dataset.branch, { focus: true, push: true });
    });
  });
  window.addEventListener('popstate', () => select(location.hash.slice(1)));
  window.addEventListener('hashchange', () => select(location.hash.slice(1)));
  select(location.hash.slice(1));

  // 라이트박스 (두 지점 갤러리 공용 — 연 갤러리의 사진만 넘긴다)
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', '사진 크게 보기');
  box.tabIndex = -1; // 열릴 때 포커스는 라이트박스 자체로(테두리 없음) — 키보드는 Tab 으로 닫기·이전·다음
  box.innerHTML = `
    <figure class="lightbox__figure"><img class="lightbox__img" alt=""><figcaption class="lightbox__cap"></figcaption></figure>
    <button type="button" class="lightbox__btn lightbox__close" aria-label="닫기"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 5l14 14M19 5L5 19"/></svg></button>
    <button type="button" class="lightbox__btn lightbox__prev" aria-label="이전 사진"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 5l-7 7 7 7"/></svg></button>
    <button type="button" class="lightbox__btn lightbox__next" aria-label="다음 사진"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></button>`;
  document.body.appendChild(box);
  const lbImg = box.querySelector('.lightbox__img');
  const lbCap = box.querySelector('.lightbox__cap');
  let gallery = null;
  let photos = [];
  let index = 0;
  let opener = null;

  function open(i) {
    index = (i + photos.length) % photos.length;
    const p = photos[index];
    // 갤러리에서 실제로 표시된 주소(temp 대체 포함)를 그대로 사용
    lbImg.src = gallery.querySelector(`[data-index="${index}"] img`)?.currentSrc || img(p.file);
    lbImg.alt = p.caption;
    lbCap.textContent = `${p.caption} (${index + 1} / ${photos.length})`;
    if (!box.classList.contains('is-open')) {
      box.classList.add('is-open');
      document.body.classList.add('is-locked');
      box.focus({ preventScroll: true });
    }
  }
  function close() {
    box.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    opener?.focus();
  }
  galleries.forEach((g) => g.addEventListener('click', (e) => {
    const item = e.target.closest('.gallery__item');
    if (!item) return;
    gallery = g;
    photos = window.SITE.tour[g.dataset.tourGallery] || [];
    opener = item;
    open(Number(item.dataset.index));
  }));
  box.querySelector('.lightbox__close').addEventListener('click', close);
  box.querySelector('.lightbox__prev').addEventListener('click', () => open(index - 1));
  box.querySelector('.lightbox__next').addEventListener('click', () => open(index + 1));
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
  document.addEventListener('keydown', (e) => {
    if (!box.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') open(index - 1);
    if (e.key === 'ArrowRight') open(index + 1);
  });
}

/* 목록을 그린 뒤 주소 해시의 글로 이동 + 잠깐 강조 (내용이 늦게 그려져 브라우저 기본 이동이 안 되므로) */
function scrollToHashItem() {
  const el = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (!el) return;
  requestAnimationFrame(() => {
    el.scrollIntoView({ behavior: 'instant', block: 'center' });
    el.classList.add('is-target');
  });
}

/* ---------- 공지사항 ---------- */
async function renderNoticeList() {
  const list = document.querySelector('[data-notice-list]');
  if (!list) return;
  const { esc, formatDate, branchBadge } = window.UI;
  try {
    const rows = await window.API.getNotices();
    list.innerHTML = rows.length ? rows.map((r, i) => `
      <li class="board__item" id="notice-${esc(r.id)}">
        <span class="board__no">${r.pinned ? '공지' : rows.length - i}</span>
        <span class="board__title">${branchBadge(r.branch)}${esc(r.title)}</span>
        <time class="board__date" datetime="${esc(r.date)}">${formatDate(r.date)}</time>
      </li>`).join('') : '<li class="empty">등록된 공지사항이 없습니다.</li>';
    scrollToHashItem(); // 메인 치과소식 카드(#notice-nt7 등)로 들어오면 그 글로
  } catch (err) {
    console.error(err);
    list.innerHTML = '<li class="empty">목록을 불러오지 못했습니다.</li>';
  }
}

/* ---------- 치과소식 (기존 사이트 치과스토리 글 — assets/data/news.json) ----------
   목록: 최신순 · 페이지당 12개 · 분류 필터. 상태는 주소(?cat=치아교정&page=2)에 남겨 뒤로 가기·새로고침·공유 그대로
   상세: news-view.html?id=story-89 — 이전글(먼저 쓴 글) / 다음글(나중에 쓴 글) */
const NEWS_PER_PAGE = 12;
const NEWS_CATS = ['진료안내', '치료정보', '임플란트·틀니', '치아교정', '병원소식']; // 필터 순서 (build-story.js CATEGORY_RULES 와 같은 이름)
const NEWS_LIST_KEY = 'witee-news-list'; // 상세에서 '목록'을 누르면 보던 분류·페이지로
const fullDate = (iso) => { const d = new Date(iso); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`; };

async function renderNewsList() {
  const list = document.querySelector('[data-news-list]');
  if (!list) return;
  const { esc, img } = window.UI;
  const catsEl = document.querySelector('[data-news-cats]');
  const pagerEl = document.querySelector('[data-news-pager]');
  const countEl = document.querySelector('[data-news-count]');
  let rows = [];

  const readState = () => {
    const q = new URLSearchParams(location.search);
    const cat = NEWS_CATS.includes(q.get('cat')) ? q.get('cat') : '';
    return { cat, page: Math.max(1, parseInt(q.get('page'), 10) || 1) };
  };
  const urlOf = ({ cat, page }) => {
    const q = new URLSearchParams();
    if (cat) q.set('cat', cat);
    if (page > 1) q.set('page', page);
    const s = q.toString();
    return location.pathname + (s ? `?${s}` : '');
  };

  function draw({ focusList = false, animate = false } = {}) {
    const { cat, page: want } = readState();
    const shown = cat ? rows.filter((r) => r.category === cat) : rows;
    const pages = Math.max(1, Math.ceil(shown.length / NEWS_PER_PAGE));
    const page = Math.min(want, pages);
    const slice = shown.slice((page - 1) * NEWS_PER_PAGE, page * NEWS_PER_PAGE);
    try { sessionStorage.setItem(NEWS_LIST_KEY, location.pathname + location.search); } catch (e) { /* 저장 불가 — 목록은 첫 페이지로 */ }

    // 분류 칩 (글 수 함께)
    const count = (c) => (c ? rows.filter((r) => r.category === c).length : rows.length);
    catsEl.innerHTML = ['', ...NEWS_CATS].filter((c) => count(c)).map((c) => `
      <li><a class="news-cats__btn" href="${esc(urlOf({ cat: c, page: 1 }))}" data-cat="${esc(c)}"${c === cat ? ' aria-current="true"' : ''}>${c ? esc(c) : '전체'} <span class="news-cats__n">${count(c)}</span></a></li>`).join('');
    if (countEl) countEl.textContent = `${cat || '전체'} ${shown.length}개 · ${page}/${pages} 페이지`;

    list.innerHTML = slice.length ? slice.map((n) => `
      <li class="news-card" id="news-${esc(n.id)}">
        <a href="news-view.html?id=${encodeURIComponent(n.id)}">
          <span class="news-card__thumb img-ph"><img src="${img(n.thumbnail)}" alt="" loading="lazy" decoding="async"></span>
          <span class="news-card__cat">${esc(n.category)}</span>
          <strong class="news-card__title">${esc(n.title)}</strong>
          <span class="news-card__sum">${esc(n.summary || '')}</span>
          <time class="news-card__date" datetime="${esc(n.date)}">${fullDate(n.date)}</time>
        </a>
      </li>`).join('') : '<li class="empty">등록된 소식이 없습니다.</li>';

    // 페이지 번호: 앞뒤 화살표 + 현재 기준 최대 5개
    if (pages <= 1) { pagerEl.innerHTML = ''; }
    else {
      const from = Math.max(1, Math.min(page - 2, pages - 4));
      const to = Math.min(pages, from + 4);
      const btn = (p, label, cls = '', aria = '') => `<a class="pager__btn ${cls}" href="${esc(urlOf({ cat, page: p }))}" data-page="${p}"${aria}>${label}</a>`;
      const off = (label, cls) => `<span class="pager__btn ${cls} is-disabled" aria-hidden="true">${label}</span>`;
      const ARROW_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
      const ARROW_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
      let h = page > 1 ? btn(page - 1, ARROW_L, 'pager__arrow', ' aria-label="이전 페이지"') : off(ARROW_L, 'pager__arrow');
      for (let p = from; p <= to; p++) h += btn(p, p, p === page ? 'is-current' : '', p === page ? ' aria-current="page"' : ` aria-label="${p}페이지"`);
      h += page < pages ? btn(page + 1, ARROW_R, 'pager__arrow', ' aria-label="다음 페이지"') : off(ARROW_R, 'pager__arrow');
      pagerEl.innerHTML = h;
    }
    if (animate) { fadeIn(list); fadeIn(pagerEl); } // 분류·페이지를 바꿀 때 카드가 서서히
    if (focusList) {
      const top = document.querySelector('.sub-body');
      top?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }

  // 칩·페이지 번호: 주소만 바꾸고 다시 그림 (새 창·가운데 클릭은 브라우저 기본)
  const go = (e) => {
    const a = e.target.closest('a[data-cat], a[data-page]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    history.pushState(null, '', a.getAttribute('href'));
    draw({ focusList: true, animate: true });
  };
  catsEl.addEventListener('click', go);
  pagerEl.addEventListener('click', go);
  window.addEventListener('popstate', () => draw({ animate: true }));

  try {
    rows = await window.API.getNews();
    // 예전 메인 카드 주소(#news-story-89)로 들어오면 상세로
    const hashId = location.hash.startsWith('#news-') && decodeURIComponent(location.hash.slice(6));
    if (hashId && rows.some((r) => r.id === hashId)) { location.replace(`news-view.html?id=${encodeURIComponent(hashId)}`); return; }
    draw();
  } catch (err) {
    console.error(err);
    list.innerHTML = '<li class="empty">목록을 불러오지 못했습니다.</li>';
  }
}

async function renderNewsView() {
  const box = document.querySelector('[data-news-view]');
  if (!box) return;
  const { esc } = window.UI;
  let listUrl = 'news.html';
  try { const saved = sessionStorage.getItem(NEWS_LIST_KEY); if (saved && saved.includes('/news.html')) listUrl = saved; } catch (e) { /* 기본 목록 */ }
  const listBtn = `<div class="article__foot"><a class="btn article__list" href="${esc(listUrl)}">목록으로</a></div>`;
  const id = new URLSearchParams(location.search).get('id');
  try {
    const data = id && await window.API.getNewsPost(id);
    if (!data) {
      box.innerHTML = `<p class="empty">글을 찾을 수 없습니다. 삭제되었거나 주소가 바뀌었을 수 있습니다.</p>${listBtn}`;
      return;
    }
    const { post, html, prev, next } = data;
    document.title = `${post.title} | 치과소식 | 화이트e치과`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', post.summary || post.title);
    const canon = document.createElement('link'); // 글마다 주소가 달라 canonical 은 여기서 (?id= 포함)
    canon.rel = 'canonical';
    canon.href = `${location.origin}${location.pathname}?id=${encodeURIComponent(post.id)}`;
    document.head.appendChild(canon);
    const navItem = (p, label, rel) => p
      ? `<a class="article-nav__item" href="news-view.html?id=${encodeURIComponent(p.id)}" rel="${rel}"><span class="article-nav__label">${label}</span><span class="article-nav__title">${esc(p.title)}</span><time class="article-nav__date" datetime="${esc(p.date)}">${fullDate(p.date)}</time></a>`
      : `<p class="article-nav__item is-empty"><span class="article-nav__label">${label}</span><span class="article-nav__title">${rel === 'prev' ? '이전 글이 없습니다.' : '다음 글이 없습니다.'}</span></p>`;
    box.innerHTML = `
      <article class="article">
        <header class="article__head">
          <a class="article__cat" href="news.html?cat=${encodeURIComponent(post.category)}">${esc(post.category)}</a>
          <h2 class="article__title">${esc(post.title)}</h2>
          <p class="article__meta"><time datetime="${esc(post.date)}">${fullDate(post.date)}</time></p>
        </header>
        <div class="article__body">${html}</div>
      </article>
      <nav class="article-nav" aria-label="이전글 다음글">
        ${navItem(next, '다음글', 'next')}
        ${navItem(prev, '이전글', 'prev')}
      </nav>
      ${listBtn}`;
  } catch (err) {
    console.error(err);
    box.innerHTML = `<p class="empty">글을 불러오지 못했습니다.</p>${listBtn}`;
  }
}

/* ---------- 치료사례 (로그인 여부에 따라 잠금) ---------- */
async function renderCasesList() {
  const list = document.querySelector('[data-cases-list]');
  if (!list) return;
  const { esc, img, formatDate, branchBadge } = window.UI;
  const loggedIn = window.API.isLoggedIn();
  const category = new URLSearchParams(location.search).get('category');
  try {
    let rows = await window.API.getCases();
    if (category) rows = rows.filter((r) => r.category === category);
    list.innerHTML = rows.length ? rows.map((c) => `
      <li class="case-item${loggedIn ? ' is-unlocked' : ''}">
        <div class="case-item__img img-ph"><img src="${img(c.beforeImage)}" alt="${esc(c.categoryName)} 치료 전 사진${loggedIn ? '' : ' (흐림 처리)'}" loading="lazy">
          ${loggedIn ? '' : '<span class="case-item__lock">로그인 후 확인하실 수 있습니다</span>'}
        </div>
        <p class="post-card__title">${branchBadge(c.branch)}${esc(c.title)}</p>
        <p class="post-card__date">${formatDate(c.date)}</p>
      </li>`).join('') : '<li class="empty">등록된 사례가 없습니다.</li>';
  } catch (err) {
    console.error(err);
    list.innerHTML = '<li class="empty">목록을 불러오지 못했습니다.</li>';
  }
  const notice = document.querySelector('[data-cases-login]');
  if (notice) notice.hidden = loggedIn;
}

/* ---------- 자주 묻는 질문 ---------- */
/* FAQ 게시판 — 카테고리(자주 찾는 질문 = featured) + 검색(질문+답변 즉시 필터) + 아코디언
   카테고리 이름은 assets/data/faq.json 의 category 값과 같아야 한다 */
const FAQ_CATS = ['자주 찾는 질문', '전체', '임플란트', '치아교정', '일반치료', '사랑니·스케일링', '심미치료', '진료·예약', '비용'];
async function renderFaqList() {
  const box = document.querySelector('[data-faq-list]');
  if (!box) return;
  const catsEl = document.querySelector('[data-faq-cats]');
  const search = document.querySelector('[data-faq-search]');
  const { esc } = window.UI;
  const chevron = '<svg class="faq-item__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 9l7 7 7-7"/></svg>';
  let rows = [];
  let cat = FAQ_CATS[0];

  const item = (f, i) => `
    <li class="faq-item">
      <button class="accordion__btn faq-item__btn" type="button" id="faq-q${i}" aria-expanded="false" aria-controls="faq-a${i}">
        <span class="faq-item__mark" aria-hidden="true">Q</span>
        <span class="faq-item__cat">${esc(f.category || '')}</span>
        <span class="faq-item__text">${esc(f.question)}</span>
        ${chevron}
      </button>
      <div class="accordion__panel" id="faq-a${i}" role="region" aria-labelledby="faq-q${i}">
        <div class="faq-item__answer">
          <span class="faq-item__mark" aria-hidden="true">A</span>
          <p class="faq-item__a">${esc(f.answer || '답변 준비 중입니다.')}</p>
        </div>
      </div>
    </li>`;

  function draw() {
    const q = search.value.trim().toLowerCase();
    let list = cat === '자주 찾는 질문' ? rows.filter((r) => r.featured) : cat === '전체' ? rows : rows.filter((r) => r.category === cat);
    if (q) list = list.filter((r) => `${r.question} ${r.answer || ''}`.toLowerCase().includes(q));
    box.innerHTML = list.length
      ? list.map(item).join('')
      : `<li class="faq-list__empty">${q ? '검색 결과가 없습니다.' : '등록된 질문이 없습니다.'}</li>`;
  }

  catsEl.innerHTML = FAQ_CATS.map((c) => `<li><button type="button" class="faq-cats__btn" aria-pressed="${c === cat}">${esc(c)}</button></li>`).join('');
  catsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq-cats__btn');
    if (!btn) return;
    cat = btn.textContent;
    catsEl.querySelectorAll('.faq-cats__btn').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    draw();
  });
  search.addEventListener('input', draw);
  document.querySelector('[data-faq-search-form]').addEventListener('submit', (e) => e.preventDefault());
  window.UI.accordion(box); // 목록을 다시 그려도 위임 방식이라 그대로 동작

  try {
    rows = await window.API.getFaqs();
    draw();
  } catch (err) {
    console.error(err);
    box.innerHTML = '<li class="faq-list__empty">질문을 불러오지 못했습니다.</li>';
  }
}

