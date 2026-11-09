/* ==========================================================================
   서브페이지 동작 — <body data-page="..."> 값에 따라 필요한 것만 실행
   상담문의 폼([data-inquiry-form])은 어느 페이지에 있든 동작
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  const run = {
    doctors: renderDoctorsPage,
    clinic: renderClinic,
    treatment: renderTreatmentPage,
    notice: () => window.Board.list('notice'),
    news: () => window.Board.list('news'),
    cases: () => window.Board.list('cases'),
    'news-view': () => window.Board.view('news'),
    'notice-view': () => window.Board.view('notice'),
    'case-view': () => window.Board.view('cases'),
    faq: renderFaqList,
    fee: renderFeePage,
    contact: () => window.InquiryBoard?.init(), // 상담문의 목록 (inquiry.js)
  }[page];
  run?.();
  document.querySelectorAll('[data-inquiry-form]').forEach((f) => window.UI.inquiryForm(f)); // common.js
  initLoginReturn();
  document.querySelectorAll('[data-kakao-login]').forEach((btn) => btn.addEventListener('click', () => window.API.signInWithKakao(loginReturnUrl())));
});

/* ---------- 진료과목 6개 (treatment/*.html — scripts/content/build-treatments.js 가 만든 정적 HTML) ----------
   FAQ 아코디언(첫 번째는 HTML 에서 열린 상태) + '진료 연결' 지점 탭
   진료 연결: 탭 [창원점 | 마산점](지점 색은 탭 앞 점에만) → 선택 지점의 주소 · 전화(tel:) · 진료시간 · 버튼(상담문의 / 네이버예약 / 전화하기)
     담당 의료진 줄은 2026-11-09 뺌 (treatments.json specialties 는 데이터로만 남김) */
function renderTreatmentPage() {
  const faq = document.querySelector('[data-t-faq]');
  if (faq) window.UI.accordion(faq);
  /* 이미지 칸(추가 블록): [data-slot="treatment/implant/implant-photo-01"] → assets/images/ 아래 .webp → .jpg → .png 순서로 찾아 있으면 사진을 넣고,
     없으면 자리표시('파일명 · 권장 크기') 그대로 — 깨진 이미지 아이콘이 생기지 않게 미리 불러 본 뒤에만 넣는다
     파일 목록: docs/IMAGE-SLOTS.md */
  const root = document.documentElement.dataset.root || '.';
  const findImage = (base, exts) => new Promise((resolve) => {
    let i = 0;
    const next = () => {
      if (i >= exts.length) { resolve(null); return; }
      const src = `${root}/assets/images/${base}.${exts[i++]}`;
      const probe = new Image();
      probe.onload = () => resolve(src);
      probe.onerror = next;
      probe.src = src;
    };
    next();
  });
  document.querySelectorAll('[data-t-fold]').forEach(initTreatmentFold); // 먼저: 순환용 복제 카드의 이미지 칸도 함께 채우게
  document.querySelectorAll('[data-slot]').forEach(async (el) => {
    const src = await findImage(el.dataset.slot, ['webp', 'jpg', 'png']);
    if (!src) return;
    const img = document.createElement('img');
    img.src = src;
    img.alt = el.dataset.slotAlt || '';
    img.loading = 'lazy';
    el.appendChild(img);
    el.classList.add('is-loaded');
  });
  const sec = document.querySelector('[data-t-connect]');
  const box = sec?.querySelector('[data-t-connect-box]');
  const S = window.SITE;
  if (!box || !S) return;
  const { esc, telHref } = window.UI;
  const B = S.branches || [];
  const tabs = B.map((b, i) => `<button type="button" class="t-connect__tab" role="tab" id="t-tab-${b.id}" aria-controls="t-panel-${b.id}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''}><i class="t-connect__dot t-connect__dot--${b.id}" aria-hidden="true"></i>${esc(b.name)}</button>`).join('');
  const panel = (b, i) => {
    const booking = b.naverBooking || b.naverMap;
    return `<div class="t-connect__panel" role="tabpanel" id="t-panel-${b.id}" aria-labelledby="t-tab-${b.id}"${i ? ' hidden' : ''}>
      <dl class="t-connect__info">
        <div><dt>주소</dt><dd>${esc(b.address)}</dd></div>
        <div><dt>전화</dt><dd><a href="${telHref(b.tel)}">${esc(b.tel)}</a></dd></div>
        <div><dt>진료시간</dt><dd>${(b.hours || []).map((h) => `<span class="t-connect__hour">${esc(h.label)} ${esc(h.time)}</span>`).join('')}</dd></div>
      </dl>
      <p class="t-connect__btns">
        <a class="t-btn t-btn--fill" href="../faq/contact-write.html">상담문의</a>
        ${booking ? `<a class="t-btn" href="${esc(booking)}" target="_blank" rel="noopener">네이버예약</a>` : ''}
        <a class="t-btn" href="${telHref(b.tel)}">전화하기</a>
      </p>
    </div>`;
  };
  box.innerHTML = `<div class="t-connect__tabs" role="tablist" aria-label="지점 선택">${tabs}</div>${B.map(panel).join('')}`;
  const tabEls = [...box.querySelectorAll('[role="tab"]')];
  const select = (t, focus) => {
    tabEls.forEach((x) => { const on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; document.getElementById(x.getAttribute('aria-controls')).hidden = !on; });
    if (focus) t.focus();
  };
  tabEls.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      select(tabEls[(i + (e.key === 'ArrowRight' ? 1 : tabEls.length - 1)) % tabEls.length], true);
    });
  });
}

