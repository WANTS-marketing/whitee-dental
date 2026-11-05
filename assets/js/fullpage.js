/* ==========================================================================
   메인 풀스크린 섹션 넘김 — PC(1025px 이상, 화면 높이 700px 이상)에서만 (참고: 경희대병원 메인)
   - 섹션: 히어로(+퀵바) → 진료안내 → 의료진 → 치료사례 → FAQ → 치과소식 → 지점 바로가기 바 + 푸터(마지막, 높이 자동)
   - 마우스 휠·트랙패드 한 번, 키보드(↓↑ · PageDown/PageUp · Space · Home/End) 한 번에 한 섹션, 0.8s ease-in-out
   - 이동 중·이동 후 약 1s 는 입력 무시 + 휠 입력이 200ms 이상 끊긴 뒤의 새 입력만 받음(트랙패드 관성으로 두 칸 넘어가지 않게)
   - 주소 해시(#treatment 등) 반영, 새로고침해도 그 섹션에서 시작
   - 잠금: 첫 진입 히어로 애니메이션 중, 메가메뉴·약력 팝업·코치마크 열림 (의료진 사진 hover 는 잠그지 않음)
   - 섹션 안에서 스크롤되는 영역(FAQ 목록, 긴 의료진 약력 .bio-scroll)은 끝에 닿을 때까지 그 안에서 스크롤
   - 모바일·태블릿·낮은 화면: 아무것도 하지 않음(일반 스크롤 + 등장 애니메이션)
   스타일: main.css '풀스크린 섹션 넘김' (html.is-fullpage 일 때만)
   ========================================================================== */
