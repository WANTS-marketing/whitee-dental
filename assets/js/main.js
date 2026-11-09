/* ==========================================================================
   메인 페이지 — 히어로 슬라이더 / 의료진 캐러셀 / 치료사례 잠금 / FAQ / 치과소식 / 스크롤 연출
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initHero();
  initDoctors();
  initCases();
  renderFaqPreview();
  initQuickQuestion();
  initStory();
  initReveal();
  initQuickReveal();
  initHeroLayout();
  initWhyTilt();
});

/* ---------- ② WHY WHITE e — 카드 3D 기울기 (Tilt effect adapted from uiverse.io/00Kubi/cowardly-eagle-56, MIT) ----------
   카드 안 마우스 위치(-0.5~0.5) → CSS 변수 --rx(±6deg) --ry(±8deg), 빛 반사 중심 --mx --my. requestAnimationFrame 으로 한 프레임에 한 번
   마우스(hover 가능한 정밀 포인터)에서만 이벤트 등록 — 터치 기기·모바일 스와이프와 무관. 동작 줄이기 설정이면 기울기 없음(CSS 는 테두리 빛만)
   카드는 common.js 가 그리므로 목록(.why__cards)에 이벤트 위임 */
function initWhyTilt() {
  const grid = document.querySelector('.why__cards');
  if (!grid || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let card = null, last = null, raf = 0;
  const reset = (c) => { c.classList.remove('is-tilting'); ['--rx', '--ry', '--mx', '--my'].forEach((v) => c.style.removeProperty(v)); };
  const frame = () => {
    raf = 0;
    if (!card || !last) return;
    const r = card.getBoundingClientRect();
    const x = Math.min(Math.max((last.clientX - r.left) / r.width, 0), 1) - 0.5; // -0.5 ~ 0.5
    const y = Math.min(Math.max((last.clientY - r.top) / r.height, 0), 1) - 0.5;
    card.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
    card.style.setProperty('--my', `${(y + 0.5) * 100}%`);
    if (reduce.matches) return;
    card.classList.add('is-tilting');
    card.style.setProperty('--rx', `${(-y * 12).toFixed(2)}deg`); // 위쪽에 마우스 → 위가 뒤로 (±6deg)
    card.style.setProperty('--ry', `${(x * 16).toFixed(2)}deg`); //  오른쪽에 마우스 → 오른쪽이 뒤로 (±8deg)
  };
  grid.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const c = e.target.closest('.why-card');
    if (c !== card) { if (card) reset(card); card = c; }
    if (!card) return;
    last = e;
    if (!raf) raf = requestAnimationFrame(frame);
  });
  grid.addEventListener('pointerout', (e) => {
    if (!card || card.contains(e.relatedTarget)) return;
    reset(card); card = null; last = null; // 카드 밖으로 → 0 으로 (CSS transition 400ms)
  });
}

/* ---------- 모바일: 히어로가 보이는 동안 SNS 플로팅 버튼(+) 숨김 ----------
   첫 화면에서 히어로 조작 버튼을 가리지 않게. 히어로를 완전히 지나 스크롤하면 나타난다 (main.css .is-hero-visible)
   JS 가 없으면 클래스가 붙지 않아 항상 보인다 */
function initQuickReveal() {
  const hero = document.querySelector('.hero');
  const quick = document.querySelector('.quick--float');
  if (!hero || !quick || !('IntersectionObserver' in window)) return;
  const mobile = window.matchMedia('(max-width: 768px)');
  let heroVisible = true;
  const apply = () => {
    const hide = mobile.matches && heroVisible;
    quick.classList.toggle('is-hero-visible', hide);
    if (hide && quick.classList.contains('is-open')) quick.querySelector('.quick__toggle')?.click(); // 펼친 채로 숨기지 않게 닫기
  };
  new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; apply(); }).observe(hero);
  mobile.addEventListener('change', apply);
}

/* 첫 화면 배치 (PC·높이 700px 이상, main.css '홈 첫 화면')
   2026-11-09 히어로 안 '빠른 진료 안내' 퀵바 삭제 — 퀵바 관련(--qb-h · .is-ctrl-up · 플로팅 퀵메뉴 --quick-bottom 올리기)은 지움
   --hero-center: 문구 묶음 중심 = '헤더 아래 ~ 재생바 위' 공간의 57.5% 지점, 단 버튼 아래 끝과 그 아래 요소 사이 최소 48px
      (슬라이드마다 문구 길이가 달라도 위치가 흔들리지 않게 가장 긴 슬라이드 기준), 공간이 모자라면 서브 문구 숨김(.is-hero-tight) */
function initHeroLayout() {
  const box = document.querySelector('.screen-home__first');
  const slider = box?.querySelector('.hero__slider');
  if (!slider || !('ResizeObserver' in window)) return;
  const ctrl = slider.querySelector('.hero__controls');
  const contents = [...slider.querySelectorAll('.hero__content')];
  const desk = window.matchMedia('(min-width: 1025px) and (min-height: 700px)');
  const GAP = 50; // 요청 기준 48px + 반올림 여유
  let raf = 0;

  function layout() {
    raf = 0;
    if (!desk.matches) { box.classList.remove('is-hero-tight'); slider.style.removeProperty('--hero-center'); return; }
    const s = slider.getBoundingClientRect();
    const c2 = ctrl.getBoundingClientRect();
    const header = document.getElementById('header')?.offsetHeight || 0;
    const limit = c2.top - s.top; // 문구 아래 끝이 넘으면 안 되는 선 = 재생바 위 (히어로 기준)
    // 공간이 모자라면 서브 문구 숨김(.is-hero-tight, main.css) — 제목 축소(낮은 화면 CSS) 다음 단계
    const tallest = () => Math.max(...contents.map((el) => el.offsetHeight));
    box.classList.remove('is-hero-tight');
    let h = tallest();
    if (limit - header < h + GAP + 16) { box.classList.add('is-hero-tight'); h = tallest(); }
    let center = header + (limit - header) * 0.575;
    center = Math.min(center, limit - GAP - h / 2);
    center = Math.max(center, header + 16 + h / 2); // 공간이 모자라면 헤더에 붙지 않는 쪽을 우선
    slider.style.setProperty('--hero-center', Math.round(center) + 'px');
  }

  const schedule = () => { if (!raf) raf = requestAnimationFrame(layout); };
  const ro = new ResizeObserver(schedule);
  [slider, ...contents].forEach((el) => ro.observe(el));
  window.addEventListener('resize', schedule);
  document.addEventListener('components:loaded', schedule); // 헤더·퀵메뉴가 들어온 뒤 다시
  document.addEventListener('hero:introend', schedule);
  layout();
}