/* ---------- 진료과목 '이런 경우에도 상담해 보세요' 펼침형 갤러리 ([data-t-fold] — build-treatments.js, 모양: sub.css) ----------
   넘기기: 접힌 카드 클릭(그 카드가 가운데로) · 글자 탭 클릭 · 좌우 방향키(탭 위에서는 Home·End 도) — 순환: 6번 → 오른쪽 = 1번. 자동 넘김 없음
   데스크톱(1025px~): 줄 = 화면 전체 폭, 펼친 카드가 화면 가로 가운데
     무한 순환: 원본 6장 앞뒤에 복제 6장씩(총 18장, 가운데 6장 = 원본). pos = 펼친 카드의 줄 위치(0~17)
       이동은 가장 가까운 방향(탭·방향키: 최대 3칸, 접힌 카드 클릭: 그 카드 그대로) → 이동이 끝나면 같은 모습인 가운데(원본) 칸으로 몰래 옮김
     펼친 폭 --open-w = 콘텐츠 폭(.sub-layout 안쪽, LNB 포함 본문 전체) 75%, 최대 900px
     카드 높이: 기본 560px(1280px 이하 520px, sub.css) — 가장 긴 설명 칸이 넘치면 그만큼 늘림(--fold-h, 글자 크기는 그대로)
   1024px 이하: 가로 스와이프(scroll-snap, 복제 숨김). 탭 클릭 = 그 카드로 가로 스크롤, 스와이프 = 가장 가까운 카드로 탭 선택만 따라 바뀜 */
function initTreatmentFold(root) {
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const cards = [...root.querySelectorAll('.t-fold__card')];
  const viewport = root.querySelector('[data-t-fold-viewport]');
  const track = root.querySelector('[data-t-fold-track]');
  const tabList = root.querySelector('[role="tablist"]');
  if (!tabs.length || !viewport || !track) return;
  const N = cards.length;
  const body = root.closest('.sub-body') || root.parentElement;
  const layoutBox = root.closest('.sub-layout') || body;
  const mqDesk = window.matchMedia('(min-width: 1025px)');
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const px = (v) => parseFloat(v) || 0;

  // 복제: 앞 6장 · 뒤 6장 (id·역할 없음, 화면낭독기·탭 키 이동에서 제외 — 마우스 클릭은 됨)
  const makeClone = (c) => {
    const k = c.cloneNode(true);
    k.removeAttribute('id'); k.removeAttribute('role'); k.removeAttribute('aria-labelledby');
    k.classList.remove('is-open');
    k.dataset.clone = '';
    k.setAttribute('aria-hidden', 'true');
    k.querySelectorAll('button').forEach((x) => { x.tabIndex = -1; });
    return k;
  };
  track.prepend(...cards.map(makeClone));
  track.append(...cards.map(makeClone));
  const all = [...track.querySelectorAll('.t-fold__card')]; // 0~5 복제 · 6~11 원본 · 12~17 복제

  let pos = N; // 펼친 카드의 줄 위치 (가운데 칸 = 원본)
  let fold = true;
  let openW = 0;
  let settleTimer = 0;
  const index = () => ((pos % N) + N) % N;
  const offset = (k) => cards[k].offsetLeft - cards[0].offsetLeft;

  const place = () => { // 펼친 카드 가운데 = 화면 가운데
    const cs = getComputedStyle(root);
    const step = px(cs.getPropertyValue('--fold-closed')) + px(cs.getPropertyValue('--fold-gap'));
    root.style.setProperty('--fold-x', `${pos * step + openW / 2 - viewport.clientWidth / 2}px`);
  };
  const instant = (fn) => { // 전환 없이 즉시
    root.classList.add('is-measuring');
    fn();
    void track.offsetWidth;
    root.classList.remove('is-measuring');
  };
  const scrollTabIntoView = () => {
    const tab = tabs[index()];
    if (tabList.scrollWidth <= tabList.clientWidth) return;
    tabList.scrollTo({ left: tab.offsetLeft - tabList.firstElementChild.offsetLeft - (tabList.clientWidth - tab.offsetWidth) / 2, behavior: reduced() ? 'auto' : 'smooth' });
  };
  const mark = () => {
    const i = index();
    tabs.forEach((t, k) => { const on = k === i; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    all.forEach((c, k) => c.classList.toggle('is-open', fold ? k === pos : k === N + i));
    cards.forEach((c, k) => { const b = c.querySelector('.t-fold__body'); if ((fold && k + N === pos) || !fold) b.removeAttribute('aria-hidden'); else b.setAttribute('aria-hidden', 'true'); });
    scrollTabIntoView();
  };
  const settle = () => { // 이동이 끝나면 원본 칸으로 (모습은 같음)
    clearTimeout(settleTimer);
    if (pos >= N && pos < 2 * N) return;
    instant(() => { pos = N + index(); mark(); place(); });
  };
  const moveTo = (target, { focus = false } = {}) => { // target = 줄 위치(0~17)
    if (!fold) {
      pos = N + ((target % N) + N) % N;
      mark();
      viewport.scrollTo({ left: offset(index()), behavior: reduced() ? 'auto' : 'smooth' });
      if (focus) tabs[index()].focus();
      return;
    }
    if (target === pos) { if (focus) tabs[index()].focus(); return; }
    // 연달아 누를 때 끝 칸을 넘지 않게: 아직 가장자리 쪽이면 먼저 원본 칸으로
    if (target < 3 || target > 3 * N - 4) { const d = target - pos; settle(); target = pos + d; }
    pos = target;
    mark();
    place();
    if (focus) tabs[index()].focus();
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, reduced() ? 0 : 650);
  };
  const near = (i) => { // 탭·방향키: 가장 가까운 방향 (3칸 차이면 오른쪽)
    let d = (((i - index()) % N) + N) % N;
    if (d > N / 2) d -= N;
    return pos + d;
  };

  tabs.forEach((t, k) => t.addEventListener('click', (e) => moveTo(near(k), { focus: e.detail === 0 })));
  all.forEach((c, k) => c.querySelector('.t-fold__hit')?.addEventListener('click', (e) => moveTo(k, { focus: e.detail === 0 })));
  root.addEventListener('keydown', (e) => {
    const onTab = tabs.includes(e.target);
    let target;
    if (e.key === 'ArrowRight') target = pos + 1;
    else if (e.key === 'ArrowLeft') target = pos - 1;
    else if (e.key === 'Home' && onTab) target = near(0);
    else if (e.key === 'End' && onTab) target = near(N - 1);
    if (target === undefined || e.target.closest('.t-fold__body')) return;
    e.preventDefault();
    moveTo(target, { focus: onTab });
  });
  // 스와이프 → 스크롤이 멈추면 가장 가까운 카드로 탭 선택
  let timer = 0;
  viewport.addEventListener('scroll', () => {
    if (fold) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      const left = viewport.scrollLeft;
      let best = 0;
      cards.forEach((c, k) => { if (Math.abs(offset(k) - left) < Math.abs(offset(best) - left)) best = k; });
      if (best !== index()) { pos = N + best; mark(); }
    }, 80);
  }, { passive: true });

  const refresh = () => {
    instant(() => {
      fold = mqDesk.matches;
      root.classList.toggle('is-swipe', !fold);
      pos = N + index();
      if (fold) {
        const rect = body.getBoundingClientRect();
        root.style.setProperty('--fold-bleed-l', `${Math.max(0, rect.left)}px`);
        root.style.setProperty('--fold-bleed-r', `${Math.max(0, document.documentElement.clientWidth - rect.right)}px`);
        const ls = getComputedStyle(layoutBox);
        const contentW = layoutBox.clientWidth - px(ls.paddingLeft) - px(ls.paddingRight);
        openW = Math.round(Math.min(900, contentW * 0.75));
        root.style.setProperty('--open-w', `${openW}px`);
        root.style.removeProperty('--fold-h');
        const base = all[0].clientHeight;
        const need = Math.max(...cards.map((c) => c.querySelector('.t-fold__inner').offsetHeight + 80));
        if (need > base) root.style.setProperty('--fold-h', `${Math.ceil(need)}px`);
        mark();
        place();
      } else {
        ['--fold-bleed-l', '--fold-bleed-r', '--fold-x', '--fold-h', '--open-w'].forEach((v) => root.style.removeProperty(v));
        mark();
        viewport.scrollLeft = offset(index());
      }
    });
  };
  let rt = 0;
  window.addEventListener('resize', () => { cancelAnimationFrame(rt); rt = requestAnimationFrame(refresh); });
  document.fonts?.ready.then(refresh);
  refresh();
}

