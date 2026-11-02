/* ==========================================================================
   메인 페이지 — 히어로 슬라이더 / 의료진 캐러셀 / 치료사례 잠금 / FAQ / 치과소식 / 스크롤 연출
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initHero();
  initDoctors();
  initCases();
  renderFaqPreview();
  renderLatestNews();
  initScreenNav();
  initReveal();
});

/* ---------- ① 히어로 슬라이더 ---------- */
function initHero() {
  const slider = document.getElementById('hero-slider');
  if (!slider) return;
  const slides = [...slider.querySelectorAll('.hero__slide')];
  const current = slider.querySelector('[data-hero-current]');
  const playBtn = slider.querySelector('[data-hero-play]');
  const pauseBtn = slider.querySelector('[data-hero-pause]');
  const DELAY = 5000;
  let index = 0;
  let timer = null;

  slider.querySelector('[data-hero-total]').textContent = slides.length;

  function go(next) {
    index = (next + slides.length) % slides.length;
    slides.forEach((s, i) => {
      const active = i === index;
      s.classList.toggle('is-active', active);
      s.setAttribute('aria-hidden', String(!active));
      s.querySelectorAll('a, button').forEach((el) => (el.tabIndex = active ? 0 : -1));
    });
    current.textContent = index + 1;
  }
  function play() {
    stop();
    timer = setInterval(() => go(index + 1), DELAY);
    playBtn.setAttribute('aria-pressed', 'true');
    pauseBtn.setAttribute('aria-pressed', 'false');
  }
  function stop() {
    clearInterval(timer);
    timer = null;
    playBtn.setAttribute('aria-pressed', 'false');
    pauseBtn.setAttribute('aria-pressed', 'true');
  }
  const restart = () => { if (timer) play(); };

  slider.querySelector('[data-hero-prev]').addEventListener('click', () => { go(index - 1); restart(); });
  slider.querySelector('[data-hero-next]').addEventListener('click', () => { go(index + 1); restart(); });
  playBtn.addEventListener('click', play);
  pauseBtn.addEventListener('click', stop);

  // 모바일 스와이프
  let startX = null;
  slider.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  slider.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) { go(index + (dx < 0 ? 1 : -1)); restart(); }
    startX = null;
  });

  go(0);
  // 움직임 줄이기 설정 사용자는 자동재생하지 않음
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) stop();
  else play();
}

/* ---------- ④ 의료진 캐러셀 — 왼쪽 첫 카드가 활성, 무한 반복, 버튼·마우스 드래그·터치 스와이프 ----------
   의료진 목록을 3벌(앞 복제 · 진짜 · 뒤 복제) 이어 붙이고, 이동이 끝나면 같은 의료진의 '진짜' 카드 위치로
   애니메이션 없이 순간 이동한다 → 끝에서도 카드가 끊기지 않고 1번 카드로 자연스럽게 이어진다 */
