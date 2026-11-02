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

  window.UI = { esc, telHref, img, bg, formatDate, branchBadge, accordion, faqItem };

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

  /* ---------- 컴포넌트 로드 후 ---------- */
  document.addEventListener('components:loaded', () => {
    initHeader();
    initCurrentMenu();
    initMobileNav();
    initQuick();
    fillSocialLinks();
    renderFooterBranches();
    initCallSheet();
  });

  function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
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
      if (open) nav.querySelector('.mnav__close').focus();
      else openBtn.focus();
    };
    openBtn.addEventListener('click', () => setOpen(true));
    nav.querySelectorAll('[data-mnav-close]').forEach((el) => el.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) setOpen(false); });

    // 아코디언 서브메뉴 (하나 열면 나머지 닫힘), 현재 페이지가 속한 메뉴는 펼쳐 둔다
    const toggles = nav.querySelectorAll('.mnav__toggle');
    const setSub = (btn, open) => {
      btn.setAttribute('aria-expanded', String(open));
      btn.nextElementSibling.classList.toggle('is-open', open);
    };
    toggles.forEach((btn) => {
      btn.addEventListener('click', () => {
        const willOpen = btn.getAttribute('aria-expanded') !== 'true';
        toggles.forEach((b) => setSub(b, b === btn && willOpen));
      });
      if (btn.nextElementSibling.querySelector('.is-current')) setSub(btn, true);
    });
  }

  function initQuick() {
    document.querySelectorAll('.quick').forEach((quick) => {
      const btn = quick.querySelector('.quick__toggle');
      btn?.addEventListener('click', () => {
        const open = !quick.classList.contains('is-open');
        quick.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
        btn.setAttribute('aria-label', open ? '지점 SNS 메뉴 닫기' : '지점 SNS 메뉴 열기');
      });
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