/* ---------- 로그인 후 돌아갈 곳 (member/login.html?return=community/case-view.html?id=case-18) ----------
   치료사례 상세의 '로그인 후 확인해보세요'가 return 을 붙여 보낸다. 사이트 안 주소(폴더/파일.html?…)만 받는다(다른 사이트로 보내기 방지)
   로그인 성공 후 이동은 서버 연결 때 — api.js signInWithKakao(returnUrl) · 이메일 로그인에서 이 주소로 보낼 것
   시안: 안내 문구 + '시안 확인용: 로그인한 것처럼 보기' 링크(그 글 + ?login=1 — api.js isLoggedIn) */
function loginReturnUrl() {
  const r = new URLSearchParams(location.search).get('return') || '';
  return /^(community|about|treatment|faq)\/[a-z-]+\.html(\?[\w=&%.-]*)?$/.test(r) ? `${document.documentElement.dataset.root || '.'}/${r}` : null;
}
function initLoginReturn() {
  const box = document.querySelector('[data-login-return]');
  const url = loginReturnUrl();
  if (!box || !url) return;
  box.innerHTML = `로그인하면 보시던 치료사례로 돌아갑니다. <a class="member__return-demo" href="${url}${url.includes('?') ? '&' : '?'}login=1">시안 확인용: 로그인한 것처럼 보기 →</a>`;
  box.hidden = false;
}

/** 페이지 안에서 내용이 바뀔 때 서서히 나타나기 (common.css .is-fade-in — 서브페이지 열 때와 같은 효과) */
function fadeIn(el) {
  if (!el) return;
  el.classList.remove('is-fade-in');
  void el.offsetWidth; // 다시 붙여도 애니메이션이 처음부터 돌게
  el.classList.add('is-fade-in');
  el.addEventListener('animationend', () => el.classList.remove('is-fade-in'), { once: true });
}