(function () {
  const SECTIONS = [
    { sel: '.screen-home__first', hash: 'home', label: '홈' },
    { sel: '#screen-clinic', hash: 'treatment', label: '진료안내' },
    { sel: '#screen-doctors', hash: 'doctors', label: '의료진' },
    { sel: '#screen-cases', hash: 'cases', label: '치료사례' },
    { sel: '#screen-faq', hash: 'faq', label: '자주 묻는 질문' },
    { sel: '#screen-story', hash: 'news', label: '치과소식' },
    { sel: '.branch-bar', hash: 'location', label: '지점·오시는길' }, // 푸터 include 가 들어오면 자리 요소가 바뀌므로 지점 바로가기 바 기준
  ];
  const DURATION = 800;
  const LOCK_MS = 1000;
  const GESTURE_GAP = 200;
  const mq = window.matchMedia('(min-width: 1025px) and (min-height: 700px)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;

  let els = [];
  let index = 0;
  let lockedUntil = 0;
  let animating = false;
  let lastWheel = 0;
  let nav = null;
  let active = false;

  const topOf = (i) => {
    const el = els[i];
    const max = root.scrollHeight - window.innerHeight;
    return Math.min(max, Math.round(el.getBoundingClientRect().top + window.scrollY));
  };
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // ease-in-out

  // 다른 화면이 위에 열려 있음: 그 화면이 키·휠을 그대로 쓴다(약력 팝업 안 스크롤 등)
  const overlayOpen = () => document.getElementById('header')?.classList.contains('is-mega') // 메가메뉴
    || root.classList.contains('is-modal-open') // 약력 팝업
    || root.classList.contains('is-coach'); // 이용 안내(코치마크)
  // 넘김만 잠금: 첫 진입 히어로 펼침 중
  // (의료진 사진 위 hover 는 잠그지 않는다 — 사진이 섹션 대부분을 차지해 휠이 먹히지 않았음.
  //  약력이 길어 안에서 스크롤되는 경우(.bio-scroll)만 아래 innerScrollable 이 약력 끝까지 먼저 스크롤)
  const holdOnly = () => document.body.classList.contains('is-intro');
  const blocked = () => overlayOpen() || holdOnly();

  function scrollTo(y, instant) {
    if (instant || reduce.matches) { window.scrollTo({ top: y, behavior: 'instant' }); return Promise.resolve(); }
    const from = window.scrollY;
    const start = performance.now();
    animating = true;
    return new Promise((done) => {
      const step = (now) => {
        const t = Math.min(1, (now - start) / DURATION);
        window.scrollTo({ top: Math.round(from + (y - from) * ease(t)), behavior: 'instant' });
        if (t < 1) requestAnimationFrame(step);
        else { animating = false; done(); }
      };
      requestAnimationFrame(step);
    });
  }

  function setIndex(i) {
    index = i;
    const hash = i === 0 ? '' : `#${SECTIONS[i].hash}`;
    if (location.hash !== hash) history.replaceState(null, '', hash || location.pathname + location.search);
    nav?.querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
  }

  function go(i, { instant = false } = {}) {
    i = Math.max(0, Math.min(els.length - 1, i));
    lockedUntil = performance.now() + (instant || reduce.matches ? 300 : LOCK_MS);
    setIndex(i);
    return scrollTo(topOf(i), instant);
  }

  // 휠이 섹션 안의 스크롤 영역(FAQ 목록 등)에서 일어났고, 그 방향으로 더 스크롤할 수 있으면 그 영역에 맡긴다
  function innerScrollable(target, dy) {
    for (let el = target; el && el !== document.body; el = el.parentElement) {
      const oy = getComputedStyle(el).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
        if (dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
        if (dy < 0 && el.scrollTop > 0) return true;
      }
    }
    return false;
  }

  // 마지막(푸터) 섹션이 화면보다 길면 그 안에서는 보통 스크롤
  function lastSectionNative(dy) {
    if (index !== els.length - 1) return false;
    const top = topOf(els.length - 1);
    const max = root.scrollHeight - window.innerHeight;
    if (dy > 0) return window.scrollY < max - 1;
    return window.scrollY > top + 1;
  }

  function onWheel(e) {
    if (!active || e.ctrlKey) return; // 확대(ctrl+휠)는 그대로
    const now = performance.now();
    const gap = now - lastWheel;
    lastWheel = now;
    const dy = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : 0;
    if (!dy) return;
    if (innerScrollable(e.target, dy) || lastSectionNative(dy)) return;
    e.preventDefault();
    if (blocked() || animating || now < lockedUntil || gap < GESTURE_GAP) return;
    go(index + (dy > 0 ? 1 : -1));
  }

  function onKey(e) {
    if (!active || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    if (t.closest?.('input, textarea, select, [contenteditable="true"]') || overlayOpen()) return;
    const map = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1, ' ': e.shiftKey ? -1 : 1, Home: 'first', End: 'last' };
    if (!(e.key in map)) return;
    if (e.key === ' ' && t.closest?.('button, a')) return; // 버튼·링크 위 Space 는 그 동작
    const d = map[e.key];
    if (typeof d === 'number' && (innerScrollable(t, d) || lastSectionNative(d))) return;
    e.preventDefault();
    if (holdOnly() || animating || performance.now() < lockedUntil) return;
    go(d === 'first' ? 0 : d === 'last' ? els.length - 1 : index + d);
  }

  function onHashLink(e) {
    const a = e.target.closest?.('a[href*="#"]');
    if (!a || !active) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname) return;
    const i = SECTIONS.findIndex((s) => s.hash === url.hash.slice(1));
    if (i < 0) return;
    e.preventDefault();
    go(i);
  }

  /* 섹션 점 7개 — 오른쪽 플로팅 퀵메뉴 묶음 맨 위(점 → 구분선 → 인스타·블로그·상담문의·TOP)에 넣는다
     현재 섹션 점은 포인트 컬러로 길게, 마우스를 올리면 왼쪽에 섹션 이름 툴팁, 누르면 그 섹션으로 (스타일: main.css '풀스크린 섹션 넘김') */
  function buildNav() {
    nav = document.createElement('nav');
    nav.className = 'fp-nav';
    nav.setAttribute('aria-label', '섹션 바로가기');
    nav.innerHTML = SECTIONS.map((s, i) => `<button type="button" data-fp="${i}" aria-label="${s.label}"><span class="fp-nav__label" aria-hidden="true">${s.label}</span></button>`).join('');
    nav.addEventListener('click', (e) => { const b = e.target.closest('[data-fp]'); if (b) go(Number(b.dataset.fp)); });
    const quick = document.querySelector('.quick--float .quick__sns');
    if (quick) quick.prepend(nav);
    else document.body.appendChild(nav);
  }

  // 현재 스크롤 위치에서 가장 가까운 섹션 (창 크기 변경·직접 스크롤 후 맞추기)
  const nearest = () => {
    let best = 0;
    els.forEach((_, i) => { if (Math.abs(topOf(i) - window.scrollY) < Math.abs(topOf(best) - window.scrollY)) best = i; });
    return best;
  };

  function enable() {
    if (active) return;
    els = SECTIONS.map((s) => document.querySelector(s.sel));
    if (els.some((el) => !el)) return;
    active = true;
    root.classList.add('is-fullpage');
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (!nav) buildNav();
    nav.hidden = false;
    const start = SECTIONS.findIndex((s) => `#${s.hash}` === location.hash);
    window.dispatchEvent(new Event('resize')); // 섹션 높이가 100vh 로 바뀌었으니 의료진 사진 높이 등 다시 계산
    requestAnimationFrame(() => go(start > 0 ? start : 0, { instant: true }));
  }
  function disable() {
    if (!active) return;
    active = false;
    root.classList.remove('is-fullpage');
    if (nav) nav.hidden = true;
  }
  const sync = () => (mq.matches ? enable() : disable());

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKey);
  document.addEventListener('click', onHashLink);
  window.addEventListener('resize', () => { if (active) { setIndex(nearest()); window.scrollTo(0, topOf(index)); } });
  window.addEventListener('scroll', () => { if (active && !animating && performance.now() > lockedUntil) setIndex(nearest()); }, { passive: true });
  mq.addEventListener('change', sync);
  // 주소창에서 해시만 바꿨을 때(#doctors 등)도 그 섹션으로
  window.addEventListener('hashchange', () => {
    if (!active) return;
    const i = SECTIONS.findIndex((s) => `#${s.hash}` === location.hash);
    go(i < 0 ? 0 : i);
  });

  // 다른 스크립트(플로팅 TOP 버튼 등)가 쓰는 입구
  window.Fullpage = { go: (i) => (active ? go(i) : null), isActive: () => active };

  // 헤더·푸터(include)가 들어온 뒤 시작 — 마지막 섹션이 푸터라서
  document.addEventListener('components:loaded', sync);
  if (document.querySelector('.branch-bar')) sync();
})();
