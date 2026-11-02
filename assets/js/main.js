/* ==========================================================================
   메인 페이지 — 히어로 슬라이더 / 의료진 캐러셀 / 치료사례 잠금 / FAQ / 치과소식
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initHero();
  initDoctors();
  initCases();
  renderFaqPreview();
  renderLatestNews();
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

/* ---------- ④ 의료진 캐러셀 ---------- */
function initDoctors() {
  const track = document.querySelector('[data-doctors-track]');
  if (!track || !window.SITE) return;
  const viewport = track.parentElement;
  const tabs = [...document.querySelectorAll('.doctors__tab')];
  const prevBtn = document.querySelector('[data-doc-prev]');
  const nextBtn = document.querySelector('[data-doc-next]');
  const { esc, img, branchBadge } = window.UI;
  let cards = [];
  let active = 0;

  function render(branchId) {
    const list = window.SITE.getDoctorsByBranch(branchId);
    track.innerHTML = list.map((d) => `
      <li class="doctor-card">
        <div class="doctor-card__photo img-ph"><img src="${img(d.photo)}" alt="${esc(d.name)} ${esc(d.title)} 사진" loading="lazy"></div>
        <span class="doctor-card__tag">${branchBadge(d.branches.length > 1 ? 'both' : d.branches[0])}</span>
        <h3 class="doctor-card__name">${esc(d.name)}<small>${esc(d.title)}</small></h3>
        <p class="doctor-card__dept">${esc(d.dept)}</p>
      </li>`).join('');
    cards = [...track.children];
    cards.forEach((card, i) => card.addEventListener('click', () => go(i)));
    go(Math.min(1, cards.length - 1)); // 첫 화면에서 양옆이 보이도록 두 번째 카드부터
  }

  function go(i) {
    active = Math.max(0, Math.min(i, cards.length - 1));
    cards.forEach((c, n) => {
      c.classList.toggle('is-active', n === active);
      c.setAttribute('aria-current', n === active ? 'true' : 'false');
    });
    const card = cards[active];
    const offset = card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2;
    track.style.transform = `translateX(${-offset}px)`;
    prevBtn.disabled = active === 0;
    nextBtn.disabled = active === cards.length - 1;
  }

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
  prevBtn.addEventListener('click', () => go(active - 1));
  nextBtn.addEventListener('click', () => go(active + 1));

  let startX = null;
  viewport.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  viewport.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
    startX = null;
  });
  window.addEventListener('resize', () => go(active));

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
