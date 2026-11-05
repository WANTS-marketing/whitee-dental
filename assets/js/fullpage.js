/* ==========================================================================
   메인 풀스크린 섹션 넘김 — PC(1025px 이상, 화면 높이 700px 이상)에서만 (참고: 경희대병원 메인)
   - 섹션: 히어로(+퀵바) → 진료안내 → 의료진 → 치료사례 → FAQ → 치과소식 → 지점 바로가기 바 + 푸터(마지막, 높이 자동)
   - 마우스 휠·트랙패드 한 번, 키보드(↓↑ · PageDown/PageUp · Space · Home/End) 한 번에 한 섹션, 0.8s ease-in-out
   - 이동 중·이동 후 약 1s 는 입력 무시 + 휠 입력이 200ms 이상 끊긴 뒤의 새 입력만 받음(트랙패드 관성으로 두 칸 넘어가지 않게)
   - 주소 해시(#treatment 등) 반영, 새로고침해도 그 섹션에서 시작
   - 잠금: 첫 진입 히어로 애니메이션 중, 메가메뉴·약력 팝업·코치마크 열림 (의료진 사진 hover 는 잠그지 않음)
   - 투명 헤더: 섹션마다 data-header-theme(dark|light) → html[data-header-theme] (넘김이 시작될 때 다음 섹션 값으로 미리), main.css '투명 헤더'
   - 섹션 안에서 스크롤되는 영역(FAQ 목록, 긴 의료진 약력 .bio-scroll)은 끝에 닿을 때까지 그 안에서 스크롤
   - 히어로(첫 섹션): 휠·↓·PageDown·Space 는 먼저 슬라이드 1→4 (main.js window.HeroSlider), 4번 다음에 진료안내로
     ↑·PageUp 은 이전 슬라이드, 1번에서 위로는 아무 동작 없음. 진료안내에서 위로 오면 히어로 4번으로 도착
     Home·End·섹션 점·메뉴 링크는 슬라이드와 상관없이 바로 그 섹션
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
    || root.classList.contains('is-coach') // 이용 안내(코치마크)
    || root.classList.contains('is-select-open'); // 선택 목록(select) 펼침 — common.js enhanceSelect
  // 넘김만 잠금: 첫 진입 히어로 펼침 중
  // (의료진 사진 위 hover 는 잠그지 않는다 — 사진이 섹션 대부분을 차지해 휠이 먹히지 않았음.
  //  약력이 길어 안에서 스크롤되는 경우(.bio-scroll)만 아래 innerScrollable 이 약력 끝까지 먼저 스크롤)
  // + 글자 입력 칸에 포커스가 있는 동안(FAQ 빠른 질문 등) — 입력 중 휠로 섹션이 넘어가지 않게. 칸 밖을 누르면 풀림
  const typing = () => !!document.activeElement?.matches?.('input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]), textarea, select');
  const holdOnly = () => document.body.classList.contains('is-intro') || typing();
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

  /* 마지막 섹션(지점 바로가기 + 푸터)이 늘 화면 맨 위까지 올라오게: 사진 높이 = 화면 - (지점 링크 + 푸터), 최소 260px (main.css --fp-tail)
     → 투명 헤더 뒤가 늘 사진(+위쪽 어두운 그라데이션)이라 흰 글자로 맞출 수 있다. 짧으면 앞 섹션이 헤더 뒤로 반쯤 걸쳐 글자가 읽히지 않았음 */
  function fitTail() {
    const links = document.querySelector('.branch-bar__links');
    const footer = document.querySelector('.footer');
    if (!active || !links || !footer) return;
    root.style.setProperty('--fp-tail', `${links.offsetHeight + footer.offsetHeight}px`);
  }

  // 투명 헤더 테마: 그 섹션의 data-header-theme. 단 마지막(푸터) 섹션이 페이지 끝에 걸려 섹션 윗부분까지 못 올라가면
  // (사진 높이를 늘려 보통은 생기지 않음) 헤더 뒤에는 앞 섹션이 보이므로 앞 섹션 값
  function themeOf(i) {
    const el = els[i];
    if (!el) return 'light';
    const top = Math.round(el.getBoundingClientRect().top + window.scrollY);
    const header = parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 0;
    if (i > 0 && topOf(i) < top - header / 2) return themeOf(i - 1);
    return el.dataset.headerTheme || 'light';
  }

  function setIndex(i) {
    index = i;
    root.dataset.headerTheme = themeOf(i); // 투명 헤더 글자색 (넘김 시작 시점에 다음 섹션 값)
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

  /* 휠·키 한 번(d = +1 아래 / -1 위): 히어로에서는 슬라이드 먼저, 끝나면 섹션 */
  function move(d) {
    const hero = window.HeroSlider;
    if (hero && index === 0) {
      if (hero.step(d)) { lockedUntil = performance.now() + (reduce.matches ? 300 : LOCK_MS); return; }
      if (d < 0) return; // 1번에서 위로: 아무 동작 없음
    }
    if (hero && d < 0 && index === 1) hero.jump(hero.count - 1); // 진료안내 → 위로 = 히어로 마지막 슬라이드로 도착
    go(index + d);
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
    move(dy > 0 ? 1 : -1);
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
    if (typeof d === 'number') move(d);
    else go(d === 'first' ? 0 : els.length - 1);
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
    nav.innerHTML = SECTIONS.map((s, i) => `<button type="button" data-fp="${i}" aria-label="${s.label}"><span class="fp-nav__label" aria-hidden="true">${s.label}</span>${i === 0 ? '<span class="fp-nav__steps" aria-hidden="true"></span>' : ''}</button>`).join('');
    heroSteps();
    nav.addEventListener('click', (e) => { const b = e.target.closest('[data-fp]'); if (b) go(Number(b.dataset.fp)); });
    const quick = document.querySelector('.quick--float .quick__sns');
    if (quick) quick.prepend(nav);
    else document.body.appendChild(nav);
  }

  // 히어로 점 옆 슬라이드 진행 4칸: 지금 슬라이드까지 채움 (main.css .fp-nav__steps)
  function heroSteps(detail) {
    const box = nav?.querySelector('.fp-nav__steps');
    const hero = window.HeroSlider;
    if (!box || !hero) return;
    const n = detail?.total ?? hero.count;
    const cur = detail?.index ?? hero.index;
    if (box.children.length !== n) box.innerHTML = '<i></i>'.repeat(n);
    [...box.children].forEach((c, k) => c.classList.toggle('is-on', k <= cur));
  }
  document.addEventListener('hero:change', (e) => heroSteps(e.detail));

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
    fitTail();
    nav.hidden = false;
    const start = SECTIONS.findIndex((s) => `#${s.hash}` === location.hash);
    window.dispatchEvent(new Event('resize')); // 섹션 높이가 100vh 로 바뀌었으니 의료진 사진 높이 등 다시 계산
    requestAnimationFrame(() => go(start > 0 ? start : 0, { instant: true }));
  }
  function disable() {
    if (!active) return;
    active = false;
    root.classList.remove('is-fullpage');
    delete root.dataset.headerTheme;
    if (nav) nav.hidden = true;
    root.style.removeProperty('--fp-tail');
  }
  const sync = () => (mq.matches ? enable() : disable());

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKey);
  document.addEventListener('click', onHashLink);
  window.addEventListener('resize', () => { if (active) { fitTail(); setIndex(nearest()); window.scrollTo(0, topOf(index)); } });
  window.addEventListener('scroll', () => { if (active && !animating && performance.now() > lockedUntil) setIndex(nearest()); }, { passive: true });
  mq.addEventListener('change', sync);
  new MutationObserver(() => { if (active) { fitTail(); window.scrollTo(0, topOf(index)); } }).observe(root, { attributes: true, attributeFilter: ['data-fs'] }); // 글자 크기 단계 → 푸터 높이
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
