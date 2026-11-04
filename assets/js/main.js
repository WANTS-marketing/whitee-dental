/* ==========================================================================
   메인 페이지 — 히어로 슬라이더 / 의료진 캐러셀 / 치료사례 잠금 / FAQ / 치과소식 / 스크롤 연출
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initHero();
  initDoctors();
  initCases();
  renderFaqPreview();
  renderLatestNews();
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
   카드: 지점 의료진(대표원장 먼저)을 가로 스크롤 줄로, 머리말 ‹ › 는 한 장씩 이동 (한 화면 장수는 main.css --doc-per)
   팝업(dialog): 카드 클릭 시 큰 프로필(사진 + 학력·경력·학회 활동). 팝업 안 ‹ › 는 같은 지점 원장 순환
   프로필은 전원을 한 칸에 겹쳐 두고 선택된 원장만 보인다 → 원장을 바꿔도 팝업 크기가 그대로 */
function initDoctors() {
  const box = document.querySelector('[data-doc-profiles]');
  const cardsEl = document.querySelector('[data-doc-cards]');
  const modal = document.querySelector('[data-doc-modal]');
  if (!box || !cardsEl || !modal || !window.SITE) return;
  const panel = document.getElementById('doctors-panel');
  const tabs = [...document.querySelectorAll('.doctors__tab')];
  const prevBtn = document.querySelector('[data-doc-prev]');
  const nextBtn = document.querySelector('[data-doc-next]');
  const countEl = modal.querySelector('[data-modal-count]');
  const { esc, img } = window.UI;
  const docs = window.SITE.doctors;
  const BRANCH_NAME = { changwon: '창원점', masan: '마산점' };
  /* 약력 분류 — 전문의 / 학력(졸업·석사·박사·학사) / 학회 활동(학회·연맹 회원·인정의·펠로우) / 그 외 경력.
     분류가 애매한 항목은 경력으로 간다 → docs/HANDOVER.md '약력 분류 병원 확인' */
  const classify = (c) => {
    if (c.startsWith('보건복지부 인증')) return 'cert';
    if (/졸업|석사|박사|학사/.test(c)) return 'edu';
    if (/학회|연맹/.test(c) && /회원|인정의|펠로우|Fellow/.test(c) && !/수상|표창|수료|발표/.test(c)) return 'society';
    return 'career';
  };
  const GROUP_TITLE = { edu: '학력', career: '경력', society: '학회 활동' };
  /* 학회 활동 항목 나누기 (표시만, 데이터는 그대로)
     "세계교정의사연맹 Fellow, 미국·유럽·일본 치과교정학회 국제회원" → ', ' 로 (각 부분이 학회·연맹일 때)
     "대한치과보존학회·대한치주과학회 정회원" → '·' 로 나누고 끝의 공통 꼬리(정회원)를 각 학회에 붙인다 */
  const splitSociety = (c) => {
    const commaParts = c.split(', ');
    if (commaParts.length > 1 && commaParts.every((p) => /학회|연맹/.test(p))) return commaParts.flatMap(splitSociety);
    const parts = c.split('·');
    if (parts.length < 2 || !parts.every((p) => /학회/.test(p))) return [c];
    const tail = parts[parts.length - 1].match(/^(.*학회)(\s.+)$/);
    if (!tail) return [c];
    return parts.map((p, i) => (i === parts.length - 1 ? p : p + tail[2]));
  };
  /* 카드 짧은 소개: '보건복지부 인증 ○○ 전문의' 항목을 한 문장으로 (2개면 "… 치과교정과 · 통합치의학과 전문의")
     전문의 항목이 없으면 약력 첫 줄 */
  const intro = (d) => {
    const certs = (d.career || []).filter((c) => c.startsWith('보건복지부 인증'));
    if (!certs.length) return (d.career || [])[0] || '';
    const fields = certs.map((c) => c.replace(/^보건복지부 인증\s*/, '').replace(/\s*전문의$/, ''));
    return `보건복지부 인증 ${fields.join(' · ')} 전문의`; // '·' 가 줄 맨 앞에 오지 않게 앞 단어에 붙임
  };
  /* 진료과 배지 아이콘 (흰 선, 64×64) — 교정=교정장치, 보철=크라운, 치주=잇몸 치아, 보존=충치 치아, 구강악안면외과=치과 기구, 통합=치아 */
  const TOOTH = 'M22 14c-6 0-9 4-9 10 0 7 3 11 4 17 .5 4 1.5 10 4.5 10 3.5 0 3.5-7 5-11 .8-1.6 1.6-2.4 3.5-2.4s2.7.8 3.5 2.4c1.5 4 1.5 11 5 11 3 0 4-6 4.5-10 1-6 4-10 4-17 0-6-3-10-9-10-4 0-5 2.5-8 2.5s-4-2.5-8-2.5z';
  const ICON = {
    ortho: '<path d="M6 40c4-5 9-7 13-7h26c4 0 9 2 13 7"/><rect x="9" y="19" width="13" height="13" rx="3"/><rect x="25.5" y="19" width="13" height="13" rx="3"/><rect x="42" y="19" width="13" height="13" rx="3"/><path d="M5 25.5h54"/>',
    prosth: '<path d="M18 22c0-6 5-10 14-10s14 4 14 10c0 4-1 7-3 9H21c-2-2-3-5-3-9z"/><path d="M21 15l5 4 6-6 6 6 5-4"/><path d="M22 31c0 7 2 12 3 18 .4 3 1.4 5 3 5 2 0 2-6 4-9 2 3 2 9 4 9 1.6 0 2.6-2 3-5 1-6 3-11 3-18"/>',
    perio: `<path d="${TOOTH}"/><path d="M6 34c5-3 9 3 14 0s9-3 12 0 7 3 12 0 9-3 14 0"/>`,
    endo: `<path d="${TOOTH}"/><circle cx="38" cy="23" r="3.5"/><path d="M23 22c1-2 2-3 4-3"/>`,
    surgery: '<circle cx="20" cy="13" r="6"/><path d="M20 19v38M42 8c0-3 6-3 6 1 0 3-3 4-3 7v41"/><path d="M15 40h10M40 40h10"/>',
    general: `<path d="${TOOTH}"/>`,
  };
  const iconKey = (dept) => (/교정/.test(dept) ? 'ortho' : /보철/.test(dept) ? 'prosth' : /치주/.test(dept) ? 'perio'
    : /보존/.test(dept) ? 'endo' : /구강악안면/.test(dept) ? 'surgery' : 'general');
  const badge = (dept) => `<span class="doc-card__badge" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${ICON[iconKey(dept)]}</svg></span>`;

  // 팝업 안 큰 프로필 (원장마다 1개, 선택한 1개만 보임)
  box.innerHTML = docs.map((d, i) => {
    const career = d.career || [];
    const by = { cert: [], edu: [], career: [], society: [] };
    career.forEach((c) => { const k = classify(c); by[k].push(...(k === 'society' ? splitSociety(c) : [c])); });
    const li = (c) => `<li>${esc(c)}</li>`;
    const group = (key) => (by[key].length ? `
            <section class="doc-group"><h4 class="doc-group__title">${GROUP_TITLE[key]}</h4><ul class="doc-group__list">${by[key].map(li).join('')}</ul></section>` : '');
    const certs = by.cert.length ? `<ul class="doc-profile__certs">${by.cert.map(li).join('')}</ul>` : '';
    // 왼쪽 열: 학력·경력 / 오른쪽 열: 학회 활동
    const cols = `<div class="doc-profile__cols"><div class="doc-profile__col">${group('edu')}${group('career')}</div><div class="doc-profile__col">${group('society')}</div></div>`;
    return `
      <article class="doc-profile" data-doc="${i}" aria-hidden="true" inert>
        <div class="doc-profile__photo img-ph"><img src="${img(d.photo)}" alt="${esc(d.name)} ${esc(d.title)} 사진" loading="lazy"></div>
        <div class="doc-profile__body">
          <p class="doc-profile__meta"><span data-doc-branch>${BRANCH_NAME[d.branches[0]]}</span> · <b class="doc-profile__dept">${esc(d.dept)}</b></p>
          <h3 class="doc-profile__name">${esc(d.name)} <small>${esc(d.title)}</small></h3>
          ${certs}${cols}
        </div>
      </article>`;
  }).join('');
  const profiles = [...box.children];

  let branch = 'changwon';
  let list = []; // 현재 지점 의료진의 docs 인덱스 (대표원장 먼저)
  let pos = 0;   // 팝업에서 보고 있는 원장 (list 안 순번)
  let opener = null; // 팝업을 연 카드 (닫히면 포커스 복귀)

  /* ---------- 카드 줄 ---------- */
  function render(branchId) {
    branch = branchId;
    panel.dataset.branch = branchId; // 진료과·배지·링크 색 = 지점 색 (common.css --doc-color)
    modal.dataset.branch = branchId;
    const ds = window.SITE.getDoctorsByBranch(branchId);
    const head = ds.findIndex((d) => d.title === '대표원장');
    if (head > 0) ds.unshift(...ds.splice(head, 1));
    list = ds.map((d) => docs.indexOf(d));
    cardsEl.innerHTML = ds.map((d, p) => `
      <li class="doc-cards__item"><button type="button" class="doc-card" data-pos="${p}" aria-haspopup="dialog">
        <span class="doc-card__photo img-ph"><img src="${img(d.photo)}" alt="" loading="lazy">${badge(d.dept)}</span>
        <span class="doc-card__body">
          <span class="doc-card__dept">${esc(d.dept)}</span>
          <span class="doc-card__name"><b>${esc(d.name)}</b> <small>${esc(d.title)}</small></span>
          <span class="doc-card__intro">${esc(intro(d))}</span>
          <span class="doc-card__more">약력 보기<span class="doc-card__line" aria-hidden="true"></span></span>
        </span>
      </button></li>`).join('');
    cardsEl.scrollLeft = 0;
    refit();
  }
  // ‹ › = 카드 한 장씩 (카드 너비 + 간격). 끝에 닿으면 비활성
  const step = () => {
    const items = cardsEl.children;
    return items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : cardsEl.clientWidth;
  };
  /* 이전·다음: 카드가 한 화면에 다 들어가면(창원 5명) 숨기고, 넘칠 때(마산 6명)만 첫·마지막 보이는 카드 사진 위에 표시
     끝에 닿은 쪽 버튼은 사라진다. 세로 위치 = 카드 가운데 (--doc-arrow-top) */
  const nav = prevBtn.closest('.doctors__nav');
  function updateArrows() {
    const max = cardsEl.scrollWidth - cardsEl.clientWidth;
    nav.hidden = max <= 2;
    prevBtn.disabled = cardsEl.scrollLeft <= 2;
    nextBtn.disabled = cardsEl.scrollLeft >= max - 2;
    const card = cardsEl.querySelector('.doc-card');
    if (card) panel.style.setProperty('--doc-arrow-top', `${card.getBoundingClientRect().top - panel.getBoundingClientRect().top + card.offsetHeight / 2}px`);
  }
  prevBtn.addEventListener('click', () => cardsEl.scrollBy({ left: -step(), behavior: 'smooth' }));
  nextBtn.addEventListener('click', () => cardsEl.scrollBy({ left: step(), behavior: 'smooth' }));
  cardsEl.addEventListener('scroll', () => requestAnimationFrame(updateArrows), { passive: true });
  /* 낮은 화면: 섹션이 한 화면(100vh - 헤더)을 넘으면 넘친 만큼 사진 높이를 줄인다 (최소 1:1, 기본 4:5)
     화면 단위 구성(1025px 이상·높이 700px 이상)에서만. 창 크기·글자 크기·지점 탭이 바뀔 때마다 다시 계산 */
  const section = panel.closest('.doctors');
  const screenMode = window.matchMedia('(min-width: 1025px) and (min-height: 700px)');
  function fitHeight() {
    panel.style.removeProperty('--doc-photo-h');
    const photo = cardsEl.querySelector('.doc-card__photo');
    if (!screenMode.matches || !photo || !section) return;
    const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
    const over = section.offsetHeight - (window.innerHeight - headerH);
    if (over <= 0) return;
    panel.style.setProperty('--doc-photo-h', `${Math.max(photo.offsetWidth, photo.offsetHeight - over - 1)}px`);
  }
  let fitRaf = 0;
  const refit = () => { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(() => { fitHeight(); updateArrows(); }); };
  window.addEventListener('resize', refit);
  new MutationObserver(refit).observe(document.documentElement, { attributes: true, attributeFilter: ['data-fs'] }); // 글자 크기 단계
  document.fonts?.ready.then(refit);

  /* ---------- 약력 팝업 (dialog: 포커스 가두기·ESC 닫기는 브라우저 기본 동작) ---------- */
  function show(p) {
    pos = (p + list.length) % list.length;
    const di = list[pos];
    profiles.forEach((el, i) => {
      const on = i === di;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-hidden', String(!on));
      el.inert = !on;
    });
    // 겸직 원장의 지점 표기는 지금 보고 있는 지점
    profiles[di].querySelector('[data-doc-branch]').textContent = BRANCH_NAME[branch];
    countEl.textContent = `${pos + 1} / ${list.length}`;
    box.scrollTop = 0;
  }
  function openModal(p, from) {
    opener = from;
    show(p);
    modal.classList.remove('is-closing');
    modal.showModal(); // 나타날 때: 딤·팝업이 서서히 (main.css .doc-modal 애니메이션)
    document.documentElement.classList.add('is-modal-open'); // 뒤 화면 스크롤 잠금
    modal.querySelector('[data-modal-close]').focus();
  }
  cardsEl.addEventListener('click', (e) => {
    const card = e.target.closest('.doc-card');
    if (card) openModal(Number(card.dataset.pos), card);
  });
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
  modal.querySelector('[data-modal-prev]').addEventListener('click', () => show(pos - 1));
  modal.querySelector('[data-modal-next]').addEventListener('click', () => show(pos + 1));
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); }); // 배경(딤) 클릭
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(pos - 1);
    if (e.key === 'ArrowRight') show(pos + 1);
  });
  modal.addEventListener('close', () => {
    document.documentElement.classList.remove('is-modal-open');
    // 팝업 안에서 다른 원장으로 넘겼다면 그 원장 카드로 포커스
    const card = cardsEl.querySelector(`.doc-card[data-pos="${pos}"]`) || opener;
    if (!card) return;
    card.focus({ preventScroll: true });
    card.parentElement.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  });

  /* ---------- 지점 탭 ---------- */
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
      // 좌우(위아래) 방향키 = 이전·다음 탭, Home·End = 처음·마지막 탭
      if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const next = e.key === 'Home' ? tabs[0] : e.key === 'End' ? tabs[tabs.length - 1]
        : tabs[(i + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      next.focus();
      selectTab(next);
    });
  });

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