/* ---------- ① 히어로 슬라이더 — 가로 슬라이드 전환 ----------
   다음: 지금 슬라이드가 왼쪽으로 밀려나고 새 슬라이드가 오른쪽에서 들어온다(이전은 반대). 4번 → 1번도 같은 방향(loop)
   이동 0.9s cubic-bezier(0.65, 0, 0.35, 1), 들어오는 사진은 scale 1.06 → 1(1.2s)
   문구: 나가는 슬라이드는 0.3s fade-out, 들어오는 슬라이드는 이미지가 자리 잡은 뒤 라벨 → 타이틀 → 서브 → 버튼 fade-up(0.1s 간격)
   조작: ‹ › · 재생/정지 · 키보드 ←→(히어로에 포커스가 있을 때) · 터치 스와이프(손가락을 따라 움직이다 놓으면 넘김)
   자동재생 6초(4번 → 1번 반복), 마우스가 히어로 위에 있으면 잠시 멈춤, 전환 중 추가 입력 무시. 움직임 줄이기면 짧은 fade 만
   손으로(‹ › · ←→ · 스와이프 · 휠·키보드) 한 번이라도 넘기면 자동재생 정지 — ▶ 로 다시 켠다
   PC 풀스크린 넘김(fullpage.js)은 window.HeroSlider 로 휠·↓↑ 를 슬라이드 넘김에 쓴다 (1→3, 3 다음은 다음 섹션)
   진행 표시: 재생바 '1 / 4' 옆 진행 바(--hero-progress) · 섹션 점의 히어로 4칸(fullpage.js, 'hero:change' 이벤트)
   스타일: main.css '① 히어로' (.is-active / .is-shown / .is-moving / .is-leaving / .is-entering) */
