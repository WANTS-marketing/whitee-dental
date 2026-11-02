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
  pauseBtn.addEventListener('click', stop); // 첫 진입 중에 누르면 애니메이션이 끝나도 자동재생하지 않는다 (아래 aria-pressed 확인)

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
  // 움직임 줄이기 설정 사용자는 첫 진입 애니메이션·자동재생 없이 바로 표시
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { document.body.classList.remove('is-intro'); stop(); return; }
  if (!document.body.classList.contains('is-intro')) { play(); return; }
  // 첫 진입 애니메이션(main.css '첫 진입 애니메이션')이 끝난 뒤 자동재생 시작. 그동안 버튼은 재생 상태로 표시
  const INTRO_MS = window.matchMedia('(max-width: 768px)').matches ? 500 : 2600;
  playBtn.setAttribute('aria-pressed', 'true');
  pauseBtn.setAttribute('aria-pressed', 'false');
  setTimeout(() => {
    document.body.classList.remove('is-intro');
    if (playBtn.getAttribute('aria-pressed') === 'true' && !timer) play();
  }, INTRO_MS);
}

/* ---------- ④ 의료진 — 큰 프로필 1명 + 같은 지점 원장 썸네일 ----------
   프로필은 의료진 전원을 한 칸(.doc-profiles 그리드 1칸)에 겹쳐 두고 선택된 원장만 보인다
   → 패널 높이 = 가장 긴 약력 기준으로 고정, 원장을 바꿔도 섹션 높이가 그대로. 교체는 opacity 0.3s (main.css)
   탭 전환 시 지점 대표원장 먼저, 이전/다음은 썸네일 순서대로 순환, 자동 넘김 없음 */
