/* ==========================================================================
   공통 동작 — 헤더 / 모바일 메뉴 / 퀵메뉴 / 푸터 지점정보 / 전화 시트 / 이미지 대체 / 아코디언
   ========================================================================== */
(function () {
  const root = document.documentElement.dataset.root || '.';
  const SITE = window.SITE || { branches: [], social: {} };

  /* ---------- 헬퍼 (페이지 스크립트에서도 사용) ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const telHref = (tel) => `tel:${tel.replace(/[^0-9]/g, '')}`;
  const img = (file) => `${root}/assets/images/${file}`;
  /** 배경 이미지: 실제 파일 위에 temp 를 깔아 둔다 (실제 파일이 없으면 temp 가 보임) */
  const bg = (file) => `url('${img(file)}'), url('${root}/assets/images/temp/${file}')`;
  const formatDate = (iso, withTime) => {
    const d = new Date(iso);
    const p = (n) => String(n).padStart(2, '0');
    const date = `${String(d.getFullYear()).slice(2)}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    return withTime ? `${date} ${p(d.getHours())}:${p(d.getMinutes())}` : date;
  };
  const branchBadge = (branch) => {
    const map = { changwon: ['창원점', 'changwon'], masan: ['마산점', 'masan'], both: ['창원·마산', 'both'] };
    const [label, cls] = map[branch] || map.both;
    return `<span class="badge badge--${cls}">${label}</span>`;
  };

  /** 아코디언: 하나 열면 나머지는 닫힘 */
  function accordion(container) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.accordion__btn');
      if (!btn || !container.contains(btn)) return;
      const willOpen = btn.getAttribute('aria-expanded') !== 'true';
      container.querySelectorAll('.accordion__btn').forEach((b) => setPanel(b, b === btn && willOpen));
    });
  }
  function setPanel(btn, open) {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.setAttribute('aria-expanded', String(open));
    panel.style.height = open ? `${panel.scrollHeight}px` : '0px';
  }

  /** FAQ 아코디언 한 줄 (faq/index.html 에서도 같은 마크업 사용) */
  function faqItem(f, i, prefix) {
    const no = String(i + 1).padStart(2, '0');
    return `
      <li class="accordion__item">
        <button class="accordion__btn" type="button" id="${prefix}-q${i}" aria-expanded="false" aria-controls="${prefix}-a${i}">
          <span class="accordion__no">${no}</span>
          <span class="accordion__q">${esc(f.question)}</span>
          <span class="accordion__icon" aria-hidden="true"></span>
        </button>
        <div class="accordion__panel" id="${prefix}-a${i}" role="region" aria-labelledby="${prefix}-q${i}">
          <p class="accordion__a">${esc(f.answer || '답변 준비 중입니다.')}</p>
        </div>
      </li>`;
  }

  /* ---------- 글자 굴림 버튼 (.roll-text) ----------
     버튼 글자를 한 글자씩 칸(overflow: hidden)으로 나누고, 각 칸에 원래 글자 + 아래 복사본(aria-hidden)을 쌓는다.
     hover·focus-visible 때 두 줄을 translateY(-100%)로 올리고, 글자마다 --i × 30ms 시차 (common.css .roll-text).
     안의 아이콘(svg)도 같은 방식으로 마지막 순서에 굴러간다. 아이콘만 있는 버튼도 그대로 동작.
     화면낭독기: 버튼 aria-label = 글자(없을 때만 넣음) → 쪼갠 글자·복사본은 읽히지 않는다.
     글자를 바꿀 때(언어 전환 등)는 UI.rollText(el, '새 글자') 로 다시 만든다 → 복사본도 함께 바뀜 */
  function rollText(el, text) {
    const icons = [...el.querySelectorAll(':scope > svg, :scope > .roll-text__icon .roll-text__a > svg')];
    const label = (text ?? (el.dataset.rollLabel || [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(''))).trim();
    el.dataset.rollLabel = label;
    if (label && (!el.hasAttribute('aria-label') || el.dataset.rollAria)) { el.setAttribute('aria-label', label); el.dataset.rollAria = '1'; }
    const cell = (i, a, b, extra = '') => `<span class="roll-text__ch${extra}" style="--i:${i}"><span class="roll-text__a">${a}</span><span class="roll-text__b" aria-hidden="true">${b}</span></span>`;
    const chars = [...label];
    const html = (chars.length ? `<span class="roll-text__label">${chars.map((c, i) => { const t = c === ' ' ? '&nbsp;' : esc(c); return cell(i, t, t); }).join('')}</span>` : '') +
      icons.map((svg, k) => cell(chars.length + k, svg.outerHTML, svg.outerHTML, ' roll-text__icon')).join('');
    el.innerHTML = html;
    el.querySelectorAll('svg').forEach((s) => s.setAttribute('aria-hidden', 'true'));
  }
  function initRollText(scope = document) {
    scope.querySelectorAll('.roll-text:not([data-roll-label])').forEach((el) => rollText(el));
  }
  initRollText();

  window.UI = { esc, telHref, img, bg, formatDate, branchBadge, accordion, faqItem, rollText };

  /* ---------- 이미지 대체 ----------
     1) assets/images/파일명 이 없으면 → assets/images/temp/파일명 (임시 스톡 이미지)
     2) temp 에도 없으면 → 이미지를 숨기고 .img-ph 의 은은한 그라데이션 배경만 보인다
     실제 사진을 assets/images/ 에 같은 이름으로 넣으면 자동으로 실제 사진이 우선 표시된다. */
  function handleMissing(el) {
    const src = el.getAttribute('src') || '';
    if (!el.dataset.fallback && /\/assets\/images\/[^/]+$/.test(src)) {
      el.dataset.fallback = '1';
      el.src = src.replace(/\/assets\/images\//, '/assets/images/temp/');
      return;
    }
    el.classList.add('is-missing');
    el.closest('.img-ph')?.classList.add('has-missing');
  }
  document.addEventListener('error', (e) => { if (e.target.tagName === 'IMG') handleMissing(e.target); }, true);
  window.addEventListener('load', () => {
    document.querySelectorAll('img').forEach((el) => { if (el.complete && el.naturalWidth === 0) handleMissing(el); });
  });

  /* ---------- 글자 크기 조절 ----------
     html[data-fs] = md(보통 100%) / lg(크게 112.5%) / xl(아주 크게 125%). 선택값은 localStorage 에 저장해 다른 페이지에서도 유지.
     스크립트가 읽히자마자 적용해 깜빡임을 줄이고, 버튼(헤더·모바일 메뉴)은 위임으로 처리 */
  const FS_KEY = 'witee-font-size';
  const FS_STEPS = ['md', 'lg', 'xl'];
  function applyFontSize(step) {
    if (!FS_STEPS.includes(step)) step = 'md';
    if (step === 'md') delete document.documentElement.dataset.fs;
    else document.documentElement.dataset.fs = step;
    document.querySelectorAll('[data-fs-set]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.fsSet === step)));
    return step;
  }
  let savedFs = 'md';
  try { savedFs = localStorage.getItem(FS_KEY) || 'md'; } catch (e) { /* 저장소 사용 불가 — 보통으로 */ }
  applyFontSize(savedFs);
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-fs-set]');
    if (!btn) return;
    const step = applyFontSize(btn.dataset.fsSet);
    try { localStorage.setItem(FS_KEY, step); } catch (err) { /* 저장 실패해도 이번 페이지에는 적용됨 */ }
  });

  /* ---------- 컴포넌트 로드 후 ---------- */
  document.addEventListener('components:loaded', () => {
    applyFontSize(document.documentElement.dataset.fs || 'md'); // 헤더 버튼 선택 표시
    initHeader();
    initMegaMenu();
    initCurrentMenu();
    initMobileNav();
    initQuick();
    fillSocialLinks();
    renderFooterBranches();
    initCallSheet();
    initRollText(); // 헤더·푸터 등 컴포넌트 안의 .roll-text
  });

  function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;
    // 메인: 최상단에서는 히어로 위 투명 헤더(main.css '투명 헤더'), 40px 이상 스크롤하면 흰 헤더 / 서브: 10px 부터 그림자만 진하게
    const limit = document.body.classList.contains('is-main') ? 40 : 10;
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > limit);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /** 데스크톱 전체 펼침 메뉴 — 대메뉴 hover/focus 시 열고, 헤더를 벗어나면 0.2초 뒤 닫는다 (대각선 이동 중 닫힘 방지). ESC 로 닫기 */
  function initMegaMenu() {
    const header = document.getElementById('header');
    const gnb = header?.querySelector('.gnb');
    if (!gnb) return;
    const CLOSE_DELAY = 200;
    let timer = null;
    const open = () => { clearTimeout(timer); header.classList.add('is-mega'); };
    const close = () => { clearTimeout(timer); header.classList.remove('is-mega'); };
    const closeLater = () => { clearTimeout(timer); timer = setTimeout(close, CLOSE_DELAY); };

    let escaping = false; // ESC 로 닫으며 포커스를 옮길 때 focusin 으로 다시 열리지 않게

    gnb.addEventListener('mouseover', (e) => { if (e.target.closest('.gnb__item')) open(); });
    header.addEventListener('mouseenter', () => { if (header.classList.contains('is-mega')) open(); }); // 닫히기 전에 돌아오면 유지
    header.addEventListener('mouseleave', closeLater);
    gnb.addEventListener('focusin', () => { if (!escaping) open(); });
    header.addEventListener('focusout', (e) => { if (!header.contains(e.relatedTarget)) closeLater(); });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !header.classList.contains('is-mega')) return;
      // 하위 메뉴·연락처에 포커스가 있었다면 그 열의 대메뉴로 돌려 둔다 (숨겨진 링크에 포커스가 남지 않게)
      const from = document.activeElement?.closest('.gnb__sub, .mega');
      if (from) {
        escaping = true;
        (from.closest('.gnb__item')?.querySelector('.gnb__link') || gnb.querySelector('.gnb__link')).focus();
        escaping = false;
      }
      close();
    });
  }

  /** 현재 페이지 메뉴 강조 */
  function initCurrentMenu() {
    const here = location.pathname.replace(/\/$/, '/index.html');
    document.querySelectorAll('.gnb__sub a, .mnav__sub a').forEach((a) => {
      if (a.pathname === here) {
        a.classList.add('is-current');
        a.setAttribute('aria-current', 'page');
        a.closest('.gnb__item')?.querySelector('.gnb__link')?.classList.add('is-current');
      }
    });
  }

  function initMobileNav() {
    const nav = document.getElementById('mnav');
    const openBtn = document.querySelector('[data-mnav-open]');
    if (!nav || !openBtn) return;
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      nav.setAttribute('aria-hidden', String(!open));
      openBtn.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('is-locked', open);
      document.getElementById('header')?.classList.toggle('is-mnav', open); // 메인 투명 헤더 → 메뉴가 열린 동안 흰 헤더
      if (open) nav.querySelector('.mnav__close').focus();
      else openBtn.focus();
    };
    openBtn.addEventListener('click', () => setOpen(true));
    nav.querySelectorAll('[data-mnav-close]').forEach((el) => el.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) setOpen(false); });

    // 서브메뉴는 처음부터 모두 펼침 (header.html). 대메뉴를 누르면 그 메뉴만 접고 펼친다
    nav.querySelectorAll('.mnav__toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(open));
        btn.nextElementSibling.classList.toggle('is-open', open);
      });
    });
  }

  function initQuick() {
    document.querySelectorAll('.quick').forEach((quick) => {
      // 모바일 '+' 토글
      const btn = quick.querySelector('.quick__toggle');
      btn?.addEventListener('click', () => {
        const open = !quick.classList.contains('is-open');
        quick.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
        btn.setAttribute('aria-label', open ? '지점 SNS 메뉴 닫기' : '지점 SNS 메뉴 열기');
      });
      initQuickChips(quick);
    });
  }

  /* 769px 이상 플로팅 [인스타그램][블로그] → '창원점 / 마산점' 칩
     - 마우스: 버튼·칩(같은 .quick__item 안) 위에 있는 동안 열림, 벗어나면 0.2초 뒤 닫힘
     - 키보드: 버튼에 포커스 → 열림, Tab 으로 칩 이동, 묶음 밖으로 포커스가 나가거나 ESC → 닫힘
     - 터치(hover 없는 기기): 탭으로 열고 닫기, 바깥을 누르면 닫힘 */
  function initQuickChips(quick) {
    const items = [...quick.querySelectorAll('[data-quick-item]')];
    if (!items.length) return;
    const CLOSE_DELAY = 200;
    const canHover = window.matchMedia('(hover: hover)');
    const set = (item, open) => {
      clearTimeout(item._qt);
      item.classList.toggle('is-open', open);
      item.querySelector('.quick__sns-btn').setAttribute('aria-expanded', String(open));
      if (open) items.forEach((o) => { if (o !== item) set(o, false); }); // 한 번에 하나만
    };
    items.forEach((item) => {
      const btn = item.querySelector('.quick__sns-btn');
      item.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') set(item, true); });
      item.addEventListener('pointerleave', (e) => {
        if (e.pointerType !== 'mouse' || item.querySelector(':focus-visible')) return; // 키보드 포커스가 안에 있으면 유지
        clearTimeout(item._qt);
        item._qt = setTimeout(() => set(item, false), CLOSE_DELAY);
      });
      // 마우스 사용자는 hover 로 이미 열려 있으므로 클릭은 '열기'만, 터치는 탭할 때마다 열기/닫기
      btn.addEventListener('click', () => set(item, canHover.matches ? true : !item.classList.contains('is-open')));
      item.addEventListener('focusin', (e) => {
        if (item._escaped) { item._escaped = false; return; } // ESC 로 닫고 버튼에 돌려준 포커스로는 다시 열지 않는다
        // 버튼은 키보드 포커스일 때만(마우스·터치로 누른 포커스는 hover·탭이 맡는다), 칩은 언제나
        if (e.target !== btn || btn.matches(':focus-visible')) set(item, true);
      });
      item.addEventListener('focusout', (e) => { if (!item.contains(e.relatedTarget) && !item.matches(':hover')) set(item, false); });
      item.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || !item.classList.contains('is-open')) return;
        e.preventDefault();
        set(item, false);
        if (document.activeElement !== btn) { item._escaped = true; btn.focus({ preventScroll: true }); }
      });
    });
    // 바깥을 누르면 닫힘 (터치·마우스 공통)
    document.addEventListener('pointerdown', (e) => {
      items.forEach((item) => { if (!item.contains(e.target)) set(item, false); });
    });
  }

  /** SNS 링크 채우기 — URL 이 아직 없으면(TODO) 클릭 시 안내 */
  function fillSocialLinks() {
    document.querySelectorAll('[data-sns]').forEach((a) => {
      const url = SITE.social[a.dataset.sns];
      if (url) {
        a.href = url;
      } else {
        a.removeAttribute('target');
        a.addEventListener('click', (e) => { e.preventDefault(); alert('SNS 주소 준비 중입니다.'); });
      }
    });
  }

  function renderFooterBranches() {
    const box = document.querySelector('[data-footer-branches]');
    if (!box) return;
    box.innerHTML = SITE.branches.map((b) => `
      <div class="footer__branch">
        <h3>화이트e치과의원 <em class="text-${b.id}">${esc(b.name)}</em></h3>
        <dl>
          <dt>주소</dt><dd>${esc(b.address)} (${esc(b.addressNote)})</dd>
          <dt>대표자</dt><dd>${esc(b.ceo)} · 사업자등록번호 ${esc(b.bizNo)}</dd>
          <dt>전화</dt><dd><a href="${telHref(b.tel)}">${esc(b.tel)}</a> · 이메일 <a href="mailto:${esc(b.email)}">${esc(b.email)}</a></dd>
          <dt>진료시간</dt><dd>${b.hours.map((h) => `${esc(h.label)} ${esc(h.time)}`).join(' · ')}</dd>
        </dl>
      </div>`).join('');
  }

  function initCallSheet() {
    const sheet = document.getElementById('call-sheet');
    const openBtn = document.querySelector('[data-call-open]');
    if (!sheet || !openBtn) return;
    sheet.querySelector('[data-call-list]').innerHTML = SITE.branches.map((b) => `
      <a class="btn--${b.id}" href="${telHref(b.tel)}"><span>${esc(b.name)}</span><span>${esc(b.tel)}</span></a>`).join('');
    const setOpen = (open) => {
      sheet.classList.toggle('is-open', open);
      document.body.classList.toggle('is-locked', open);
    };
    openBtn.addEventListener('click', () => setOpen(true));
    sheet.querySelector('[data-call-close]').addEventListener('click', () => setOpen(false));
    sheet.addEventListener('click', (e) => { if (e.target === sheet) setOpen(false); });
  }
})();