/* ---------- 의료진 소개 (about/doctors.html) ----------
   위: 소개 블록(doctors.html 에 직접 — 왼쪽 네이비 문구 | 오른쪽 원내 사진 흑백)
   지점별 묶음: [지점 색 작은 라벨 + '창원점 의료진'] 아래 원장 — 겸직 원장(김영우)은 두 지점 모두, 이름 아래 [창원점][마산점] 지점 색 태그 두 개
   원장(원장 사이 가는 가로선, 위아래 간격 일정): 모두 같은 방향(사진 왼쪽) — 2026-11-09 구조 변경
     [사진(크기 고정, 아래 끝 = 상자 아래 끝, 상자보다 높으면 위로 솟음) | 옅은 파랑 상자(높이 480px 고정, 넘치면 내용만큼)
        상자 안 위에서부터: 이름 52px 굵게 + 직함 ······ 학회·학교 로고(site-data.js logos)
                         진료과 태그(지점 색 면) + 주요 진료(site-data.js focus) + 겸직 지점 태그
                         (28~36px) 약력 1열(항목 4개 이상 = 2열, 왼쪽 열 먼저) — [이름~약력] 묶음 세로 가운데]
   약력: 지금 데이터 순서 그대로가 아니라 분류 순서 — 전문의 → 학력 → 경력 → 연수·학회 활동, 색·굵기는 모두 같음 (site-data.js SITE.classifyCareer · isTraining)
   사진: 원장별 보정값(site-data.js photoScale·photoOffsetY·photoOffsetX → --ps·--py·--px), 흰 배경 사진(photoBlend 켜진 원장)도 이 페이지에서는 multiply 를 쓰지 않음 — 흰 가운·얼굴로 상자 색이 비쳐서. 대신 .is-whitebg 가장자리만 녹임 (메인 의료진은 그대로 multiply)
     스타일: common.css '의료진 소개'. 1024px 이하 = 사진 위 · 정보 아래, 이름 36px, 약력 1열
   지점 이동 버튼(.doc-branch-nav): 화면 아래 고정 [창원점 N][마산점 N] — 누르면 그 지점 제목이 헤더 + 24px 아래에 오게 스크롤, 스크롤 위치로 현재 지점 표시(aria-current),
     배너 구간에서는 숨기고 의료진 목록에 들어오면 나타나며 푸터에 닿으면 사라짐. 주소 해시 #changwon / #masan 반영(이 주소로 들어오면 그 지점으로 바로) */