function initDoctors() {
  const box = document.querySelector('[data-doc-profiles]');
  const thumbsEl = document.querySelector('[data-doc-thumbs]');
  if (!box || !thumbsEl || !window.SITE) return;
  const panel = document.getElementById('doctors-panel');
  const tabs = [...document.querySelectorAll('.doctors__tab')];
  const prevBtn = document.querySelector('[data-doc-prev]');
  const nextBtn = document.querySelector('[data-doc-next]');
  const { esc, img, branchBadge } = window.UI;
  const docs = window.SITE.doctors;
  const MOBILE_LIMIT = 6; // 모바일: 약력 처음 6개만, 나머지는 '약력 더보기'
  const TWO_COL = 8;      // 약력(전문의 항목 제외) 8개 이상이면 2열
  const isCert = (c) => c.startsWith('보건복지부 인증');
  const link = document.querySelector('[data-doc-link]');

  box.innerHTML = docs.map((d, i) => {
    const career = d.career || [];
    const certs = career.filter(isCert);
    const rest = career.filter((c) => !isCert(c));
    let n = 0;
    const li = (c) => `<li${n++ >= MOBILE_LIMIT ? ' class="is-extra"' : ''}>${esc(c)}</li>`;
    return `
      <article class="doc-profile" data-doc="${i}" aria-hidden="true" inert>
        <div class="doc-profile__photo img-ph"><img src="${img(d.photo)}" alt="${esc(d.name)} ${esc(d.title)} 사진" loading="lazy"></div>
        <div class="doc-profile__body">
          <p class="doc-profile__meta">${branchBadge(d.branches.length > 1 ? 'both' : d.branches[0])}<span class="doc-profile__dept">${esc(d.dept)}</span></p>
          <h3 class="doc-profile__name">${esc(d.name)} <small>${esc(d.title)}</small></h3>
          ${certs.length ? `<ul class="doc-profile__certs">${certs.map(li).join('')}</ul>` : ''}
          ${rest.length ? `<ul class="doc-profile__career${rest.length >= TWO_COL ? ' is-2col' : ''}">${rest.map(li).join('')}</ul>` : ''}
          ${career.length > MOBILE_LIMIT ? '<button type="button" class="doc-profile__more" aria-expanded="false">약력 더보기</button>' : ''}
        </div>
      </article>`;
  }).join('');
  const profiles = [...box.children];
  box.addEventListener('click', (e) => {
    const more = e.target.closest('.doc-profile__more');
    if (!more) return;
    const open = more.closest('.doc-profile').classList.toggle('is-expanded');
    more.setAttribute('aria-expanded', String(open));
    more.textContent = open ? '약력 접기' : '약력 더보기';
  });

  let branch = 'changwon';
  let list = []; // 현재 지점 의료진의 docs 인덱스 (대표원장 먼저)
  let pos = 0;
  let thumbs = [];

  function select(p) {
    pos = (p + list.length) % list.length;
    const di = list[pos];
    profiles.forEach((el, i) => {
      const on = i === di;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-hidden', String(!on));
      el.inert = !on;
    });
    link.href = `./about/doctors.html#${branch}-${window.SITE.doctorSlug(docs[di])}`;
    thumbs.forEach((t, i) => t.setAttribute('aria-pressed', String(i === pos)));
    // 썸네일 줄이 가로 스크롤일 때(모바일) 선택한 썸네일이 보이게
    const li = thumbs[pos].parentElement;
    if (li.offsetLeft < thumbsEl.scrollLeft || li.offsetLeft + li.offsetWidth > thumbsEl.scrollLeft + thumbsEl.clientWidth) {
      thumbsEl.scrollTo({ left: li.offsetLeft - 16, behavior: 'smooth' });
    }
  }

  function render(branchId) {
    branch = branchId;
    const ds = window.SITE.getDoctorsByBranch(branchId);
    const head = ds.findIndex((d) => d.title === '대표원장');
    if (head > 0) ds.unshift(...ds.splice(head, 1));
    list = ds.map((d) => docs.indexOf(d));
    thumbsEl.innerHTML = ds.map((d, p) => `
      <li><button type="button" class="doc-thumb" data-pos="${p}" aria-pressed="false">
        <span class="doc-thumb__photo img-ph"><img src="${img(d.photo)}" alt="" loading="lazy"></span>
        <span class="doc-thumb__text"><b>${esc(d.name)}</b><small>${esc(d.dept)}</small></span>
      </button></li>`).join('');
    thumbs = [...thumbsEl.querySelectorAll('.doc-thumb')];
    thumbs.forEach((t) => t.addEventListener('click', () => select(Number(t.dataset.pos))));
    thumbsEl.scrollLeft = 0;
    select(0); // 지점 대표원장
  }

  function selectTab(tab) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tab.id);
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
  prevBtn.addEventListener('click', () => select(pos - 1));
  nextBtn.addEventListener('click', () => select(pos + 1));

  selectTab(tabs[0]);

  /* 약력 줄바꿈 없애기 — 2열에서 두 줄로 꺾이는 항목이 있으면 그 원장만 1열로 (말줄임 없음)
     데스크톱(1025px 이상)에서만. 숨겨진 프로필도 자리를 차지하고 있어 바로 잴 수 있다 */
  const wraps = (ul) => [...ul.children].some((li) => li.getClientRects().length > 1 || li.offsetHeight > parseFloat(getComputedStyle(li).lineHeight) * 1.5);
  function fitCareer() {
    profiles.forEach((el) => {
      const ul = el.querySelector('.doc-profile__career');
      if (!ul) return;
      const want2 = ul.children.length >= TWO_COL;
      ul.classList.toggle('is-2col', want2);
      if (want2 && window.matchMedia('(min-width: 1025px)').matches && wraps(ul)) ul.classList.remove('is-2col');
    });
  }
  fitCareer();
  document.fonts?.ready.then(fitCareer);
  let fitTimer;
  window.addEventListener('resize', () => { clearTimeout(fitTimer); fitTimer = setTimeout(fitCareer, 150); });
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
  const singles = '.philosophy__text, .doctors__head, .doctors__main, .clinic__head, .cases__head, .faq-preview__head, .faq-preview__box, .story__head';
  const groups = '.branch-cards, .clinic__grid, .cases__list, .story__list';
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
