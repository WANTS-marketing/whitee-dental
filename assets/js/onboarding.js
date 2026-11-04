/* ==========================================================================
   메인 첫 방문 이용 안내(코치마크) — PC(1025px 이상) 메인 페이지 전용
   - 첫 방문 1회만 자동 표시 (localStorage 'witee-onboarding-seen'), 헤더 '이용 안내' 로 다시 보기
   - 히어로 첫 진입 애니메이션이 끝난 뒤(main.js 'hero:introend') 0.8초 후 시작
   - 화면 전체 딤 + 대상만 둥글게 뚫은 강조(.coach__spot 의 큰 box-shadow) + 옆 말풍선
   - 클릭 막기: 강조 영역 바깥 네 칸(.coach__block)만 클릭을 받아 닫는다
     → 1단계는 강조 영역 안 '가' 버튼을 그대로 누를 수 있고, 2단계는 강조 영역도 막는다(.coach__cover)
   스타일: main.css '이용 안내(코치마크)'
   ========================================================================== */
(function () {
  const KEY = 'witee-onboarding-seen';
  const START_DELAY = 800;
  const GAP = 16;    // 강조 영역 ↔ 말풍선 간격 (꼬리 포함)
  const EDGE = 16;   // 말풍선이 화면 가장자리에서 떨어지는 최소 거리
  const PAD = 8;     // 대상 요소 바깥으로 강조 영역을 넓히는 여백
  const root = document.documentElement.dataset.root || '.';
  const pc = window.matchMedia('(min-width: 1025px)');

  const STEPS = [
    {
      // 헤더 '가 가 가' (모바일 메뉴 안의 같은 버튼은 제외)
      targets: () => [...document.querySelectorAll('.util .fs-ctrl__btn')],
      pad: 6,
      place: 'bottom',
      allowClick: true,
      title: '글씨가 작게 보이시나요?',
      text: '여기를 누르면 홈페이지 글씨를 크게 볼 수 있어요.',
    },
    {
      // 퀵바 왼쪽 '빠른 진료 안내' 블록 + 진료 아이콘 카드
      // 카드도 따로 넣는다 — 좁은 화면·큰 글자에서 카드가 목록 칸 밖으로 넘칠 때도 다 감싸도록
      targets: () => [document.querySelector('.clinic-bar__head'), document.querySelector('.clinic-bar__list'), ...document.querySelectorAll('.clinic-bar__card')],
      arrowTo: () => document.querySelector('.clinic-bar__head'),
      pad: 12,
      place: 'top',
      allowClick: false,
      title: '진료가 급하신가요?',
      text: '원하시는 진료를 바로 선택하거나, 빠른 상담을 남겨주시면 확인 후 바로 연락드립니다.',
      last: true,
    },
  ];

  let el = null;       // 오버레이 루트
  let step = -1;
  let lastFocus = null;

  const seen = () => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } };
  const markSeen = () => { try { localStorage.setItem(KEY, '1'); } catch (e) { /* 저장 불가 — 이번만 표시 */ } };

  function build() {
    el = document.createElement('div');
    el.className = 'coach';
    el.innerHTML = `
      <div class="coach__spot" aria-hidden="true"></div>
      <div class="coach__block" data-coach-close aria-hidden="true"></div>
      <div class="coach__block" data-coach-close aria-hidden="true"></div>
      <div class="coach__block" data-coach-close aria-hidden="true"></div>
      <div class="coach__block" data-coach-close aria-hidden="true"></div>
      <div class="coach__cover" data-coach-close aria-hidden="true"></div>
      <div class="coach__tip" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="coach-title" aria-describedby="coach-text">
        <span class="coach__arrow" aria-hidden="true"></span>
        <h2 class="coach__title" id="coach-title"></h2>
        <p class="coach__text" id="coach-text"></p>
        <div class="coach__foot">
          <span class="coach__count"></span>
          <button type="button" class="coach__skip" data-coach-close>건너뛰기</button>
          <div class="coach__btns"></div>
        </div>
      </div>`;
    document.body.appendChild(el);
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-coach-close]')) close();
      else if (e.target.closest('[data-coach-next]')) show(step + 1);
    });
    el.addEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    // 포커스를 말풍선 안에서만 돌린다
    const items = [...el.querySelectorAll('.coach__tip button, .coach__tip a')].filter((n) => n.offsetParent);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (document.activeElement === el.querySelector('.coach__tip')) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return; } // 말풍선 자체에 포커스가 있을 때
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  // 말풍선 밖으로 포커스가 나가면(ex. '가' 버튼 클릭) 되돌린다 — 키보드 사용자는 말풍선에 머문다
  function onFocusIn(e) {
    if (!el || el.contains(e.target)) return;
    if (STEPS[step] && STEPS[step].allowClick && e.target.closest('.util .fs-ctrl')) return; // 마우스로 '가' 누른 경우는 허용
    el.querySelector('.coach__tip')?.focus({ preventScroll: true });
  }

  function unionRect(nodes, pad) {
    const rs = nodes.filter(Boolean).map((n) => n.getBoundingClientRect()).filter((r) => r.width || r.height);
    if (!rs.length) return null;
    const left = Math.min(...rs.map((r) => r.left)) - pad;
    const top = Math.min(...rs.map((r) => r.top)) - pad;
    const right = Math.max(...rs.map((r) => r.right)) + pad;
    const bottom = Math.max(...rs.map((r) => r.bottom)) + pad;
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  }

  function position() {
    if (!el || step < 0) return;
    const s = STEPS[step];
    const r = unionRect(s.targets(), s.pad);
    if (!r) { close(); return; }
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const px = (v) => `${Math.round(v)}px`;

    const spot = el.querySelector('.coach__spot');
    Object.assign(spot.style, { left: px(r.left), top: px(r.top), width: px(r.width), height: px(r.height) });
    // 강조 영역 바깥 네 칸 (위 · 아래 · 왼쪽 · 오른쪽)
    const [bt, bb, bl, br] = el.querySelectorAll('.coach__block');
    Object.assign(bt.style, { left: 0, top: 0, width: '100%', height: px(Math.max(0, r.top)) });
    Object.assign(bb.style, { left: 0, top: px(r.bottom), width: '100%', height: px(Math.max(0, vh - r.bottom)) });
    Object.assign(bl.style, { left: 0, top: px(r.top), width: px(Math.max(0, r.left)), height: px(r.height) });
    Object.assign(br.style, { left: px(r.right), top: px(r.top), width: px(Math.max(0, vw - r.right)), height: px(r.height) });
    const cover = el.querySelector('.coach__cover');
    cover.hidden = s.allowClick;
    Object.assign(cover.style, { left: px(r.left), top: px(r.top), width: px(r.width), height: px(r.height) });

    // 말풍선: 기준 요소 가운데에 꼬리, 화면 밖으로 나가지 않게 좌우 보정
    const tip = el.querySelector('.coach__tip');
    const arrow = el.querySelector('.coach__arrow');
    const a = s.arrowTo ? s.arrowTo().getBoundingClientRect() : r;
    const ax = a.left + a.width / 2;
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    let left = s.arrowTo ? r.left : ax - tw / 2;  // 2단계는 강조 영역 왼쪽 끝선에 맞춤
    left = Math.min(Math.max(left, EDGE), vw - EDGE - tw);
    // 정해진 쪽에 자리가 모자라면 반대쪽으로
    let place = s.place;
    if (place === 'top' && r.top - GAP - th < EDGE) place = 'bottom';
    else if (place === 'bottom' && r.bottom + GAP + th > vh - EDGE && r.top - GAP - th >= EDGE) place = 'top';
    let top = place === 'top' ? r.top - GAP - th : r.bottom + GAP;
    top = Math.min(Math.max(top, EDGE), vh - EDGE - th);
    tip.dataset.place = place;
    tip.style.left = px(left);
    tip.style.top = px(top);
    arrow.style.left = px(Math.min(Math.max(ax - left, 24), tw - 24));
  }

  function show(i) {
    if (i >= STEPS.length) { close(); return; }
    step = i;
    const s = STEPS[i];
    // 대상이 화면 안에 다 보이게 (2단계 퀵바가 낮은 화면에서 잘릴 때)
    const r = unionRect(s.targets(), s.pad);
    if (!r) { close(); return; }
    const vh = window.innerHeight;
    if (r.bottom > vh - EDGE) window.scrollBy({ top: r.bottom - vh + EDGE, behavior: 'instant' });

    const tip = el.querySelector('.coach__tip');
    el.querySelector('.coach__title').textContent = s.title;
    el.querySelector('.coach__text').textContent = s.text;
    const count = el.querySelector('.coach__count');
    count.innerHTML = `<span class="sr-only">전체 ${STEPS.length}단계 중 </span><strong>${i + 1}</strong><span aria-hidden="true"> / ${STEPS.length}</span><span class="sr-only">단계</span>`;
    el.querySelector('.coach__skip').hidden = !!s.last; // 마지막 단계는 '확인'이 곧 닫기
    el.querySelector('.coach__btns').innerHTML = s.last
      ? `<a class="coach__btn coach__btn--line" href="${root}/faq/contact.html" data-coach-done>빠른 상담 신청</a>
         <button type="button" class="coach__btn" data-coach-close>확인</button>`
      : '<button type="button" class="coach__btn" data-coach-next>다음</button>';
    el.querySelector('[data-coach-done]')?.addEventListener('click', () => close({ keepPage: true }));

    // 단계 전환 연출 (움직임 줄이기면 CSS 에서 생략)
    tip.classList.remove('is-in');
    position();
    void tip.offsetWidth;
    tip.classList.add('is-in');
    tip.focus({ preventScroll: true }); // 말풍선 자체로(테두리 없음) — 마우스로 열거나 넘길 때 버튼에 포커스 테두리가 보이지 않게, 키보드는 Tab 으로 버튼
  }

  function open() {
    if (!pc.matches || el) return;
    markSeen();
    lastFocus = document.activeElement;
    build();
    document.documentElement.classList.add('is-coach');
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, { passive: true });
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('click', onFsClick, true);
    show(0);
    requestAnimationFrame(() => el && el.classList.add('is-open'));
  }

  // 글자 크기를 바꾸면 헤더 글자 폭이 달라져 '가' 버튼 위치가 움직인다 → 다시 맞춤
  function onFsClick(e) {
    if (e.target.closest('[data-fs-set]')) requestAnimationFrame(position);
  }

  function close(opt = {}) {
    if (!el) return;
    window.removeEventListener('resize', position);
    window.removeEventListener('scroll', position);
    document.removeEventListener('focusin', onFocusIn);
    document.removeEventListener('click', onFsClick, true);
    document.documentElement.classList.remove('is-coach');
    const node = el;
    el = null;
    step = -1;
    node.remove();
    if (!opt.keepPage && lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }

  pc.addEventListener('change', () => { if (!pc.matches) close(); });

  // 시작: 컴포넌트(헤더) 로드 + 히어로 첫 진입 애니메이션 종료, 둘 다 끝난 뒤 0.8초
  let componentsReady = false;
  let introReady = !!window.__heroIntroDone;
  let started = false;
  const wantGuide = location.hash === '#guide';
  function tryStart() {
    if (started || !componentsReady || !introReady) return;
    started = true;
    if (!pc.matches || (seen() && !wantGuide)) return;
    setTimeout(() => {
      if (wantGuide) history.replaceState(null, '', location.pathname + location.search);
      open();
    }, START_DELAY);
  }
  document.addEventListener('components:loaded', () => { componentsReady = true; tryStart(); });
  document.addEventListener('hero:introend', () => { introReady = true; tryStart(); });

  // 다시 보기 — 헤더 '이용 안내' (메인에서는 바로 실행)
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-guide-open]');
    if (!link || !pc.matches) return;
    e.preventDefault();
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'instant' });
    open();
  });
})();