function initDoctors() {
  const track = document.querySelector('[data-doctors-track]');
  if (!track || !window.SITE) return;
  const viewport = track.parentElement;
  const tabs = [...document.querySelectorAll('.doctors__tab')];
  const prevBtn = document.querySelector('[data-doc-prev]');
  const nextBtn = document.querySelector('[data-doc-next]');
  const { esc, img, branchBadge } = window.UI;
  const COPIES = 3;
  let cards = [];
  let count = 0;   // 의료진 수 (복제 제외)
  let active = 0;  // cards 기준 인덱스 — 평소에는 가운데 벌(count ~ 2*count-1) 안에 있다

  const cardHtml = (d, clone) => `
      <li class="doctor-card"${clone ? ' aria-hidden="true"' : ''}>
        <div class="doctor-card__photo img-ph"><img src="${img(d.photo)}" alt="${clone ? '' : `${esc(d.name)} ${esc(d.title)} 사진`}" loading="lazy" draggable="false"></div>
        <span class="doctor-card__tag">${branchBadge(d.branches.length > 1 ? 'both' : d.branches[0])}</span>
        <h3 class="doctor-card__name">${esc(d.name)}<small>${esc(d.title)}</small></h3>
        <p class="doctor-card__dept">${esc(d.dept)}</p>
      </li>`;

  function render(branchId) {
    // 지점 대표원장이 첫 번째(활성) 카드가 되도록 맨 앞으로
    const list = window.SITE.getDoctorsByBranch(branchId);
    const head = list.findIndex((d) => d.title === '대표원장');
    if (head > 0) list.unshift(...list.splice(head, 1));
    count = list.length;
    track.innerHTML = Array.from({ length: COPIES }, (_, copy) => list.map((d) => cardHtml(d, copy !== 1)).join('')).join('');
    cards = [...track.children];
    cards.forEach((card, i) => card.addEventListener('click', () => { if (!dragMoved) go(i); }));
    jump(count); // 가운데 벌의 첫 카드 = 대표원장
  }

  const offsetOf = (i) => -cards[i].offsetLeft;
  function setActive(i) {
    active = i;
    cards.forEach((c, n) => c.classList.toggle('is-active', n === i));
  }
  // 애니메이션 없이 바로 이동 (복제 → 진짜 카드로 바꿔치기, 탭 전환)
  function jump(i) {
    track.classList.add('is-jumping');
    setActive(i);
    track.style.transform = `translateX(${offsetOf(i)}px)`;
    void track.offsetWidth; // 위 상태를 먼저 그리게 해서 트랜지션 없이 적용
    track.classList.remove('is-jumping');
  }
  // 가운데 벌 밖에 있으면 같은 의료진의 가운데 벌 카드로 순간 이동
  function normalize() {
    if (active < count || active >= count * 2) jump(count + (((active - count) % count) + count) % count);
  }
  // i 번째 카드를 활성(왼쪽 첫 카드)으로 — 애니메이션 이동
  function go(i) {
    setActive(Math.max(0, Math.min(cards.length - 1, i)));
    track.style.transform = `translateX(${offsetOf(active)}px)`;
  }
  // 현재 위치에서 n 장 이동 (먼저 가운데 벌로 맞춰 두므로 어느 쪽으로든 끊기지 않는다)
  function step(n) {
    normalize();
    go(active + n);
  }
  track.addEventListener('transitionend', (e) => { if (e.target === track) normalize(); });

  function selectTab(tab) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    viewport.setAttribute('aria-labelledby', tab.id);
    render(tab.dataset.branch);
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (e) => {
      if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      const next = tabs[(i + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      next.focus();
      selectTab(next);
    });
  });
  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));

  /* 마우스 드래그·터치 스와이프 (Pointer Events) — 끌면 카드가 손을 따라오고, 놓으면 끈 거리만큼 장 단위로 이동 */
  let dragStartX = null;
  let dragBase = 0;
  let dragMoved = false; // 끌었으면 놓을 때의 click 으로 카드가 선택되지 않게
  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    normalize();
    dragStartX = e.clientX;
    dragBase = offsetOf(active);
    dragMoved = false;
  });
  viewport.addEventListener('pointermove', (e) => {
    if (dragStartX === null) return;
    const dx = e.clientX - dragStartX;
    if (!dragMoved && Math.abs(dx) < 6) return;
    if (!dragMoved) { dragMoved = true; viewport.setPointerCapture(e.pointerId); viewport.classList.add('is-dragging'); }
    track.style.transform = `translateX(${dragBase + dx}px)`;
  });
  const endDrag = (e) => {
    if (dragStartX === null) return;
    const dx = e.clientX - dragStartX;
    dragStartX = null;
    viewport.classList.remove('is-dragging');
    if (!dragMoved) return;
    const cardStep = cards[1].offsetLeft - cards[0].offsetLeft;
    // 40px 이상 끌면 최소 한 장, 많이 끌면 끈 장수만큼 (한 번에 최대 count-1 장)
    const moved = Math.abs(dx) < 40 ? 0 : Math.max(1, Math.round(Math.abs(dx) / cardStep));
    step(-Math.sign(dx) * Math.min(moved, count - 1));
    setTimeout(() => { dragMoved = false; }, 0);
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  window.addEventListener('resize', () => jump(active));

  selectTab(tabs[0]);
}

/* ---------- ⑥ 치료사례 잠금 ---------- */
function initCases() {
  const loggedIn = window.API?.isLoggedIn();
  document.querySelectorAll('[data-cases] .case-card').forEach((card) => {
    card.classList.toggle('is-unlocked', !!loggedIn);
  });
}

/* ---------- ⑦ FAQ 미리보기 ---------- */
async function renderFaqPreview() {
  const box = document.querySelector('[data-faq-preview]');
  if (!box) return;
  try {
    const faqs = (await window.API.getFaqs({ featured: true })).slice(0, 5);
    box.innerHTML = faqs.map((f, i) => window.UI.faqItem(f, i, 'faq-pre')).join('');
    window.UI.accordion(box);
  } catch (err) {
    console.error(err);
    box.innerHTML = '<li class="empty">질문을 불러오지 못했습니다.</li>';
  }
}