function renderDoctorsPage() {
  const box = document.querySelector('[data-doctors-page]');
  if (!box) return;
  const { esc, img } = window.UI;
  const S = window.SITE;
  const EN = { changwon: 'CHANGWON', masan: 'MASAN' };
  const groups = S.branches.map((b) => ({ b, docs: S.getDoctorsByBranch(b.id) }));
  /* 약력: 순서는 분류 순서 — 전문의 → 학력 → 경력 → 연수 → 학회 활동. 글자 색·굵기는 모두 같음
     (2026-11-09 예전 '전문의·학력·경력 = 네이비 굵게 / 연수·학회 = 기본' 구분 삭제)
     항목 4개 이상 = 2열(.is-2col): 왼쪽 열을 위→아래로 먼저 채우고 오른쪽 열로 (행 수 = 올림(항목 ÷ 2) → --career-rows, grid-auto-flow: column). 3개 이하 = 1열
     행 수(1열 = 항목 수, 2열 = 왼쪽 열 항목 수)로 크기 단계: 3행 이하 rows-s · 4~5행 rows-m · 6행 이상 rows-l (article 클래스, common.css) */
  const CAREER_2COL_MIN = 4;
  const careerOf = (d) => {
    const by = { cert: [], edu: [], career: [], training: [], society: [] };
    (d.career || []).forEach((c) => { const k = S.classifyCareer(c); by[k === 'career' && S.isTraining(c) ? 'training' : k].push(c); });
    const all = [...by.cert, ...by.edu, ...by.career, ...by.training, ...by.society].map((c) => `<li>${esc(c)}</li>`);
    const two = all.length >= CAREER_2COL_MIN;
    const rows = two ? Math.ceil(all.length / 2) : all.length;
    return { rows, html: `<div class="doctor-profile__career${two ? ' is-2col' : ''}"><ul class="doctor-profile__list" style="--career-rows:${rows}">${all.join('')}</ul></div>` };
  };
  const rowsClass = (rows) => (rows <= 3 ? 'rows-s' : rows <= 5 ? 'rows-m' : 'rows-l');
  box.innerHTML = groups.map(({ b, docs }) => `
    <section class="doctor-group" id="${b.id}" data-branch="${b.id}" aria-labelledby="doctor-group-${b.id}">
      <div class="doctor-group__head">
        <p class="doctor-group__label" aria-hidden="true">${EN[b.id] || ''}</p>
        <h2 class="doctor-group__title" id="doctor-group-${b.id}"><span class="text-${b.id}">${esc(b.name)}</span> 의료진</h2>
      </div>
      <div class="doctor-profiles">
        ${docs.map((d) => {
          /* 사진 크롭 (site-data.js staffCrop — 김영우 원장 구도 기준, 메인 의료진 값과 따로)
             사진 틀 = 높이 --ph0 고정, 상자 아래 끝에 붙음. 사진 높이 = 틀 × scale, 정수리(y)를 틀 위 끝에, 얼굴 가운데(x)를 틀 가운데에. 아래는 틀 아래 끝에서 잘림 */
          const c = d.staffCrop || {};
          const ht = Math.min(0.4, Math.max(0, Number(c.y ?? d.photoHeadTop) || 0));
          const fix = `--cs:${Number(c.scale) || (1 / (1 - ht)).toFixed(4)};--cx:${Number(c.x) || 0.5};--cy:${ht}`;
          const both = d.branches.length > 1;
          const logos = (d.logos || []).filter((l) => l && l.src);
          const car = (d.career || []).length ? careerOf(d) : null;
          return `
          <article class="doctor-profile ${rowsClass(car ? car.rows : 0)}" id="${b.id}-${S.doctorSlug(d)}" style="${fix}">
            <div class="doctor-profile__box">
            <div class="doctor-profile__head">
              <div class="doctor-profile__id">
                <h3 class="doctor-profile__name"><strong>${esc(d.name)}</strong> <span>${esc(d.title)}</span></h3>
                <p class="doctor-profile__tags">${d.dept ? `<span class="doctor-profile__dept">${esc(d.dept)}</span>` : ''}${d.focus ? `<span class="doctor-profile__focus">${esc(d.focus)}</span>` : ''}${both ? `<span class="doctor-profile__both">${d.branches.map((id) => `<span class="doctor-profile__branch" data-branch="${id}">${esc(S.branches.find((x) => x.id === id)?.name || id)}</span>`).join('')}<span class="sr-only">겸직</span></span>` : ''}</p>
              </div>
              ${logos.length ? `<ul class="doctor-profile__logos">${logos.map((l) => `<li><img src="${img(l.src)}" alt="${esc(l.alt || '')}" loading="lazy"></li>`).join('')}</ul>` : ''}
            </div>
            ${car ? car.html : ''}
            </div>
            <div class="doctor-profile__photo${d.photoBlend === false ? '' : ' is-whitebg'}"><img class="doctor-profile__img" src="${img(String(d.photo || '').replace(/\.[a-z]+$/i, '-cut.png'))}" alt="${esc(d.name)} ${esc(d.title)} 사진" loading="lazy"></div>
          </article>`;
        }).join('')}
      </div>
    </section>`).join('');
  box.querySelectorAll('.doctor-profile__img').forEach((im) => im.addEventListener('error', () => im.classList.add('is-missing'), { once: true }));
  /* 이 페이지 가로 배치 (1025px 이상): 위쪽 [LNB | 경로·제목·소개 블록] 묶음과 원장 목록이 같은 가운데·같은 폭
     좌우 여백 --doc-side = max(퀵메뉴와 32px 띄울 만큼, (화면 - 1600px) ÷ 2) — 왼쪽 = 오른쪽, 최대 너비 1600px (common.css '.page-doctors .sub-layout' · '.doc-list')
     1024px 이하는 쓰지 않음(일반 여백) */
  const root = document.documentElement;
  const DOC_MAX = 1600;
  const setDocRight = () => {
    const q = document.querySelector('.quick--float');
    const qr = q && window.innerWidth > 1024 ? q.getBoundingClientRect() : null;
    if (qr && qr.width) {
      const cw = root.clientWidth;
      root.style.setProperty('--doc-side', `${Math.round(Math.max(cw - qr.left + 32, (cw - DOC_MAX) / 2))}px`);
    } else root.style.removeProperty('--doc-side');
  };
  /* 약력이 길면 상자는 내용대로 길어지고 사진 칸도 따라 길어지지만, 사진은 크기 고정(--ph0 기준) + 칸 아래 끝에 붙음 — 늘어난 만큼 위가 빈다 (common.css)
     (2026-11-09 예전 .is-short 사진 아래 녹이기 삭제 — 사진이 항상 상자 아래 끝까지 닿아 필요 없음) */
  const layout = () => { setDocRight(); };
  layout();
  window.addEventListener('resize', layout);
  new MutationObserver(layout).observe(root, { attributes: true, attributeFilter: ['data-fs'] }); // 글자 크기 단계 → 퀵메뉴 폭·약력 길이가 바뀜
  document.addEventListener('components:loaded', layout); // 퀵메뉴(include)가 들어온 뒤
  window.addEventListener('load', layout, { once: true });
  document.fonts?.ready.then(layout); // 웹폰트가 늦게 적용되면 약력 줄 수가 바뀜
  initDoctorBranchNav(groups);
}

