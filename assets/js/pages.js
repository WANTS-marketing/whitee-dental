/* ==========================================================================
   서브페이지 동작 — <body data-page="..."> 값에 따라 필요한 것만 실행
   상담문의 폼([data-inquiry-form])은 어느 페이지에 있든 동작
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  const run = {
    doctors: renderDoctorsPage,
    clinic: renderClinic,
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
   지점별 묶음: [지점 색 작은 라벨 + '창원점 의료진'] 아래 원장 — 겸직 원장(김영우)은 두 지점 모두, 이름 아래 '창원·마산 겸직' 태그
   원장(카드 상자 없음, 원장 사이 가는 가로선 + 위아래 100px): 모두 같은 방향(사진 왼쪽)
     [이름 52px 굵게 + 직함 52px 400 같은 줄 ······ 학회·학교 로고(site-data.js logos)]
     [진료과 태그(네이비 면) + 주요 진료(site-data.js focus)]
     [연한 베이지 약력 상자 — 왼쪽에 사진(아래 끝 = 상자 아래 끝, 머리가 상자 위로 80px) | 약력 2열]
   약력: 지금 데이터 순서 그대로가 아니라 분류 순서 — 전문의 → 학력 → 경력(네이비 굵게) → 연수·학회 활동(기본 검정) (site-data.js SITE.classifyCareer · isTraining)
   사진: 원장별 보정값(site-data.js photoScale·photoOffsetY·photoOffsetX → --ps·--py·--px), 흰 배경 사진은 multiply 로 상자 색과 섞음(photoBlend)
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
  // 약력: 전문의 → 학력 → 경력 (굵게 네이비) / 연수 → 학회 활동 (기본)
  const careerOf = (d) => {
    const by = { cert: [], edu: [], career: [], training: [], society: [] };
    (d.career || []).forEach((c) => { const k = S.classifyCareer(c); by[k === 'career' && S.isTraining(c) ? 'training' : k].push(c); });
    const li = (c, strong) => `<li class="${strong ? 'is-strong' : ''}">${esc(c)}</li>`;
    return [...by.cert, ...by.edu, ...by.career].map((c) => li(c, true)).join('') + [...by.training, ...by.society].map((c) => li(c, false)).join('');
  };
  box.innerHTML = groups.map(({ b, docs }) => `
    <section class="doctor-group" id="${b.id}" data-branch="${b.id}" aria-labelledby="doctor-group-${b.id}">
      <div class="doctor-group__head">
        <p class="doctor-group__label" aria-hidden="true">${EN[b.id] || ''}</p>
        <h2 class="doctor-group__title" id="doctor-group-${b.id}"><span class="text-${b.id}">${esc(b.name)}</span> 의료진</h2>
      </div>
      <div class="doctor-profiles">
        ${docs.map((d) => {
          /* 사진 칸 = 상자 위 80px ~ 상자 아래 끝. 머리 위 끝(photoHeadTop)이 칸 위 끝에 오게: 사진 높이 = 칸 × max(photoScale, 1/(1 - 머리 위치)),
             남는 만큼 아래로 내려 상자 아래 끝에서 자른다 (--dk 높이 배율, --dy 내림 = 칸 높이 대비 %) */
          const ht = Math.min(0.4, Math.max(0, Number(d.photoHeadTop) || 0));
          const fix = `--dk:${(1 / (1 - ht)).toFixed(4)}`; // 사진 높이 = 칸 높이 ÷ (1 - 머리 위치) → 머리 위 끝 = 칸 위 끝, 아래 끝 = 상자 아래 끝 (자르지 않음)
          const both = d.branches.length > 1;
          const logos = (d.logos || []).filter((l) => l && l.src);
          return `
          <article class="doctor-profile" id="${b.id}-${S.doctorSlug(d)}" style="${fix}">
            <div class="doctor-profile__head">
              <div class="doctor-profile__id">
                <h3 class="doctor-profile__name"><strong>${esc(d.name)}</strong> <span>${esc(d.title)}</span></h3>
                <p class="doctor-profile__tags"><span class="doctor-profile__dept">${esc(d.dept)}</span>${d.focus ? `<span class="doctor-profile__focus">${esc(d.focus)}</span>` : ''}${both ? '<span class="doctor-profile__both">창원·마산 겸직</span>' : ''}</p>
              </div>
              ${logos.length ? `<ul class="doctor-profile__logos">${logos.map((l) => `<li><img src="${img(l.src)}" alt="${esc(l.alt || '')}" loading="lazy"></li>`).join('')}</ul>` : ''}
            </div>
            <div class="doctor-profile__box">
              <div class="doctor-profile__photo"><img class="doctor-profile__img${d.photoBlend === false ? '' : ' is-blend'}" src="${img(String(d.photo || '').replace(/\.[a-z]+$/i, '-cut.png'))}" alt="${esc(d.name)} ${esc(d.title)} 사진" loading="lazy"></div>
              ${(d.career || []).length ? `<ul class="doctor-profile__career">${careerOf(d)}</ul>` : ''}
            </div>
          </article>`;
        }).join('')}
      </div>
    </section>`).join('');
  box.querySelectorAll('.doctor-profile__img').forEach((im) => im.addEventListener('error', () => im.classList.add('is-missing'), { once: true }));
  // 이 페이지만 본문 오른쪽 끝 = 플로팅 퀵메뉴 왼쪽 끝 - 32px (common.css '.page-doctors .sub-layout' 의 --doc-right). 1024px 이하는 쓰지 않음
  const root = document.documentElement;
  const setDocRight = () => {
    const q = document.querySelector('.quick--float');
    const qr = q && window.innerWidth > 1024 ? q.getBoundingClientRect() : null;
    if (qr && qr.width) root.style.setProperty('--doc-right', `${Math.round(root.clientWidth - qr.left + 32)}px`);
    else root.style.removeProperty('--doc-right');
  };
  /* 원장별 약력 상자 높이: 약력이 길어 상자가 최소 높이(--box-h)보다 커지면, 그 높이를 --box-h 로 넣어 사진도 같이 키운다
     (머리가 늘 상자 위 --pop 만큼 나오고 아래 끝 = 상자 아래 끝). 사진이 커지면 약력 칸이 좁아져 다시 길어지므로 몇 번 반복, 최소 높이의 1.4배까지 */
  const fitBoxes = () => {
    box.querySelectorAll('.doctor-profile').forEach((a) => {
      a.style.removeProperty('--box-h');
      if (getComputedStyle(a).display === 'flex') return; // 사진 위 · 정보 아래 배치(1024px 이하 · 좁은 본문)는 상자가 따로라 맞출 것 없음
      const bx = a.querySelector('.doctor-profile__box');
      const ul = a.querySelector('.doctor-profile__career');
      if (!bx || !ul) return;
      const base = parseFloat(getComputedStyle(a).getPropertyValue('--box-h')) || 440;
      let h = base;
      for (let i = 0; i < 6; i++) {
        const cs = getComputedStyle(bx);
        const need = Math.ceil(ul.getBoundingClientRect().height + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom));
        if (need <= h + 1) break;
        h = Math.min(need, base * 1.4);
        a.style.setProperty('--box-h', `${h}px`);
        if (h >= base * 1.4) break;
      }
    });
  };
  const layout = () => { setDocRight(); fitBoxes(); };
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
    const body = document.querySelector('.sub-body')?.getBoundingClientRect();
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