/* ---------- ⑧ 치과소식 최신 3개 ---------- */
async function renderLatestNews() {
  const list = document.querySelector('[data-news-latest]');
  if (!list) return;
  const { esc, img, formatDate } = window.UI;
  try {
    const news = await window.API.getNews({ limit: 3 });
    list.innerHTML = news.map((n) => `
      <li>
        <a href="./community/news.html#news-${esc(n.id)}">
          <div class="post-card__thumb img-ph"><img src="${img(n.thumbnail)}" alt="${esc(n.title)} 썸네일" loading="lazy"></div>
          <p class="post-card__title">${esc(n.title)}</p>
          <p class="post-card__date"><time datetime="${esc(n.date)}">${formatDate(n.date, true)}</time></p>
        </a>
      </li>`).join('');
  } catch (err) {
    console.error(err);
    list.innerHTML = '<li class="empty">소식을 불러오지 못했습니다.</li>';
  }
}

/* ---------- 스크롤 연출: 왼쪽 섹션 표시기 ----------
   [data-screen] 화면마다 점 하나. 보이는 조건(데스크톱·높이 700px 이상)은 main.css 가 정한다. */
function initScreenNav() {
  const screens = [...document.querySelectorAll('[data-screen]')];
  if (!screens.length || !('IntersectionObserver' in window)) return;
  const { esc } = window.UI;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = (n) => String(n).padStart(2, '0');

  const nav = document.createElement('nav');
  nav.className = 'screen-nav';
  nav.setAttribute('aria-label', '메인 섹션 바로가기');
  nav.innerHTML = `
    <span class="screen-nav__num" aria-hidden="true" data-screen-num>01</span>
    <span class="screen-nav__name" aria-hidden="true" data-screen-name></span>
    <ol class="screen-nav__list">
      ${screens.map((s) => `<li><button type="button" class="screen-nav__btn"><span class="screen-nav__tip">${esc(s.dataset.screen)}</span></button></li>`).join('')}
    </ol>`;
  document.body.append(nav);
  const num = nav.querySelector('[data-screen-num]');
  const name = nav.querySelector('[data-screen-name]');
  const btns = [...nav.querySelectorAll('.screen-nav__btn')];

  function setActive(i) {
    btns.forEach((b, n) => b.setAttribute('aria-current', String(n === i)));
    num.textContent = pad(i + 1);
    name.textContent = screens[i].dataset.screen;
  }

  btns.forEach((btn, i) => btn.addEventListener('click', () => {
    screens[i].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }));

  // 화면 세로 가운데 선에 걸친 섹션 = 현재 섹션. 마지막 섹션을 지나 푸터로 가면 표시기를 숨긴다
  const last = screens[screens.length - 1];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        setActive(screens.indexOf(e.target));
        nav.classList.remove('is-hidden');
      } else if (e.target === last && e.boundingClientRect.top < 0) {
        nav.classList.add('is-hidden');
      }
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  screens.forEach((s) => io.observe(s));
  setActive(0);

  // 표시기 조각(번호·이름·점)마다 어두운 배경([data-screen-dark]) 위에 있으면 흰색, 아니면 기본(회색).
  // 배경 경계가 표시기 중간을 지나가도 조각별로 따로 바뀐다
  const darks = [...document.querySelectorAll('[data-screen-dark]')];
  const parts = [num, name, ...nav.querySelectorAll('.screen-nav__list > li')];
  let ticking = false;
  function updateTone() {
    ticking = false;
    const areas = darks.map((d) => d.getBoundingClientRect());
    parts.forEach((p) => {
      const r = p.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      p.classList.toggle('is-light', areas.some((a) => x >= a.left && x <= a.right && y >= a.top && y <= a.bottom));
    });
  }
  const requestTone = () => { if (!ticking) { ticking = true; requestAnimationFrame(updateTone); } };
  if (darks.length) {
    window.addEventListener('scroll', requestTone, { passive: true });
    window.addEventListener('resize', requestTone);
    window.addEventListener('load', requestTone);
    // 이미지·include 로딩으로 레이아웃이 바뀌어도 다시 계산
    if ('ResizeObserver' in window) { const ro = new ResizeObserver(requestTone); darks.forEach((d) => ro.observe(d)); ro.observe(document.body); }
    updateTone();
  }
}

/* ---------- 스크롤 연출: 진입 애니메이션 ----------
   의료진 섹션부터 적용. 섹션 타이틀은 fade-up, 카드 묶음은 자식이 0.08s 간격으로 순차 등장 (간격은 main.css). 움직임 줄이기 설정이면 끔 */
function initReveal() {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const singles = '.doctors__head, .doctors__viewport, .clinic__head, .cases__head, .faq-preview__head, .faq-preview__box, .story__head';
  const groups = '.clinic__grid, .cases__list, .story__list';
  const targets = [
    ...[...document.querySelectorAll(singles)].map((el) => { el.classList.add('reveal'); return el; }),
    ...[...document.querySelectorAll(groups)].map((el) => { el.classList.add('reveal-group'); return el; }),
  ];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target); // 한 번만 등장
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  targets.forEach((el) => io.observe(el));
}