function initHero() {
  const slider = document.getElementById('hero-slider');
  if (!slider) return;
  const slides = [...slider.querySelectorAll('.hero__slide')];
  const current = slider.querySelector('[data-hero-current]');
  const playBtn = slider.querySelector('[data-hero-play]');
  const pauseBtn = slider.querySelector('[data-hero-pause]');
  const progress = slider.querySelector('[data-hero-progress]');
  const DELAY = 6000;
  const MOVE = 900;
  const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let timer = null;
  let hoverPaused = false;
  let busy = false;

  slider.querySelector('[data-hero-total]').textContent = slides.length;
  // 슬라이드별 사진 위치·확대·이름표 (site-data.js heroSlides — CSS 변수로 넘기고 PC 에서만 쓴다)
  const esc = window.UI?.esc || ((s) => String(s));
  slides.forEach((s, k) => {
    const cfg = (window.SITE?.heroSlides || [])[k];
    if (!cfg) return;
    if (cfg.pos) s.style.setProperty('--hero-pos', cfg.pos);
    if (cfg.scale) s.style.setProperty('--hero-scale', cfg.scale);
    if (cfg.origin) s.style.setProperty('--hero-origin', cfg.origin);
    if (cfg.caption && !s.querySelector('.hero__caption')) {
      const c = document.createElement('p');
      c.className = 'hero__caption';
      c.style.setProperty('--cx', `${cfg.caption.x}%`);
      c.style.setProperty('--cy', `${cfg.caption.y}%`);
      c.innerHTML = `<strong class="hero__caption-name">${esc(cfg.caption.name)}</strong><span class="hero__caption-role">${esc(cfg.caption.role)}</span>`;
      s.querySelector('.hero__media').after(c);
    }
  });
  if (!slider.hasAttribute('tabindex')) slider.tabIndex = 0; // 키보드 ←→ 로 넘기려면 히어로에 포커스가 들어와야 한다

  const wrap = (i) => (i + slides.length) % slides.length;
  function mark(i) {
    slides.forEach((s, k) => {
      const on = k === i;
      s.setAttribute('aria-hidden', String(!on));
      s.querySelectorAll('a, button').forEach((el) => (el.tabIndex = on ? 0 : -1));
    });
    current.textContent = i + 1;
    if (progress) progress.style.width = `${((i + 1) / slides.length) * 100}%`;
    slider.classList.toggle('is-last', i === slides.length - 1);
    document.dispatchEvent(new CustomEvent('hero:change', { detail: { index: i, total: slides.length } }));
  }
  const setX = (el, x, animate) => {
    el.classList.toggle('is-moving', !!animate);
    el.style.visibility = 'visible';
    el.style.transform = `translateX(${x})`;
  };
  // 이동 끝: 나간 슬라이드는 숨기고 들어온 슬라이드에 문구 등장
  function settle(from, to) {
    from.classList.remove('is-active', 'is-shown', 'is-moving', 'is-leaving');
    from.style.removeProperty('transform'); from.style.removeProperty('visibility');
    to.classList.remove('is-moving');
    to.style.removeProperty('transform'); to.style.removeProperty('visibility');
    to.classList.add('is-active', 'is-shown');
    busy = false;
  }

  /* to 로 이동. dir: +1 = 다음(오른쪽에서 들어옴), -1 = 이전. dragged: 손가락으로 끌던 위치(px)에서 이어서 */
  function go(to, dir, dragged = null) {
    to = wrap(to);
    if (busy || to === index) return;
    const from = slides[index];
    const next = slides[to];
    index = to;
    mark(to);
    if (reduceMq.matches) { // 움직임 줄이기: 짧은 fade (main.css)
      from.classList.remove('is-active', 'is-shown');
      next.classList.add('is-active', 'is-shown');
      return;
    }
    busy = true;
    if (dragged === null) {
      // 들어올 슬라이드를 화면 밖(오른쪽 또는 왼쪽)에 먼저 놓는다
      next.classList.add('is-entering');
      setX(next, `${dir * 100}%`, false);
      void next.offsetWidth;
    }
    from.classList.remove('is-shown');
    from.classList.add('is-leaving');
    setX(from, `${-dir * 100}%`, true);
    setX(next, '0px', true);
    requestAnimationFrame(() => requestAnimationFrame(() => next.classList.remove('is-entering'))); // 사진 1.06 → 1
    setTimeout(() => settle(from, next), MOVE);
  }

  function play() {
    stop();
    timer = setInterval(() => { if (!hoverPaused) go(index + 1, 1); }, DELAY);
    playBtn.setAttribute('aria-pressed', 'true');
    pauseBtn.setAttribute('aria-pressed', 'false');
  }
  function stop() {
    clearInterval(timer);
    timer = null;
    playBtn.setAttribute('aria-pressed', 'false');
    pauseBtn.setAttribute('aria-pressed', 'true');
  }
  const restart = () => { if (timer) play(); }; // 마우스가 히어로를 떠나면 6초를 처음부터 다시
  const userMoved = () => stop(); // 손으로 넘기면 자동재생 정지 (▶ 로 다시 켬)

  slider.querySelector('[data-hero-prev]').addEventListener('click', () => { if (busy) return; go(index - 1, -1); userMoved(); });
  slider.querySelector('[data-hero-next]').addEventListener('click', () => { if (busy) return; go(index + 1, 1); userMoved(); });
  playBtn.addEventListener('click', play);
  pauseBtn.addEventListener('click', stop); // 첫 진입 중에 누르면 애니메이션이 끝나도 자동재생하지 않는다 (아래 aria-pressed 확인)

  // 키보드 ←→ (히어로 안에 포커스가 있을 때만)
  slider.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    if (busy) return;
    const d = e.key === 'ArrowRight' ? 1 : -1;
    go(index + d, d);
    userMoved();
  });

  // 마우스가 히어로 위에 있는 동안 자동재생 잠시 멈춤(재생/정지 상태는 그대로)
  slider.addEventListener('mouseenter', () => { hoverPaused = true; });
  slider.addEventListener('mouseleave', () => { hoverPaused = false; restart(); });

  // 터치 스와이프: 손가락을 따라 지금·옆 슬라이드가 움직이고, 놓을 때 20% 이상 끌었거나 빠르게 밀었으면 넘김
  let drag = null;
  slider.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || busy || reduceMq.matches) return;
    drag = { x: e.clientX, y: e.clientY, t: performance.now(), dx: 0, dir: 0, id: e.pointerId, moved: false };
  });
  slider.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.moved) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) { drag = null; return; } // 세로로 움직이면 페이지 스크롤에 맡김
      drag.moved = true;
      try { slider.setPointerCapture(e.pointerId); } catch (err) { /* 캡처 불가(합성 이벤트 등) — 그대로 진행 */ }
    }
    const dir = dx < 0 ? 1 : -1; // 왼쪽으로 끌면 다음
    if (dir !== drag.dir) { // 방향이 바뀌면 반대쪽 옆 슬라이드로 교체
      if (drag.dir) { const old = slides[wrap(index + drag.dir)]; old.style.removeProperty('transform'); old.style.removeProperty('visibility'); }
      drag.dir = dir;
    }
    drag.dx = dx;
    const w = slider.clientWidth;
    setX(slides[index], `${dx}px`, false);
    setX(slides[wrap(index + dir)], `${dir * w + dx}px`, false);
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (!d.moved || !d.dir) return;
    const w = slider.clientWidth;
    const fast = Math.abs(d.dx) / (performance.now() - d.t) > 0.5;
    const near = slides[wrap(index + d.dir)];
    if (e.type !== 'pointercancel' && (Math.abs(d.dx) > w * 0.2 || fast)) {
      go(index + d.dir, d.dir, d.dx);
      userMoved();
    } else { // 제자리로
      busy = true;
      setX(slides[index], '0px', true);
      setX(near, `${d.dir * 100}%`, true);
      setTimeout(() => {
        slides[index].classList.remove('is-moving'); slides[index].style.removeProperty('transform'); slides[index].style.removeProperty('visibility');
        near.classList.remove('is-moving'); near.style.removeProperty('transform'); near.style.removeProperty('visibility');
        busy = false;
      }, MOVE);
    }
    // 끌고 난 뒤 손가락을 뗀 자리의 링크(버튼)가 눌리지 않게
    slider.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); }, { capture: true, once: true });
  };
  slider.addEventListener('pointerup', endDrag);
  slider.addEventListener('pointercancel', endDrag);

  slides[0].classList.add('is-active', 'is-shown');
  mark(0);

  /* PC 풀스크린 넘김(fullpage.js)이 쓰는 입구
     step(d): 한 장 넘김(끝에서 돌지 않음). 넘겼거나 전환 중이면 true, 처음·끝이라 넘길 곳이 없으면 false → fullpage.js 가 섹션 이동
     jump(i): 애니메이션 없이 바로 그 슬라이드로 (진료안내에서 위로 넘어올 때 4번으로 도착) */
  window.HeroSlider = {
    count: slides.length,
    get index() { return index; },
    step(d) {
      const to = index + d;
      if (to < 0 || to >= slides.length) return false;
      if (!busy) { go(to, d); userMoved(); }
      return true;
    },
    jump(i) {
      if (busy || i === index) return;
      slides[index].classList.remove('is-active', 'is-shown');
      index = i;
      mark(i);
      slides[i].classList.add('is-active', 'is-shown');
      userMoved();
    },
  };
  // 첫 진입 애니메이션이 끝났음을 알린다 → onboarding.js 가 이 신호 뒤에 이용 안내를 시작
  const introDone = () => {
    window.__heroIntroDone = true;
    document.dispatchEvent(new CustomEvent('hero:introend'));
  };
  // 움직임 줄이기 설정 사용자는 첫 진입 애니메이션·자동재생 없이 바로 표시
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { document.body.classList.remove('is-intro'); stop(); introDone(); return; }
  if (!document.body.classList.contains('is-intro')) { play(); introDone(); return; }
  // 첫 진입 애니메이션(main.css '첫 진입 애니메이션')이 끝난 뒤 자동재생 시작. 그동안 버튼은 재생 상태로 표시
  const INTRO_MS = window.matchMedia('(max-width: 768px)').matches ? 500 : 2600;
  playBtn.setAttribute('aria-pressed', 'true');
  pauseBtn.setAttribute('aria-pressed', 'false');
  setTimeout(() => {
    document.body.classList.remove('is-intro');
    if (playBtn.getAttribute('aria-pressed') === 'true' && !timer) play();
    introDone();
  }, INTRO_MS);
}

/* ---------- ④ 의료진 — 사진 카드 줄 + 약력 팝업 ----------
   카드: 지점 의료진(site-data.js mainDoctorOrder 순서, 없으면 대표원장 먼저)을 가로 스크롤 줄로, 머리말 ‹ › 는 한 장씩 이동 (한 화면 장수는 main.css --doc-per)
   팝업(dialog): 카드 클릭 시 큰 프로필(사진 + 학력·경력·학회 활동). 팝업 안 ‹ › 는 같은 지점 원장 순환
   프로필은 전원을 한 칸에 겹쳐 두고 선택된 원장만 보인다 → 원장을 바꿔도 팝업 크기가 그대로 */