function initDoctorBranchNav(groups) {
  const sections = groups.map(({ b }) => document.getElementById(b.id)).filter(Boolean);
  if (!sections.length) return;
  const { esc } = window.UI;
  const nav = document.createElement('nav');
  nav.className = 'doc-branch-nav';
  nav.setAttribute('aria-label', '지점별 의료진 바로가기');
  nav.innerHTML = groups.map(({ b, docs }) => `<a class="doc-branch-nav__btn" href="#${b.id}" data-branch="${b.id}">${esc(b.name)} <span class="doc-branch-nav__n">${docs.length}</span></a>`).join('');
  document.body.appendChild(nav); // main 안에 두면 서브페이지 등장 효과(opacity) 동안 쌓임 순서가 흔들릴 수 있어 body 바로 아래
  const btns = [...nav.querySelectorAll('[data-branch]')];
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const headerH = () => parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 0;
  const topOf = (sec) => sec.getBoundingClientRect().top + window.scrollY - headerH() - 24; // 지점 제목이 헤더 + 24px 아래
  let lockUntil = 0; // 버튼으로 부드럽게 스크롤하는 동안은 누른 지점을 현재로 고정 (지나가는 지점으로 깜빡이지 않게)
  let current = '';

  const setCurrent = (id) => {
    if (id === current) return;
    current = id;
    btns.forEach((a) => { if (a.dataset.branch === id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  };
  // 가로 위치: 본문(.sub-body) 가운데. 모바일에서 오른쪽 아래 '+' 버튼과 겹치면 왼쪽으로 비킨다
  function place() {
    const body = (document.querySelector('.doc-list [data-doctors-page]') || document.querySelector('.sub-body'))?.getBoundingClientRect(); // 원장 목록 가운데 (= 화면 가운데, 여백이 좌우 같음)
    if (!body) return;
    let x = body.left + body.width / 2;
    const plus = document.querySelector('.quick__toggle');
    const pr = plus && getComputedStyle(plus).display !== 'none' ? plus.getBoundingClientRect() : null;
    const half = nav.offsetWidth / 2;
    if (pr && pr.width && x + half > pr.left - 12) x = Math.max(half + 8, pr.left - 12 - half);
    nav.style.setProperty('--nav-x', `${Math.round(x)}px`);
  }
  function update() {
    const y = window.scrollY;
    // 현재 지점: 지점 묶음 위 끝이 (헤더 아래) 화면 40% 선을 지났는지
    const line = y + headerH() + window.innerHeight * 0.4;
    let id = sections[0].id;
    sections.forEach((s) => { if (s.getBoundingClientRect().top + y <= line) id = s.id; });
    if (Date.now() > lockUntil) setCurrent(id);
    // 보이기: 의료진 목록 위 끝이 화면 가운데(50%) 선 위로 올라왔고 (배너 구간·첫 화면에서는 숨김), 푸터 위 끝이 버튼 아래 끝 + 16px 보다 아래일 때
    const listTop = sections[0].getBoundingClientRect().top;
    const footer = document.querySelector('.footer');
    const navBottom = window.innerHeight - (parseFloat(getComputedStyle(nav).bottom) || 32);
    const footerHit = footer && footer.getBoundingClientRect().top < navBottom + 16;
    nav.classList.toggle('is-visible', listTop < window.innerHeight * 0.5 && !footerHit);
  }
  function go(id, { smooth = true } = {}) {
    const sec = document.getElementById(id);
    if (!sec) return;
    setCurrent(id);
    const anim = smooth && !reduce.matches;
    lockUntil = anim ? Date.now() + 1000 : 0;
    window.scrollTo({ top: Math.max(0, topOf(sec)), behavior: anim ? 'smooth' : 'instant' });
  }
  nav.addEventListener('click', (e) => {
    const a = e.target.closest('[data-branch]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    history.replaceState(null, '', `#${a.dataset.branch}`);
    go(a.dataset.branch);
  });
  // 스크롤로 지점이 바뀌면 주소 해시도 맞춘다 (뒤로가기 기록은 남기지 않음, 원장 카드 해시 #changwon-lee-eunju 는 건드리지 않음)
  let hashTimer = 0;
  const syncHash = () => {
    clearTimeout(hashTimer);
    hashTimer = setTimeout(() => {
      if (!nav.classList.contains('is-visible') || !current || location.hash === `#${current}` || /^#(changwon|masan)-/.test(location.hash)) return;
      history.replaceState(null, '', `#${current}`);
    }, 250);
  };
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); syncHash(); });
  }, { passive: true });
  window.addEventListener('resize', () => { place(); update(); });
  document.addEventListener('components:loaded', () => { place(); update(); });
  // 처음 위치: #changwon / #masan → 그 지점 바로, #changwon-lee-eunju(메인 '의료진 자세히 보기') → 그 원장 카드
  const hash = decodeURIComponent(location.hash.slice(1));
  requestAnimationFrame(() => {
    place();
    if (groups.some(({ b }) => b.id === hash)) go(hash, { smooth: false });
    else if (hash) {
      const el = document.getElementById(hash);
      if (el) window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - headerH() - 24), behavior: 'instant' });
    }
    update();
  });
}

/* ---------- 병원소개 (about/clinic.html) = 예전 병원 둘러보기 + 오시는길 ----------
   지점 탭(창원점·마산점): 선택한 지점 패널만 보이고 주소 해시가 #changwon / #masan 으로 바뀐다(직접 링크·뒤로가기 가능)
   패널마다 ① 지점명 ② 내부 둘러보기(갤러리 + 라이트박스) ③ 오시는길(카카오맵 + 주소·전화·이메일·진료시간) ④ 교통·주차 안내
   지도: .loc__map 안의 카카오맵 '지도 퍼가기' 코드는 페이지를 읽는 동안 실행돼야 해서 HTML 에 그대로 둔다(API 키 불필요).
   숨긴 패널은 display:none 이 아니라 화면 밖에 같은 너비로 두므로(sub.css .clinic-panel) 지도가 처음부터 제 크기로 그려지고,
   탭이 열릴 때 relayout(지도 다시 맞추기)도 한 번 더 한다 */