/* 의료진 섹션 배경 사진: assets/images/doctors-bg.jpg 가 실제로 있을 때만 .has-bg (main.css — 사진 + 옅은 흰 막). 없으면 #f7f5f2 단색 */
function initDoctorsBg() {
  const sec = document.querySelector('.doctors');
  if (!sec) return;
  const im = new Image();
  im.onload = () => sec.classList.add('has-bg');
  im.src = './assets/images/doctors-bg.jpg';
}

function initDoctors() {
  initDoctorsBg();
  const box = document.querySelector('[data-doc-profiles]');
  const cardsEl = document.querySelector('[data-doc-cards]');
  const modal = document.querySelector('[data-doc-modal]');
  if (!box || !cardsEl || !modal || !window.SITE) return;
  const panel = document.getElementById('doctors-panel');
  const tabs = [...document.querySelectorAll('.doctors__tab')];
  const { esc, img } = window.UI;
  const docs = window.SITE.doctors;
  const BRANCH_NAME = { changwon: '창원점', masan: '마산점' };
  /* 약력 분류·학회 항목 나누기 — site-data.js SITE.classifyCareer · SITE.splitSociety (의료진 소개와 공통) */
  const classify = window.SITE.classifyCareer;
  const splitSociety = window.SITE.splitSociety;
  const GROUP_TITLE = { edu: '학력', career: '경력', society: '학회 활동' };
  /* 인물 hover 약력 패널: 보건복지부 인증 전문의 항목(굵게) + 나머지 약력(데이터 순서) — 6줄까지만 보이고 넘치면 '전체 약력 보기' */
  const certsOf = (d) => (d.career || []).filter((c) => c.startsWith('보건복지부 인증'));
  const restOf = (d) => (d.career || []).filter((c) => !c.startsWith('보건복지부 인증'));
  /* 배경을 지운 상반신 사진: assets/images/doctor-{영문 이름}-cut.png (예: doctor-lee-eunju-cut.png)
     없으면 이미지가 숨겨지고 인물 실루엣 플레이스홀더가 보인다 (common.js 이미지 대체, 임시 인물 사진은 쓰지 않음) */
  const cutOf = (d) => img(String(d.photo || '').replace(/\.[a-z]+$/i, '-cut.png'));
  const SILHOUETTE = '<svg class="doc-person__ph" viewBox="0 0 200 260" aria-hidden="true"><circle cx="100" cy="78" r="44"/><path d="M14 260c0-62 38-100 86-100s86 38 86 100z"/></svg>';

  // 팝업 안 큰 프로필 (원장마다 1개, 선택한 1개만 보임)
  box.innerHTML = docs.map((d, i) => {
    const career = d.career || [];
    const by = { cert: [], edu: [], career: [], society: [] };
    career.forEach((c) => { const k = classify(c); by[k].push(...(k === 'society' ? splitSociety(c) : [c])); });
    const li = (c) => `<li>${esc(c)}</li>`;
    const group = (key) => (by[key].length ? `
            <section class="doc-group"><h4 class="doc-group__title">${GROUP_TITLE[key]}</h4><ul class="doc-group__list">${by[key].map(li).join('')}</ul></section>` : '');
    const certs = by.cert.length ? `<ul class="doc-profile__certs">${by.cert.map(li).join('')}</ul>` : '';
    // 1열: 학력 → 경력 → 학회 활동 차례로
    const cols = `<div class="doc-profile__cols">${group('edu')}${group('career')}${group('society')}</div>`;
    return `
      <article class="doc-profile" data-doc="${i}" aria-hidden="true" inert>
        <div class="doc-profile__body">
          <header class="doc-profile__head"><!-- 스크롤해도 위에 고정 -->
            <p class="doc-profile__meta"><span data-doc-branch>${BRANCH_NAME[d.branches[0]]}</span> · <b class="doc-profile__dept">${esc(d.dept)}</b></p>
            <h3 class="doc-profile__name">${esc(d.name)} <small>${esc(d.title)}</small></h3>
          </header>
          ${certs}${cols}
        </div>
      </article>`;
  }).join('');
  const profiles = [...box.children];

  let branch = 'changwon';
  let list = []; // 현재 지점 의료진의 docs 인덱스 (대표원장 먼저)
  let pos = 0;   // 팝업에서 보고 있는 원장 (list 안 순번)
  let opener = null; // 팝업을 연 카드 (닫히면 포커스 복귀)

  /* ---------- 인물 나열 ----------
     PC: 지점 의료진 전원 한 줄(칸 수 = 인원수, --doc-per). 사진은 아래 끝 기준 정렬(머리·어깨선 높이 맞춤)
     약력 패널: PC 는 사진에 마우스를 올리거나 키보드 포커스가 들어오면 아래에서 올라온다(CSS),
     터치 기기는 사진을 탭할 때마다 열고 닫는다(.is-open). 사진(PC)·'약력 보기'·'전체 약력 보기' = 약력 팝업 */
  const touch = window.matchMedia('(hover: none)');
  function render(branchId) {
    branch = branchId;
    panel.dataset.branch = branchId; // 진료과·약력 보기 버튼 색 = 지점 색 (common.css --doc-color)
    modal.dataset.branch = branchId;
    const ds = window.SITE.getDoctorsByBranch(branchId);
    const head = ds.findIndex((d) => d.title === '대표원장');
    if (head > 0) ds.unshift(...ds.splice(head, 1));
    // 지점별 나열 순서 지정(site-data.js mainDoctorOrder) — 목록에 없는 원장은 뒤에 데이터 순서대로
    const order = (window.SITE.mainDoctorOrder || {})[branchId];
    if (order) { const rank = (d) => { const i = order.indexOf(d.name); return i < 0 ? order.length : i; }; ds.sort((a, b) => rank(a) - rank(b)); }
    list = ds.map((d) => docs.indexOf(d));
    panel.style.setProperty('--doc-count', ds.length);
    const mid = (ds.length - 1) / 2;
    cardsEl.innerHTML = ds.map((d, p) => {
      const certs = certsOf(d);
      const rest = restOf(d);
      const bioId = `doc-bio-${branchId}-${p}`;
      const z = 10 + Math.round((mid - Math.abs(p - mid)) * 2); // 사진이 겹칠 때 가운데 원장이 위
      const fix = `--ps:${Number(d.photoScale) || 1};--py:${Number(d.photoOffsetY) || 0};--px:${Number(d.photoOffsetX) || 0}`; // site-data.js 사진 보정
      return `
      <li class="doc-person" data-pos="${p}" style="--z:${z}">
        <div class="doc-person__stage" data-doc-stage>
          ${SILHOUETTE}
          ${d.photoBacker && d.photoBlend !== false ? `<span class="doc-person__backer" aria-hidden="true" style="${fix}"></span>` : ''}
          <img class="doc-person__img${d.photoBlend === false ? '' : ' is-blend'}" src="${cutOf(d)}" alt="${esc(d.name)} ${esc(d.title)}" loading="lazy" style="${fix}">
        </div>
        <div class="doc-person__bio" id="${bioId}" data-doc-stage>
          <div class="doc-person__bio-in">
            ${certs.length ? `<ul class="doc-person__certs">${certs.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
            <ul class="doc-person__career">${rest.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
          </div>
        </div>
        <div class="doc-person__info">
          <div class="doc-person__who">
            <p class="doc-person__dept">${esc(d.dept)}</p>
            <p class="doc-person__name"><b>${esc(d.name)}</b> <small>${esc(d.title)}</small></p>
          </div>
          <button type="button" class="doc-person__more" data-pos="${p}" aria-haspopup="dialog" aria-describedby="${bioId}">약력 보기 <span aria-hidden="true">+</span></button>
        </div>
      </li>`;
    }).join('');
    cardsEl.scrollLeft = 0;
    refit();
  }
  /* 약력은 잘리지 않고 전부 보인다. 글자 크기: 기본 1rem(16px), 가장 긴 항목이 한 줄에 들어가게 줄임(최소 14px)
     — 그래도 넘치는 긴 항목만 다음 줄로(들여쓰기). 사진 칸에 다 들어가지 않으면 단계적으로:
     ① .bio-wide  표시 영역을 인물 칸 전체(사진 + 이름 영역)로 넓힘 (이름 영역은 약력이 보이는 동안 숨김)
     ② .bio-compact 글자 13px · 줄 간격 1.5
     ③ .bio-scroll  약력 영역 안에서 세로 스크롤(얇은 스크롤바) */
  function fitBio(li) {
    const bio = li.querySelector('.doc-person__bio');
    const inner = bio.firstElementChild;
    li.classList.remove('bio-wide', 'bio-compact', 'bio-scroll');
    const stageEl = li.querySelector('.doc-person__stage');
    li.style.setProperty('--stage-h', stageEl.offsetHeight + 'px');
    li.style.setProperty('--stage-w', stageEl.offsetWidth + 'px'); // 약력 보기 때 흐린 사진을 칸 폭으로 자르는 데 (main.css)
    bio.style.removeProperty('--bio-fs');
    const base = parseFloat(getComputedStyle(bio).fontSize);
    const items = [...bio.querySelectorAll('li')];
    if (!items.length) return;
    bio.classList.add('is-measuring'); // 줄바꿈 없이 필요한 폭 (불릿 여백 포함)
    const need = Math.max(...items.map((el) => el.scrollWidth));
    const room = items[0].clientWidth;
    bio.classList.remove('is-measuring');
    if (need > room) bio.style.setProperty('--bio-fs', Math.max(14, Math.floor(base * room / need * 10) / 10) + 'px');
    const fits = () => { const cs = getComputedStyle(bio); return inner.offsetHeight <= bio.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) + 0.5; };
    if (fits()) return;
    li.classList.add('bio-wide');
    if (fits()) return;
    li.classList.add('bio-compact');
    if (fits()) return;
    li.classList.add('bio-scroll');
  }
  function fitBios() { cardsEl.querySelectorAll('.doc-person').forEach(fitBio); }
  cardsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.doc-person__more');
    if (btn) { openModal(Number(btn.dataset.pos), btn); return; }
    const stage = e.target.closest('[data-doc-stage]');
    if (!stage) return;
    const li = stage.closest('.doc-person');
    if (touch.matches) { // 터치: 탭할 때마다 약력 패널 토글 (한 번에 한 명)
      const open = !li.classList.contains('is-open');
      cardsEl.querySelectorAll('.doc-person.is-open').forEach((o) => o.classList.remove('is-open'));
      li.classList.toggle('is-open', open);
    } else {
      openModal(Number(li.dataset.pos), li.querySelector('.doc-person__more'));
    }
  });
  /* 사진 높이 = 섹션 높이(화면 - 헤더)의 약 60%, 섹션이 한 화면을 넘으면 넘친 만큼 줄인다 (화면 단위 구성: 1025px 이상·높이 700px 이상) */
  const section = panel.closest('.doctors');
  const screenMode = window.matchMedia('(min-width: 1025px) and (min-height: 700px)');
  function fitHeight() {
    panel.style.removeProperty('--doc-photo-h');
    if (!screenMode.matches || !section) return;
    const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
    const room = window.innerHeight - headerH;
    const stage = cardsEl.querySelector('.doc-person__stage');
    if (!stage) return;
    let h = Math.round(room * 0.7);
    panel.style.setProperty('--doc-photo-h', h + 'px');
    if (document.documentElement.classList.contains('is-fullpage')) {
      /* 풀스크린 넘김(섹션 = 정확히 한 화면): 사진 칸 = 섹션 높이의 약 70%, 단 한 화면 안에 들어가는 것이 우선
         (섹션 안쪽 공간에서 머리말·이름 줄을 뺀 남는 높이까지). 사진이 칸보다 넓으면 옆으로 겹친다(main.css). 최소 200px
         이름 줄이 사진 칸 높이에 비례해 겹쳐 올라가므로(margin-top) 두 번 맞춘다 */
      const cs = getComputedStyle(section);
      const avail = section.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const target = Math.round(section.clientHeight * 0.7);
      for (let k = 0; k < 2; k++) {
        const rest = section.querySelector('.doctors__inner').offsetHeight - stage.offsetHeight; // 사진 칸을 뺀 나머지 높이
        h = Math.max(200, Math.min(target, Math.floor(avail - rest) - 1)); // -1: 반올림으로 1px 넘치지 않게
        panel.style.setProperty('--doc-photo-h', h + 'px');
      }
      return;
    }
    const over = section.offsetHeight - room;
    if (over > 0) panel.style.setProperty('--doc-photo-h', Math.max(200, h - over - 1) + 'px');
  }
  let fitRaf = 0;
  const refit = () => { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(() => { fitHeight(); fitBios(); }); };
  window.addEventListener('resize', refit);
  new MutationObserver(refit).observe(document.documentElement, { attributes: true, attributeFilter: ['data-fs'] }); // 글자 크기 단계
  document.fonts?.ready.then(refit);

  /* ---------- 약력 팝업 (dialog: 포커스 가두기·ESC 닫기는 브라우저 기본 동작) ---------- */
  function show(p) {
    pos = p; // 선택한 원장 한 명만 (다른 원장으로 넘기기 없음)
    const di = list[pos];
    profiles.forEach((el, i) => {
      const on = i === di;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-hidden', String(!on));
      el.inert = !on;
    });
    // 겸직 원장의 지점 표기는 지금 보고 있는 지점
    profiles[di].querySelector('[data-doc-branch]').textContent = BRANCH_NAME[branch];
    box.scrollTop = 0;
  }
  function openModal(p, from) {
    opener = from;
    show(p);
    modal.classList.remove('is-closing');
    modal.showModal(); // 나타날 때: 딤·팝업이 서서히 (main.css .doc-modal 애니메이션)
    document.documentElement.classList.add('is-modal-open'); // 뒤 화면 스크롤 잠금
    // 포커스는 팝업 본문으로(테두리 없음) — 마우스로 열 때 닫기(×)에 포커스 테두리가 보이지 않게, 키보드는 Tab 한 번에 닫기 버튼
    modal.querySelector('.doc-modal__panel').focus({ preventScroll: true });
  }
  /* 닫을 때도 서서히: .is-closing 애니메이션이 끝난 뒤 dialog 닫기 (움직임 줄이기 설정이면 바로) */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function closeModal() {
    if (!modal.open || modal.classList.contains('is-closing')) return;
    if (reduceMotion.matches) { modal.close(); return; }
    modal.classList.add('is-closing');
    const done = () => { clearTimeout(timer); modal.removeEventListener('animationend', onEnd); modal.classList.remove('is-closing'); modal.close(); };
    const onEnd = (e) => { if (e.target === modal.querySelector('.doc-modal__panel')) done(); };
    const timer = setTimeout(done, 400); // animationend 가 오지 않을 때 대비
    modal.addEventListener('animationend', onEnd);
  }
  modal.addEventListener('cancel', (e) => { e.preventDefault(); closeModal(); }); // ESC
  modal.querySelector('[data-modal-close]').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); }); // 배경(딤) 클릭
  // 포커스 가두기: Tab·Shift+Tab 이 팝업 밖(브라우저 주소창 등)으로 나가지 않고 팝업 안 버튼·링크만 돈다
  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const items = [...modal.querySelectorAll('button, a[href]')].filter((el) => el.offsetParent && !el.closest('[inert]'));
    if (!items.length) return;
    const i = items.indexOf(document.activeElement);
    e.preventDefault();
    items[i < 0 ? (e.shiftKey ? items.length - 1 : 0) : (i + (e.shiftKey ? -1 : 1) + items.length) % items.length].focus();
  });
  modal.addEventListener('close', () => {
    document.documentElement.classList.remove('is-modal-open');
    // 연 원장의 '약력 보기' 버튼으로 포커스
    const btn = cardsEl.querySelector(`.doc-person__more[data-pos="${pos}"]`) || opener;
    if (!btn) return;
    btn.focus({ preventScroll: true });
    btn.closest('.doc-person')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  });

  /* ---------- 지점 탭 ----------
     전환: 지금 의료진 줄이 0.2s 사라짐 → 새 지점 의료진으로 바꿔 0.5s 서서히 나타남 (main.css '지점 전환')
     줄 전체를 한 덩어리로 흐리게 한다 — 사진이 서로 겹치고 multiply 로 섞여서, 인물마다 따로 흐리면 겹친 곳에 흰 사각형이 비친다
     빠르게 연달아 누르면 마지막으로 누른 지점만 그린다, 동작 줄이기 설정이면 바로 바꾼다 */
  let switchId = 0;
  let target = null; // 지금 보여 주는(또는 바꾸는 중인) 지점
  function switchTo(branchId, animate) {
    target = branchId;
    const id = ++switchId;
    if (!animate || reduceMotion.matches) { cardsEl.classList.remove('is-leaving', 'is-entering'); render(branchId); return; }
    cardsEl.classList.remove('is-entering');
    cardsEl.classList.add('is-leaving');
    setTimeout(() => {
      if (id !== switchId) return;
      render(branchId);
      cardsEl.classList.remove('is-leaving');
      void cardsEl.offsetWidth; // 애니메이션 다시 시작
      cardsEl.classList.add('is-entering');
    }, 200);
  }
  // 나타남 애니메이션은 사진·이름마다(main.css) — 끝나면(0.5s) 클래스 정리
  let enterTimer = 0;
  new MutationObserver(() => {
    if (!cardsEl.classList.contains('is-entering')) return;
    clearTimeout(enterTimer);
    enterTimer = setTimeout(() => cardsEl.classList.remove('is-entering'), 600);
  }).observe(cardsEl, { attributes: true, attributeFilter: ['class'] });
  function selectTab(tab, animate = true) {
    if (target === tab.dataset.branch) return; // 이미 보고 있는(바꾸는 중인) 지점
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tab.id);
    switchTo(tab.dataset.branch, animate);
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (e) => {
      // 좌우(위아래) 방향키 = 이전·다음 탭, Home·End = 처음·마지막 탭
      if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const next = e.key === 'Home' ? tabs[0] : e.key === 'End' ? tabs[tabs.length - 1]
        : tabs[(i + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      next.focus();
      selectTab(next);
    });
  });

  selectTab(tabs[0], false);
}

/* ---------- ⑥ 치료사례 (최신 3건) ----------
   카드: 위 BEFORE(선명) / 아래 AFTER(로그인 전 = 미리 흐리게 만든 미리보기 + 자물쇠 '로그인 후 확인', 로그인 후 = 원본) + 분류·제목 → 상세
   AFTER 원본 주소는 로그인일 때만 데이터에 들어온다(api.js getCases) */
async function initCases() {
  const list = document.querySelector('[data-cases]');
  if (!list || !window.API) return;
  const { esc, img } = window.UI;
  const lock = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';
  const arrow = '<svg class="case-card__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 9v9H9"/></svg>';
  try {
    const rows = await window.API.getCases({ limit: 3 });
    const loggedIn = window.API.isLoggedIn();
    list.innerHTML = rows.map((r) => {
      const open = !!r.afterImage;
      const label = loggedIn ? '<span class="nowrap">시안: 실제 운영 시</span> <span class="nowrap">원본 공개</span>' : '로그인 후 확인'; // 로그인했는데 원본 주소가 없으면(시안) 안내
      return `
        <li><a class="case-card${open ? ' is-unlocked' : ''}" href="./community/case-view.html?id=${encodeURIComponent(r.id)}">
          <span class="case-card__half img-ph"><img src="${img(r.beforeImage)}" alt="${esc(r.title)} 치료 전 사진" loading="lazy" decoding="async"><span class="case-card__tag">BEFORE</span></span>
          <span class="case-card__half img-ph${open ? '' : ' is-locked'}"><img src="${img(open ? r.afterImage : r.afterBlur)}" alt="${open ? `${esc(r.title)} 치료 후 사진` : ''}" loading="lazy" decoding="async"><span class="case-card__tag">AFTER</span>${open ? '' : `<span class="case-card__lock${loggedIn ? ' is-demo' : ''}">${lock}${label}</span>`}</span>
          <span class="case-card__info"><span class="case-card__cat">${esc(r.categoryName)}</span><strong class="case-card__title">${esc(r.title)}</strong>${arrow}</span>
        </a></li>`;
    }).join('');
    list.querySelectorAll('img').forEach((im) => im.addEventListener('error', () => im.classList.add('is-missing'), { once: true }));
  } catch (err) {
    console.error(err);
    list.innerHTML = '';
  }
}

/* ---------- ⑦ FAQ 빠른 질문 박스 ----------
   전송·검증은 common.js UI.inquiryForm (상담문의와 같은 Web3Forms·허니팟·하이픈 자동). 질문 글자 수 표시, 성공하면 박스 안 '접수되었습니다'로 바꿈 */
function initQuickQuestion() {
  const box = document.querySelector('.faq-quick');
  const form = box?.querySelector('form');
  if (!form || !window.UI?.inquiryForm) return;
  const done = box.querySelector('.faq-quick__done');
  const count = form.querySelector('[data-fq-count]');
  const msg = form.elements.message;
  const sync = () => { count.textContent = msg.value.length; };
  msg.addEventListener('input', sync);
  form.addEventListener('input', sync);
  window.UI.inquiryForm(form, {
    demoNote: false, // 버튼 아래 시안 안내 문구 없음
    onSuccess: () => {
      // 키가 없으면(시안) 완료 화면 문구를 시안 안내로 — 키가 등록되면 HTML 원래 문구('접수되었습니다')
      if (!window.UI.deliveryReady()) {
        done.querySelector('.faq-quick__done-title').textContent = '시안 화면입니다';
        done.querySelector('.faq-quick__done-desc').innerHTML = window.UI.demoHtml().replace(/^시안 화면입니다\. /, '');
      }
      form.hidden = true; done.hidden = false; done.focus({ preventScroll: true });
    },
  });
  box.querySelector('[data-fq-again]').addEventListener('click', () => { done.hidden = true; form.hidden = false; form.elements.branch[0].focus({ preventScroll: true }); });
}

/* ---------- ⑥ FAQ 미리보기 (자주 묻는 질문 4개 + 온라인 상담 문의 한 섹션) ---------- */
async function renderFaqPreview() {
  const box = document.querySelector('[data-faq-preview]');
  if (!box) return;
  try {
    const faqs = (await window.API.getFaqs({ featured: true })).slice(0, 4); // 메인은 4개 + '질문 전체보기'
    box.innerHTML = faqs.map((f, i) => window.UI.faqItem(f, i, 'faq-pre')).join('');
    window.UI.accordion(box);
  } catch (err) {
    console.error(err);
    box.innerHTML = '<li class="empty">질문을 불러오지 못했습니다.</li>';
  }
}

/* ---------- ⑧ 치과소식(STORY) — 카테고리 탭 + 카드 캐러셀 ----------
   탭: 공지사항(처음) / 치과소식 — 각 최신 6개, 누르면 카드가 바뀐다(0.2s 사라짐 → 0.5s 나타남)
   캐러셀: 가로 스크롤 칸(.story__viewport) + 카드 단위 스냅. 이동 방법:
     ‹ › 버튼(한 장씩, 끝에서 멈춤) · 좌우 방향키(칸에 포커스) · 마우스 드래그 · 트랙패드 가로 스와이프·터치(브라우저 기본 가로 스크롤)
   세로 휠은 그대로 섹션 넘김(fullpage.js 는 가로 성분이 큰 휠을 건드리지 않는다)
   진행 바: 전체 길이 중 지금 보이는 구간의 위치·비율 (main.css '⑧ 치과소식') */
const STORY_LIMIT = 6;
const NOTICE_LIMIT = 4; // 공지사항 목록 (모바일은 main.css 에서 3개만)
async function initStory() {
  const list = document.querySelector('[data-news-latest]');
  const track = document.querySelector('[data-story-track]');
  if (!list || !track) return;
  const { esc, img, formatDate } = window.UI;
  const noticeEl = document.querySelector('[data-notice-latest]');
  const prev = document.querySelector('[data-story-prev]');
  const next = document.querySelector('[data-story-next]');
  const bar = document.querySelector('[data-story-bar]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const BOARD = {
    notice: { name: '공지사항', page: './community/notice.html', anchor: 'notice' },
    news: { name: '치과소식', page: './community/news.html', anchor: 'news' },
  };
  const byDate = (a, b) => new Date(b.date) - new Date(a.date);

  let data = null;
  try {
    const [notices, news] = await Promise.all([window.API.getNotices(), window.API.getNews()]);
    const tag = (rows, board) => rows.map((r) => ({ ...r, board }));
    data = {
      notice: tag(notices, 'notice').sort(byDate).slice(0, NOTICE_LIMIT), // 메인은 고정 공지와 상관없이 최신순
      news: tag(news, 'news').sort(byDate).slice(0, STORY_LIMIT),
    };
  } catch (err) {
    console.error(err);
    list.innerHTML = '<li class="empty">소식을 불러오지 못했습니다.</li>';
    if (noticeEl) noticeEl.innerHTML = '<li class="empty">공지사항을 불러오지 못했습니다.</li>';
    return;
  }

  const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg>';
  const card = (r) => {
    const b = BOARD[r.board];
    const title = String(r.title).replace(/\s*\n\s*/g, ' ');
    return `
      <li class="story-card">
        <a href="${`./community/${r.board === 'news' ? 'news-view' : 'notice-view'}.html?id=${encodeURIComponent(r.id)}`}" draggable="false">
          <span class="story-card__thumb img-ph"><img src="${img(r.thumbnail || 'news-dummy-01.jpg')}" alt="" loading="lazy" draggable="false"><span class="story-card__hover">${ARROW}</span></span>
          <strong class="story-card__title">${esc(title)}</strong>
          <span class="story-card__sum">${esc(r.summary || '')}</span>
          <span class="story-card__meta"><time datetime="${esc(r.date)}">${formatDate(r.date)}</time></span>
        </a>
      </li>`;
  };

  /* ---------- 진행 바·버튼 상태 ---------- */
  const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
  function update() {
    const sw = track.scrollWidth || 1;
    const max = maxScroll();
    // 채움 폭 = 보이는 폭 / 전체 폭, 위치 = 스크롤 위치 / 전체 폭 (translateX % 는 채움 자기 폭 기준이라 / 보이는 폭)
    bar.style.width = `${Math.min(100, (track.clientWidth / sw) * 100)}%`;
    bar.style.transform = `translateX(${max ? (track.scrollLeft / track.clientWidth) * 100 : 0}%)`;
    prev.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft >= max - 1;
  }
  // 한 장 = 카드 폭 + 간격
  const step = () => {
    const items = list.children;
    if (items.length < 2) return track.clientWidth;
    return items[1].getBoundingClientRect().left - items[0].getBoundingClientRect().left;
  };
  // 지금 맨 왼쪽 카드 번호 (반올림) 기준으로 한 장씩
  function go(dir) {
    const s = step();
    const i = Math.round(track.scrollLeft / s) + dir;
    track.scrollTo({ left: Math.max(0, Math.min(maxScroll(), i * s)), behavior: reduce.matches ? 'auto' : 'smooth' });
  }
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  track.addEventListener('scroll', update, { passive: true });
  new ResizeObserver(update).observe(track);
  track.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    go(e.key === 'ArrowRight' ? 1 : -1);
  });

  /* ---------- 마우스 드래그 (터치·펜은 브라우저 기본 스와이프) ----------
     5px 넘게 움직이면 드래그 — 끝난 뒤의 클릭(카드 이동)은 막고, 가장 가까운 카드에 맞춘다 */
  let drag = null;
  let dragged = false;
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, left: track.scrollLeft, id: e.pointerId };
    dragged = false;
  });
  track.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    if (!dragged && Math.abs(dx) < 5) return;
    if (!dragged) { dragged = true; track.setPointerCapture(drag.id); track.classList.add('is-dragging'); }
    track.scrollLeft = drag.left - dx;
  });
  const endDrag = (e) => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    drag = null;
    if (!dragged) return;
    track.classList.remove('is-dragging'); // 스냅이 다시 켜지며 가까운 카드로 맞춰진다
  };
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  track.addEventListener('click', (e) => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, true);
  track.addEventListener('dragstart', (e) => e.preventDefault());

  /* ---------- 공지사항 목록 (왼쪽) — 한 줄 목록 최대 4개 (UI.noticeLine, common.css '공지 한 줄 목록') ----------
     1~4개: 있는 만큼만(빈 칸 채우지 않음) / 0개: 공지 칸 숨김 → 소식이 전체 폭(.story.is-no-notice) / 공지·소식 둘 다 0개: 섹션 숨김 */
  const section = document.getElementById('screen-story');
  const noticeCol = document.querySelector('.story-notice');
  if (!data.notice.length && !data.news.length) {
    if (section) { section.hidden = true; window.Fullpage?.refresh?.(); } // PC 한 화면 넘김 목록에서도 빠지게
    return;
  }
  section?.classList.toggle('is-no-notice', !data.notice.length);
  if (noticeCol) noticeCol.hidden = !data.notice.length; // '전체보기'도 함께 숨김 = 공지 1개 이상일 때만 보임
  if (noticeEl) {
    const mq = window.API.mockQuery ? window.API.mockQuery() : '';
    noticeEl.innerHTML = data.notice.map((r) => `<li>${window.UI.noticeLine(r, { href: `./community/notice-view.html?id=${encodeURIComponent(r.id)}${mq}` })}</li>`).join('');
  }

  /* ---------- 치과소식 카드 (오른쪽) ---------- */
  list.innerHTML = data.news.length ? data.news.map(card).join('') : '<li class="empty">등록된 소식이 없습니다.</li>';
  update();

  // 카드가 플로팅 퀵메뉴 뒤로 지나가는 동안 퀵메뉴 버튼에 옅은 그림자 (main.css .quick--float.is-over-cards) — 버튼과 카드 글자가 섞여 보이지 않게
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => document.querySelector('.quick--float')?.classList.toggle('is-over-cards', e.isIntersecting)).observe(track);
  }
}

/* ---------- 스크롤 연출: 진입 애니메이션 ----------
   의료진 섹션부터 적용. 섹션 타이틀은 fade-up, 카드 묶음은 자식이 0.08s 간격으로 순차 등장 (간격은 main.css). 움직임 줄이기 설정이면 끔 */
function initReveal() {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const singles = '.why__head, .why-philo, .clinic__head, .doctors__head, .cases__head, .faq-preview__head, .faq-preview__box, .faq-quick, .story-notice, .story__body';
  const groups = '.why__cards, .clinic__grid, .cases__list'; // 치과소식 카드는 탭으로 다시 그려지므로 묶음(.story__body)째로 등장
  const targets = [
    // 의료진 인물 줄: 줄 전체가 아니라 사진·이름 하나하나 등장 (main.css .reveal-photos — 흰 배경 사진 multiply 가 끊기지 않게)
    ...[...document.querySelectorAll('.doctors__main')].map((el) => { el.classList.add('reveal-photos'); return el; }),
    ...[...document.querySelectorAll(singles)].map((el) => { el.classList.add('reveal'); return el; }),
    ...[...document.querySelectorAll(groups)].map((el) => { el.classList.add('reveal-group'); return el; }),
  ];
  // 일반 스크롤(모바일·태블릿·낮은 화면): 화면에 들어오면 한 번만 등장
  const io = new IntersectionObserver((entries) => {
    if (window.Fullpage?.isActive()) return; // PC 한 화면 넘김 중에는 아래 도착 알림이 맡음
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  targets.forEach((el) => io.observe(el));
  // PC 한 화면 넘김(fullpage.js): 넘김이 끝나 섹션에 도착한 뒤 그 섹션 요소가 서서히 나타남(.reveal 0.8s, 묶음은 차례로).
  // 다른 섹션 요소는 다시 숨겨 두어(화면 밖이라 보이지 않음) 돌아오면 다시 나타남
  window.addEventListener('fullpage:arrive', (e) => {
    const sec = e.detail.el;
    targets.forEach((el) => el.classList.toggle('is-in', !!sec && sec.contains(el)));
  });
}