function renderClinic() {
  const DAY_LABEL = { 토: '토요일', 일: '일요일' }; // 오시는길 진료시간 — 요일 라벨을 '토요일'처럼 풀어 쓴다 (site-data.js hours.label 은 다른 곳에서 짧게 씀)
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
          <dt>주소</dt><dd class="loc__lines">${(b.addressLines || [b.address]).map((l, i, arr) => `<strong class="loc__line">${esc(l)}${i === arr.length - 1 && b.addressNote ? ` (${esc(b.addressNote)})` : ''}</strong>`).join('')}${b.landmark ? `<span class="loc__line loc__sub">${esc(b.landmark)}</span>` : ''}</dd>
          <dt class="loc__dt--mid">전화</dt><dd><a class="loc__tel" href="${telHref(b.tel)}">${esc(b.tel)}</a></dd>
          <dt>이메일</dt><dd>${esc(b.email)}</dd>
          <dt>진료시간</dt><dd class="loc__lines">${b.hours.map((x) => `<span class="loc__line loc__hour${/휴진/.test(x.time) ? ' is-off' : ''}"><span class="loc__day">${esc(DAY_LABEL[x.label] || x.label)}</span><span class="loc__time">${esc(x.time)}</span></span>`).join('')}</dd>
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
/* ---------- 커뮤니티 게시판 (치과소식·공지사항·치료사례 목록 + 상세) — assets/js/board.js ---------- */

/* ---------- 자주 묻는 질문 ---------- */
/* FAQ 게시판 — 카테고리(자주 찾는 질문 = featured) + 검색(질문+답변 즉시 필터) + 아코디언
   카테고리 이름은 assets/data/faq.json 의 category 값과 같아야 한다 */
const FAQ_CATS = ['자주 찾는 질문', '전체', '임플란트', '치아교정', '일반치료', '사랑니·스케일링', '심미치료', '진료·예약', '비용'];
async function renderFaqList() {
  const box = document.querySelector('[data-faq-list]');
  if (!box) return;
  const catsEl = document.querySelector('[data-faq-cats]');
  const catsWrap = document.querySelector('[data-faq-cats-wrap]');
  const countEl = document.querySelector('[data-faq-count]');
  // 칩 줄이 넘칠 때: 오른쪽 끝 흐림(.is-fade-end) — 끝까지 밀면 없앰. 선택한 칩은 보이게 스크롤
  function fadeEdge() {
    const over = catsWrap.scrollWidth > catsWrap.clientWidth + 1;
    catsWrap.classList.toggle('is-fade-end', over && catsWrap.scrollLeft + catsWrap.clientWidth < catsWrap.scrollWidth - 2);
    catsWrap.classList.toggle('is-fade-start', over && catsWrap.scrollLeft > 2);
  }
  catsWrap.addEventListener('scroll', fadeEdge, { passive: true });
  window.addEventListener('resize', fadeEdge);
  new ResizeObserver(fadeEdge).observe(catsWrap); // 글자 크기 단계 바뀔 때도
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

  const inCat = (c, list) => (c === '자주 찾는 질문' ? list.filter((r) => r.featured) : c === '전체' ? list : list.filter((r) => r.category === c));
  // 분류 칩 (커뮤니티 게시판 분류 칩과 같은 .board-cats__btn) — 옆 숫자 = 지금 검색어 기준 질문 수
  function drawCats(found) {
    catsEl.innerHTML = FAQ_CATS.map((c) => `<li><button type="button" class="board-cats__btn" data-faq-cat="${esc(c)}" aria-pressed="${c === cat}">${esc(c)} <span class="board-cats__n">${inCat(c, found).length}</span></button></li>`).join('');
  }
  function draw() {
    const q = search.value.trim().toLowerCase();
    const found = q ? rows.filter((r) => `${r.question} ${r.answer || ''}`.toLowerCase().includes(q)) : rows;
    const list = inCat(cat, found);
    drawCats(found);
    countEl.innerHTML = `총 <b>${list.length}</b>개 질문`; // 현재 분류·검색 기준
    fadeEdge();
    box.innerHTML = list.length
      ? list.map(item).join('')
      : `<li class="faq-list__empty">${q ? '검색 결과가 없습니다.' : '등록된 질문이 없습니다.'}</li>`;
  }

  drawCats(rows);
  catsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-faq-cat]');
    if (!btn) return;
    cat = btn.dataset.faqCat;
    draw();
    const cur = catsEl.querySelector(`[data-faq-cat="${CSS.escape(cat)}"]`);
    cur?.focus({ preventScroll: true }); // 칩을 다시 그려도 키보드 위치 유지
    if (cur) { const r = cur.getBoundingClientRect(), w = catsWrap.getBoundingClientRect(); if (r.left < w.left || r.right > w.right) catsWrap.scrollBy({ left: r.left < w.left ? r.left - w.left - 24 : r.right - w.right + 24, behavior: 'smooth' }); }
    fadeIn(box);
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

/* ---------- 비급여 진료비용 (fee.html) ----------
   데이터: assets/data/fee.json (api.js getFees) — 원본 수가표 순서 그대로, duplicate(원본 인쇄 중복 행)·hidden(내부 관리용 행)은 숨김
   분류 칩 = 상세구분(categories 순서, 앞에 '전체') · 검색 = 수가명 · '금액 표기 항목만' 체크(기본 켬 — fee.html checked, 끄면 전체) · 칩 숫자도 체크·검색 기준
   표 하나로 그린다: PC = 표, 모바일(768px 이하) = 같은 표를 카드 모양으로(sub.css) · 인쇄 = 지금 보이는 행만 표로(@media print)
   원본 수가표: 압축본 12장 썸네일 → 누르면 크게 보기(라이트박스, 이전·다음·Esc) */
async function renderFeePage() {
  const root = document.querySelector('[data-fee]');
  if (!root) return;
  const { esc } = window.UI;
  const $ = (sel) => root.querySelector(sel);
  const body = $('[data-fee-body]');
  const catsEl = $('[data-fee-cats]');
  const countEl = $('[data-fee-count]');
  const scopeEl = $('[data-fee-scope]');
  const search = $('[data-fee-search]');
  const only = $('[data-fee-only]');
  const ALL = '전체';
  let data = null;
  let rows = [];
  let cat = ALL;

  const won = (n) => Number(n).toLocaleString('ko-KR');
  // 금액 표기: 범위(min~max) > 원본 표기(amountText, 쉼표 포함 그대로) > 없음
  const amountHtml = (r) => {
    if (r.min != null && r.max != null) return `${won(r.min)}~${won(r.max)}<span class="fee-table__won">원</span>`;
    if (r.amountText) return `${esc(r.amountText)}<span class="fee-table__won">원</span>`;
    return '<span class="fee-table__none" aria-hidden="true">–</span><span class="sr-only">금액 표기 없음</span>';
  };
  const hasAmount = (r) => !!r.amountText || r.min != null;
  const row = (r) => `
    <tr>
      <td class="fee-table__name"><span class="fee-table__title">${esc(r.name)}</span><span class="fee-table__code">${esc(r.code)}</span></td>
      <td class="fee-table__cat">${esc(r.category)}</td>
      <td class="fee-table__unit">${esc(r.unit)}</td>
      <td class="fee-table__amount${hasAmount(r) ? '' : ' is-none'}">${amountHtml(r)}</td>
    </tr>`;

  function filtered() {
    const q = search.value.trim().toLowerCase();
    let list = q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows;
    if (only.checked) list = list.filter(hasAmount);
    return list;
  }
  function draw() {
    const found = filtered();
    const list = cat === ALL ? found : found.filter((r) => r.category === cat);
    const cats = [ALL, ...data.categories];
    catsEl.innerHTML = cats.map((c) => `<li><button type="button" class="board-cats__btn" data-fee-cat="${esc(c)}" aria-pressed="${c === cat}">${esc(c)} <span class="board-cats__n">${c === ALL ? found.length : found.filter((r) => r.category === c).length}</span></button></li>`).join('');
    countEl.innerHTML = `총 <b>${list.length}</b>개 항목`;
    const q = search.value.trim();
    scopeEl.textContent = `인쇄 범위: ${cat}${q ? ` · 수가명 '${q}'` : ''}${only.checked ? ' · 금액 표기 항목만' : ''} — ${list.length}개 항목 · 기준일 ${data.baseDateLabel}`;
    body.innerHTML = list.length
      ? list.map(row).join('')
      : `<tr><td colspan="4" class="fee-table__empty">${q ? '검색 결과가 없습니다.' : '해당 항목이 없습니다.'}</td></tr>`;
  }

  catsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-fee-cat]');
    if (!btn) return;
    cat = btn.dataset.feeCat;
    draw();
    catsEl.querySelector(`[data-fee-cat="${CSS.escape(cat)}"]`)?.focus({ preventScroll: true }); // 칩을 다시 그려도 키보드 위치 유지
  });
  search.addEventListener('input', draw);
  only.addEventListener('change', draw);
  $('[data-fee-search-form]').addEventListener('submit', (e) => e.preventDefault());
  $('[data-fee-print]').addEventListener('click', () => window.print());

  try {
    data = await window.API.getFees();
    rows = data.items.filter((r) => !r.duplicate && !r.hidden); // 원본 인쇄 중복 행 · 내부 관리용 행(hidden) 은 화면·인쇄에서 뺀다
    $('[data-fee-date]').textContent = data.baseDateLabel;
    draw();
    renderFeeOrigin(root, data);
  } catch (err) {
    console.error(err);
    body.innerHTML = '<tr><td colspan="4" class="fee-table__empty">비급여 진료비용을 불러오지 못했습니다.</td></tr>';
  }
}

/* 원본 수가표 썸네일 + 라이트박스 (fee.html) — 썸네일 fee-NN-thumb.jpg, 크게 보기 fee-NN.jpg */
function renderFeeOrigin(root, data) {
  const list = root.querySelector('[data-fee-origin]');
  const rootPath = document.documentElement.dataset.root || '.';
  const imgs = (data.source?.images || []).map((p) => `${rootPath}/${p}`);
  const total = imgs.length;
  root.querySelector('[data-fee-origin-sub]').textContent = `(${data.baseDateLabel} 스캔본 ${total}장)`;
  list.innerHTML = imgs.map((src, i) => `
    <li><button type="button" class="fee-origin__item" data-index="${i}" aria-label="원본 수가표 ${i + 1} / ${total} 크게 보기">
      <img src="${src.replace(/\.jpg$/, '-thumb.jpg')}" width="360" height="509" alt="" loading="lazy" decoding="async">
      <span class="fee-origin__no">${i + 1} / ${total}</span>
    </button></li>`).join('');

  const box = document.createElement('div');
  box.className = 'lightbox fee-lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', '원본 수가표 크게 보기');
  box.tabIndex = -1;
  box.innerHTML = `
    <figure class="lightbox__figure"><img class="lightbox__img" alt=""><figcaption class="lightbox__cap"></figcaption></figure>
    <button type="button" class="lightbox__btn lightbox__close" aria-label="닫기"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 5l14 14M19 5L5 19"/></svg></button>
    <button type="button" class="lightbox__btn lightbox__prev" aria-label="이전 장"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 5l-7 7 7 7"/></svg></button>
    <button type="button" class="lightbox__btn lightbox__next" aria-label="다음 장"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></button>`;
  document.body.appendChild(box);
  const img = box.querySelector('.lightbox__img');
  const cap = box.querySelector('.lightbox__cap');
  let index = 0;
  let opener = null;
  function open(i) {
    index = (i + total) % total;
    img.src = imgs[index];
    img.alt = `원본 비급여 수가표 ${index + 1} / ${total}`;
    cap.innerHTML = `원본 수가표 ${index + 1} / ${total} · <a href="${imgs[index]}" target="_blank" rel="noopener">새 창에서 원본 크기로 보기</a>`;
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
  list.addEventListener('click', (e) => {
    const item = e.target.closest('.fee-origin__item');
    if (!item) return;
    opener = item;
    open(Number(item.dataset.index));
  });
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
