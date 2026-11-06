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

  /* ---------- 서브 LNB (body.has-lnb · 스타일 common.css '서브 LNB') ----------
     LNB 메뉴로 다른 페이지를 열면 새 페이지가 본문 시작 위치에서 열리도록 표시를 남긴다 (읽는 쪽: assets/js/lnb-jump.js)
       — 일반 왼쪽 클릭만. 새 탭·새 창(ctrl·cmd·shift·가운데 클릭)은 표시하지 않음. 저장 실패해도 그냥 이동
     1024px 이하 가로 탭 줄: 현재 페이지 탭이 화면 밖(오른쪽)에 있으면 보이게 가로로 당겨 둔다 */
  function initLnb() {
    // 같은 대메뉴 안 이동 = 본문부터 열기 위한 기록은 lnb-jump.js 가 맡는다 (LNB·헤더·본문 링크)
    const lnb = document.querySelector('.lnb');
    const cur = lnb?.querySelector('.lnb__list a[aria-current="page"]');
    if (!cur || lnb.scrollWidth <= lnb.clientWidth) return;
    const { left, right } = cur.getBoundingClientRect();
    const box = lnb.getBoundingClientRect();
    if (right > box.right - 16 || left < box.left) lnb.scrollLeft += left - box.left - (box.width - (right - left)) / 2;
  }
  initLnb();

  /* ---------- 상담문의 폼 (상담문의하기 · 진료과목 빠른상담 · 메인 빠른 상담문의 공용) — 저장: api.js createInquiry (+ 병원 메일 알림) ----------
     form[data-inquiry-form="구분"]: 어느 폼에서 왔는지(source). 진료과목 칸이 없으면 data-treatment 값(예: 메인 빠른 상담문의 = 기타)
     칸: branch · treatment · name · phone · password(숫자 4자리, 본인 문의·답변 확인용) · message(있는 폼만) · agree · website(허니팟)
     화면 쪽 스팸 방지: 허니팟(값이 있으면 성공처럼 보이고 저장 안 함) · 내용 5자 미만 막기 · 링크(http, www) 들어간 글 막기
       (같은 검사를 api.js·서버에서도 다시 한다 — docs/API-SPEC.md)
     연락처 숫자만 + 하이픈 자동, 비밀번호 숫자만 4자리
     접수 성공 시
       - 이 탭에서 쓴 글 번호를 sessionStorage(witee-inquiry-mine)에 남긴다 → 상담문의 목록에서 '내 문의' 표시 (inquiry.js)
       - form[data-success-url] 이 있으면(상담문의 작성 페이지) 그 목록으로 이동 — 방금 쓴 글 강조(witee-inquiry-just) + 같은 대메뉴라 본문부터(lnb-jump 기록)
       - onSuccess(result) 가 있으면 그것(메인 빠른 상담문의 완료 화면), 없으면 폼 아래 '접수되었습니다 … 상담 현황 보기 →'(목록 링크) + 폼 비우기 */
  const LINK_RE = /(https?:\/\/|www\.)/i;
  const statusHref = () => `${document.documentElement.dataset.root || '.'}/faq/contact.html`;
  const MINE_KEY = 'witee-inquiry-mine';
  const JUST_KEY = 'witee-inquiry-just';
  function rememberMine(id) {
    if (!id) return;
    try {
      const mine = JSON.parse(sessionStorage.getItem(MINE_KEY) || '[]');
      if (!mine.includes(id)) mine.push(id);
      sessionStorage.setItem(MINE_KEY, JSON.stringify(mine));
      sessionStorage.setItem(JUST_KEY, String(id));
    } catch (e) { /* 표시만 못 함 */ }
  }
  const DONE_TEXT = '접수되었습니다. 상담 현황에서 답변을 확인하실 수 있습니다.';
  /* 시안 안내 — 접수가 병원에 전달되지 않을 때(api.js isDeliveryReady() = false: Web3Forms 키·서버 없음)
     모든 상담 폼 전송 버튼 아래 작은 글씨 + 접수 완료 문구 대신. 키가 등록되면 자동으로 사라지고 원래 '접수되었습니다' */
  const deliveryReady = () => !!window.API?.isDeliveryReady?.();
  const telList = () => (window.SITE?.branches || []).map((b) => [b.name || b.shortName, b.tel]);
  const demoText = () => `시안 화면입니다. 실제로 병원에 전달되지 않습니다. 문의는 전화로 부탁드립니다. ${telList().map(([n, t]) => `${n} ${t}`).join(' · ')}`;
  const demoHtml = () => `시안 화면입니다. 실제로 병원에 전달되지 않습니다. 문의는 전화로 부탁드립니다. ${telList().map(([n, t]) => `${esc(n)} <a href="${telHref(t)}">${esc(t)}</a>`).join(' · ')}`;
  function inquiryForm(form, { onSuccess } = {}) {
    const msg = form.querySelector('.form__msg');
    const submitBtn = form.querySelector('[type="submit"]');
    const setMsg = (text, type, html) => {
      if (html) msg.innerHTML = html; else msg.textContent = text;
      msg.className = `form__msg${type ? ` is-${type}` : ''}`;
    };
    const fail = (text, field) => { setMsg(text, 'error'); field?.focus(); };

    // 연락처: 숫자만 받아 하이픈 자동 입력
    const phone = form.elements.phone;
    phone?.addEventListener('input', () => {
      const d = phone.value.replace(/\D/g, '').slice(0, 11);
      phone.value = d.length < 4 ? d : d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}` : `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`;
    });
    // 비밀번호: 숫자만 4자리
    const pw = form.elements.password;
    pw?.addEventListener('input', () => { const v = pw.value.replace(/\D/g, '').slice(0, 4); if (v !== pw.value) pw.value = v; });

    // 시안 안내 — 전송 버튼(작성 페이지는 버튼 줄) 바로 아래
    if (!deliveryReady() && !form.querySelector('.form__demo')) {
      const note = document.createElement('p');
      note.className = 'form__demo';
      note.innerHTML = demoHtml();
      (submitBtn.closest('.form__actions') || submitBtn).after(note);
    }

    const done = (result) => {
      if (form.dataset.successUrl && result.data?.id) {
        const to = new URL(form.dataset.successUrl, location.href);
        try { sessionStorage.setItem('witee-lnb-jump', JSON.stringify({ from: 'faq', to: to.pathname, t: Date.now() })); } catch (e) { /* 배너부터 */ }
        form.reset();
        location.assign(to.href);
        return;
      }
      if (onSuccess) onSuccess(result);
      else setMsg('', deliveryReady() ? 'success' : 'demo', `${deliveryReady() ? esc(DONE_TEXT) : demoHtml()} <a class="form__msg-link" href="${statusHref()}">상담 현황 보기 →</a>`);
      form.reset();
      form.dispatchEvent(new Event('input')); // 글자 수 표시 등 초기화
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = form.elements;

      // 허니팟: 사람에게는 보이지 않는 칸 — 값이 있으면 봇으로 보고 조용히 종료(성공처럼 보이게)
      if (f.website?.value) { if (form.dataset.successUrl) { location.assign(form.dataset.successUrl); return; } done({ ok: true, data: {} }); return; }
      setMsg('');
      if (!form.reportValidity()) return;
      if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(f.phone.value)) return fail('연락처를 정확히 입력해 주세요. (예: 010-1234-5678)', f.phone);
      if (!/^\d{4}$/.test(f.password?.value || '')) return fail('비밀번호를 숫자 4자리로 입력해 주세요.', f.password);
      const content = f.message ? f.message.value.trim() : '';
      if (f.message && content.length < 5) return fail('문의 내용을 5자 이상 입력해 주세요.', f.message);
      if (LINK_RE.test(content)) return fail('링크(http, www)가 들어간 글은 등록할 수 없습니다. 주소를 빼고 다시 적어 주세요.', f.message);

      submitBtn.disabled = true;
      setMsg('전송 중입니다…');
      try {
        const result = await window.API.createInquiry({
          branch: f.branch.value,
          treatment: f.treatment?.value || form.dataset.treatment || '기타',
          name: f.name.value.trim(),
          phone: f.phone.value,
          password: f.password.value,
          content,
          contentRequired: !!f.message,
          source: form.dataset.inquiryForm || '상담문의',
        });
        if (result.ok) { setMsg(''); rememberMine(result.data.id); done(result); } else fail(result.error.message, result.error.field && f[result.error.field === 'content' ? 'message' : result.error.field]);
      } catch (err) {
        console.error(err);
        setMsg('전송에 실패했습니다. 잠시 후 다시 시도하거나 전화로 문의해 주세요.', 'error');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  /* ---------- 사이트 팝업 (브라우저 기본 alert·confirm 대신) — 상담 현황 비밀번호·상세, 관리자 확인 창 ----------
     UI.dialog({ title, body(HTML), actions: [{ label, value, variant: 'point'|'line'|'danger' }], wide, onOpen(panel, close) })
       → Promise<value> (Esc·바깥 클릭·닫기 버튼 = null). 열려 있는 동안 뒤 화면 스크롤 잠금, 포커스는 팝업 안에서만, 닫으면 연 버튼으로 복귀
     UI.confirm(message, { okLabel, danger }) → Promise<boolean> */
  function dialog({ title, body = '', actions = [], wide = false, onOpen } = {}) {
    return new Promise((resolve) => {
      const opener = document.activeElement;
      const wrap = document.createElement('div');
      wrap.className = `site-dialog${wide ? ' site-dialog--wide' : ''}`;
      const id = `site-dialog-${Date.now()}`;
      wrap.innerHTML = `
        <div class="site-dialog__dim" data-dialog-close></div>
        <div class="site-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="${id}" tabindex="-1">
          <div class="site-dialog__head"><h2 class="site-dialog__title" id="${id}">${esc(title)}</h2>
            <button class="site-dialog__x" type="button" data-dialog-close aria-label="닫기"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
          <div class="site-dialog__body">${body}</div>
          ${actions.length ? `<div class="site-dialog__actions">${actions.map((a, i) => `<button class="btn btn--${a.variant === 'danger' ? 'danger' : a.variant === 'point' ? 'point' : 'line'}" type="${a.submit ? 'submit' : 'button'}" data-dialog-value="${i}">${esc(a.label)}</button>`).join('')}</div>` : ''}
        </div>`;
      document.body.appendChild(wrap);
      document.documentElement.classList.add('is-dialog-open');
      const panel = wrap.querySelector('.site-dialog__panel');
      let closed = false;
      const close = (value = null) => {
        if (closed) return;
        closed = true;
        document.removeEventListener('keydown', onKey, true);
        wrap.classList.remove('is-open');
        if (!document.querySelectorAll('.site-dialog.is-open').length) document.documentElement.classList.remove('is-dialog-open');
        setTimeout(() => wrap.remove(), 200);
        opener?.focus?.({ preventScroll: true });
        resolve(value);
      };
      const focusables = () => [...panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled && el.offsetParent !== null);
      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(null); return; }
        if (e.key !== 'Tab') return;
        const els = focusables(); if (!els.length) return;
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      document.addEventListener('keydown', onKey, true);
      wrap.addEventListener('click', (e) => {
        if (e.target.closest('[data-dialog-close]')) close(null);
        const b = e.target.closest('[data-dialog-value]');
        if (b && b.type !== 'submit') close(actions[Number(b.dataset.dialogValue)].value);
      });
      requestAnimationFrame(() => wrap.classList.add('is-open'));
      const api = { panel, close, setBody: (html) => { panel.querySelector('.site-dialog__body').innerHTML = html; }, setTitle: (t) => { panel.querySelector('.site-dialog__title').textContent = t; } };
      if (onOpen) onOpen(api); else (panel.querySelector('[data-dialog-value]') || panel).focus({ preventScroll: true });
    });
  }
  const confirmDialog = (message, { title = '확인', okLabel = '확인', danger = false } = {}) =>
    dialog({ title, body: `<p class="site-dialog__text">${esc(message)}</p>`, actions: [{ label: '취소', value: false }, { label: okLabel, value: true, variant: danger ? 'danger' : 'point' }] }).then((v) => v === true);
  const alertDialog = (message, { title = '안내' } = {}) =>
    dialog({ title, body: `<p class="site-dialog__text">${esc(message)}</p>`, actions: [{ label: '확인', value: true, variant: 'point' }] });

  /* ---------- 선택 목록(select) 커스텀 드롭다운 (스타일 common.css '선택 목록') ----------
     닫힌 상태 = 원래 select 그대로(입력칸과 같은 높이·테두리·모서리·포커스, 사이트 화살표 아이콘) — 전송·라벨·필수 입력 안내·reset 이 그대로 동작
     PC(마우스): 기본 펼침 목록 대신 직접 만든 목록(.select-list)을 연다 — 항목 44px, hover 옅은 네이비, 선택 항목 굵게+체크, 지점 항목 앞 지점 색 점
       키보드: 닫힌 상태에서 Enter·Space·↑↓·Alt+↓ = 열기 / 목록에서 ↑↓·Home·End 이동, Enter·Space 선택, Esc 닫기, Tab 닫기, 글자 입력 = 그 글자로 시작하는 항목
       바깥 클릭·창 크기 변경 시 닫힘, 열려 있는 동안 메인 풀스크린 섹션 넘김 잠금(html.is-select-open — fullpage.js)
     모바일·태블릿(터치): 기기 기본 선택창
     필수(required) select 의 빈 값 항목('지점 선택' 등 안내 문구)은 목록에서 뺀다. 빈 값이 의미 있는 select(관리자 '전체 지점')는 그대로 */
  const pcPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const CHECK_ICON = '<svg class="select-list__check" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5"/></svg>';
  const BRANCH_OF = (opt) => (opt.value === 'changwon' || opt.text.trim() === '창원점' ? 'changwon' : opt.value === 'masan' || opt.text.trim() === '마산점' ? 'masan' : '');
  let openSelect = null; // { select, list, close }
  let selectSeq = 0;
  function enhanceSelect(select) {
    if (select.dataset.enhanced || select.multiple || select.size > 1) return;
    select.dataset.enhanced = '1';
    select.classList.add('form__select');
    const listId = `select-list-${++selectSeq}`;

    function open() {
      if (openSelect) openSelect.close(false);
      const opts = [...select.options].filter((o) => !(select.required && o.value === '') && !o.hidden);
      const list = document.createElement('ul');
      list.className = 'select-list';
      list.id = listId;
      list.setAttribute('role', 'listbox');
      list.tabIndex = -1;
      const label = select.labels?.[0]?.textContent.replace('*', '').trim() || select.getAttribute('aria-label') || '';
      if (label) list.setAttribute('aria-label', label);
      list.innerHTML = opts.map((o, i) => {
        const branch = BRANCH_OF(o);
        return `<li class="select-list__opt" role="option" id="${listId}-${i}" data-i="${i}" aria-selected="${o.selected}"${o.disabled ? ' aria-disabled="true"' : ''}>${branch ? `<span class="select-list__dot select-list__dot--${branch}" aria-hidden="true"></span>` : ''}<span class="select-list__text">${esc(o.text)}</span>${CHECK_ICON}</li>`;
      }).join('');
      document.body.appendChild(list);
      const items = [...list.children];

      // 위치: select 바로 아래(아래 공간이 모자라면 위), 폭 = select 폭
      const r = select.getBoundingClientRect();
      list.style.minWidth = `${r.width}px`;
      list.style.left = `${r.left + window.scrollX}px`;
      const below = window.innerHeight - r.bottom, h = list.offsetHeight;
      if (below < h + 12 && r.top > below) { list.style.top = `${r.top + window.scrollY - h - 4}px`; list.classList.add('is-up'); }
      else list.style.top = `${r.bottom + window.scrollY + 4}px`;

      let active = Math.max(0, opts.findIndex((o) => o.selected));
      const setActive = (i, scroll = true) => {
        if (i < 0 || i >= items.length) return;
        items[active]?.classList.remove('is-active');
        active = i;
        items[i].classList.add('is-active');
        list.setAttribute('aria-activedescendant', items[i].id);
        if (scroll) items[i].scrollIntoView({ block: 'nearest' });
      };
      const choose = (i) => {
        const o = opts[i];
        if (!o || o.disabled) return;
        const changed = select.value !== o.value || !o.selected;
        o.selected = true;
        close(true);
        if (changed) {
          select.dispatchEvent(new Event('input', { bubbles: true }));
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };
      function close(refocus) {
        if (openSelect?.select !== select) return;
        openSelect = null;
        list.remove();
        select.setAttribute('aria-expanded', 'false');
        select.removeAttribute('aria-controls');
        document.documentElement.classList.remove('is-select-open');
        document.removeEventListener('pointerdown', onOutside, true);
        window.removeEventListener('resize', onResize);
        if (refocus) select.focus({ preventScroll: true });
      }
      const onOutside = (e) => { if (!list.contains(e.target) && e.target !== select) close(false); };
      const onResize = () => close(false);
      let typed = '', typedAt = 0;
      list.addEventListener('keydown', (e) => {
        const k = e.key;
        if (k === 'ArrowDown') { e.preventDefault(); setActive(Math.min(items.length - 1, active + 1)); }
        else if (k === 'ArrowUp') { e.preventDefault(); if (e.altKey) choose(active); else setActive(Math.max(0, active - 1)); }
        else if (k === 'Home' || k === 'PageUp') { e.preventDefault(); setActive(0); }
        else if (k === 'End' || k === 'PageDown') { e.preventDefault(); setActive(items.length - 1); }
        else if (k === 'Enter' || k === ' ') { e.preventDefault(); choose(active); }
        else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
        else if (k === 'Tab') { close(false); select.focus({ preventScroll: true }); } // 기본 Tab 이동은 select 기준으로 다음 칸
        else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { // 글자 입력: 그 글자로 시작하는 항목
          const now = performance.now();
          typed = now - typedAt > 700 ? k : typed + k;
          typedAt = now;
          const start = typed.length === 1 ? active + 1 : active;
          const order = [...opts.keys()].map((n) => (n + start) % opts.length);
          const hit = order.find((n) => opts[n].text.trim().startsWith(typed));
          if (hit !== undefined) setActive(hit);
        }
      });
      list.addEventListener('mousemove', (e) => { const li = e.target.closest('.select-list__opt'); if (li) setActive(Number(li.dataset.i), false); });
      list.addEventListener('mousedown', (e) => e.preventDefault()); // 누르는 동안 포커스가 목록 밖으로 나가지 않게
      list.addEventListener('click', (e) => { const li = e.target.closest('.select-list__opt'); if (li) choose(Number(li.dataset.i)); });

      select.setAttribute('aria-expanded', 'true');
      select.setAttribute('aria-controls', listId);
      document.documentElement.classList.add('is-select-open');
      document.addEventListener('pointerdown', onOutside, true);
      window.addEventListener('resize', onResize);
      openSelect = { select, list, close };
      setActive(active);
      list.focus({ preventScroll: true });
    }

    select.setAttribute('aria-expanded', 'false');
    select.addEventListener('mousedown', (e) => {
      if (!pcPointer.matches || e.button !== 0 || select.disabled) return; // 터치 기기 = 기본 선택창
      e.preventDefault(); // 기본 펼침 목록 대신
      if (openSelect?.select === select) { openSelect.close(true); return; }
      select.focus({ preventScroll: true });
      open();
    });
    select.addEventListener('keydown', (e) => {
      if (!pcPointer.matches || select.disabled) return;
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key) || (e.altKey && e.key === 'ArrowDown')) { e.preventDefault(); open(); }
    });
  }
  function initSelects(scope = document) { scope.querySelectorAll('select').forEach(enhanceSelect); }
  initSelects();

  window.UI = { esc, telHref, img, bg, formatDate, branchBadge, accordion, faqItem, rollText, inquiryForm, initSelects, deliveryReady, demoText, demoHtml, dialog, confirm: confirmDialog, alert: alertDialog };

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
    fillBookingLinks();
    renderFooterBranches();
    renderBranchBar();
    initCallSheet();
    initRollText(); // 헤더·푸터 등 컴포넌트 안의 .roll-text
  });

  function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;
    // 메인·배너 있는 서브(has-lnb): 최상단에서는 배너 위 투명 헤더(main.css '투명 헤더' · common.css '서브 투명 헤더'), 40px 이상 스크롤하면 흰 헤더
    // 그 밖의 서브(FAQ·상담·회원 등): 처음부터 흰 헤더, 10px 부터 그림자만 진하게
    // 커뮤니티는 LNB 는 있지만 배너가 없어(글 우선) 흰 헤더 쪽
    const transparent = document.body.classList.contains('is-main') || (document.body.classList.contains('has-lnb') && !!document.querySelector('.sub-visual'));
    const limit = transparent ? 40 : 10;
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
    // 메가메뉴를 열 때는 헤더 배경·글자색을 전환 효과 없이 바로 (마우스 hover·키보드 포커스·닫힌 뒤 투명 복귀는 0.25s 전환, main.css) — 다음 화면 그리기 뒤에 .is-instant 해제
    const instant = () => { header.classList.add('is-instant'); requestAnimationFrame(() => requestAnimationFrame(() => header.classList.remove('is-instant'))); };
    const open = () => { clearTimeout(timer); clearTimeout(closingTimer); header.classList.remove('is-closing'); if (!header.classList.contains('is-mega')) instant(); header.classList.add('is-mega'); };
    // 닫힐 때는 하위 목록이 0.3초 동안 걷히므로, 그동안 메인 투명 헤더가 먼저 투명해지지 않게 .is-closing 으로 흰 헤더 유지
    let closingTimer = null;
    const close = () => {
      clearTimeout(timer);
      if (!header.classList.contains('is-mega')) return;
      header.classList.remove('is-mega');
      header.classList.add('is-closing');
      clearTimeout(closingTimer);
      closingTimer = setTimeout(() => header.classList.remove('is-closing'), 300); // 다 걷힌 뒤 투명 헤더로(0.25s 전환, main.css)
    };
    const closeLater = () => { clearTimeout(timer); timer = setTimeout(close, CLOSE_DELAY); };

    /* 패널 높이 = 가장 긴 하위 메뉴 열(위 28 + 항목 + 아래 32px) — 글자 크기·창 너비(줄바꿈)가 바뀔 때마다 다시 */
    const subs = [...gnb.querySelectorAll('.gnb__sub')];
    /* 열 너비: 기본은 [대메뉴 글자 칸 + 간격](CSS). 하위 메뉴 글자가 더 길면 글자 중심을 지킨 채 양옆으로 넓히되,
       이웃 열 글자와 12px 이상 떨어지는 만큼만 — 그래도 모자라면 열 안에서 줄바꿈 */
    const fitColumns = () => {
      const items = subs.map((s) => s.parentElement);
      subs.forEach((s) => { s.style.removeProperty('left'); s.style.removeProperty('right'); s.style.removeProperty('width'); });
      const slot = subs.map((s) => s.offsetWidth);
      const center = items.map((it) => { const r = it.getBoundingClientRect(); return r.left + r.width / 2; });
      const natural = subs.map((s) => { s.style.width = 'max-content'; const w = s.offsetWidth; s.style.removeProperty('width'); return w; });
      const textHalf = natural.map((w, i) => Math.min(w, slot[i]) / 2 - 12); // 이웃 열 글자 반폭(좌우 안쪽 여백 12px 제외)
      subs.forEach((s, i) => {
        if (natural[i] <= slot[i]) return;
        let half = natural[i] / 2;
        [i - 1, i + 1].forEach((j) => { if (j >= 0 && j < subs.length) half = Math.min(half, Math.abs(center[i] - center[j]) - textHalf[j] - 12); });
        const w = Math.max(slot[i], Math.floor(half * 2));
        s.style.left = `calc(50% - ${w / 2}px)`; s.style.right = 'auto'; s.style.width = `${w}px`;
      });
      // 맨 오른쪽(FAQ) 열: 끊을 수 없는 낱말(상담문의하기 등)이 열보다 길면 오른쪽 바깥으로만 넓힌다(왼쪽 이웃 열 간격은 그대로, 이때만 중심이 조금 어긋남)
      const last = subs[subs.length - 1];
      if (last) {
        const cur = last.offsetWidth;
        last.style.width = 'min-content'; const minW = last.offsetWidth; last.style.width = cur + 'px';
        if (minW > cur) { last.style.left = `calc(50% - ${(last.style.left ? cur : slot[subs.length - 1]) / 2}px)`; last.style.right = 'auto'; last.style.width = `${minW}px`; }
        else if (!last.style.left) last.style.removeProperty('width');
      }
    };
    const fitMegaHeight = () => {
      fitColumns();
      subs.forEach((s) => { s.style.height = 'auto'; });
      const h = Math.max(...subs.map((s) => s.offsetHeight));
      subs.forEach((s) => { s.style.height = ''; });
      if (h > 0) header.style.setProperty('--mega-h', Math.ceil(h) + 'px');
    };
    fitMegaHeight();
    window.addEventListener('resize', fitMegaHeight);
    new MutationObserver(fitMegaHeight).observe(document.documentElement, { attributes: true, attributeFilter: ['data-fs'] });
    document.fonts?.ready.then(fitMegaHeight);

    let escaping = false; // ESC 로 닫으며 포커스를 옮길 때 focusin 으로 다시 열리지 않게

    // 하위 메뉴는 대메뉴(카테고리) 위에 올렸을 때만 펼친다. 대메뉴 줄·펼친 패널을 벗어나면 0.2초 뒤 닫힘
    // (로고·유틸 등 헤더의 다른 곳에서는 열리지 않고, 배경만 흰색으로 바뀐다 — main.css '투명 헤더')
    const mega = header.querySelector('.mega');
    gnb.addEventListener('mouseover', (e) => { if (e.target.closest('.gnb__item')) open(); });
    gnb.addEventListener('mouseleave', closeLater);
    mega?.addEventListener('mouseenter', () => { if (header.classList.contains('is-mega')) open(); }); // 패널 위로 내려오면 유지
    mega?.addEventListener('mouseleave', closeLater);
    // 메인 투명 헤더: 헤더 박스에 마우스를 올리면 흰 배경 — 0.25s 전환 (main.css '투명 헤더')
    // (터치로 누른 뒤 hover 가 남아 흰 헤더로 굳지 않게 마우스일 때만 .is-hover)
    header.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') header.classList.add('is-hover'); });
    header.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') header.classList.remove('is-hover'); });
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
    // 게시판 상세(news-view · notice-view · case-view)는 메뉴에 없어서 그 목록 페이지(news · notice · cases)로 본다. 상담문의 작성(contact-write) = 상담문의하기(contact)
    const here = location.pathname.replace(/\/$/, '/index.html').replace(/\/(news|notice)-view\.html$/, '/$1.html').replace(/\/case-view\.html$/, '/cases.html').replace(/\/contact-write\.html$/, '/contact.html');
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
      if (open) nav.querySelector('.mnav__panel').focus({ preventScroll: true }); // 패널 자체로(테두리 없음) — 키보드는 Tab 으로 닫기 버튼
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
        btn.setAttribute('aria-label', open ? '지점 SNS·예약 메뉴 닫기' : '지점 SNS·예약 메뉴 열기');
      });
      initQuickChips(quick);
      initQuickTop(quick);
    });
  }

  /* TOP(맨 위로): 첫 화면에서는 숨기고 200px 이상 스크롤하면 표시(.is-top-visible), 누르면 맨 위로 부드럽게
     (움직임 줄이기 설정이면 바로 이동). 키보드로 누르면 포커스를 '본문 바로가기' 링크로 옮겨 맨 위에서 다시 시작 */
  function initQuickTop(quick) {
    const btns = quick.querySelectorAll('[data-quick-top]');
    if (!btns.length) return;
    const onScroll = () => quick.classList.toggle('is-top-visible', window.scrollY > 200);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    btns.forEach((btn) => btn.addEventListener('click', (e) => {
      if (window.Fullpage?.isActive()) window.Fullpage.go(0); // 메인 풀스크린 넘김 중이면 첫 섹션으로
      else window.scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' });
      if (quick.classList.contains('is-open')) quick.querySelector('.quick__toggle')?.click(); // 모바일 '+' 닫기
      if (e.detail === 0) document.querySelector('.skip-link')?.focus({ preventScroll: true }); // 키보드(Enter·Space)로 눌렀을 때만
      else btn.blur();
    }));
  }

  /* 769px 이상 플로팅 [인스타그램][블로그][네이버예약] → '창원점 / 마산점' 칩
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

  /** 네이버 예약 링크 채우기 (퀵메뉴 칩 · 모바일 '+' 메뉴, a[data-booking="지점 id"])
      site-data.js branches[].naverBooking — 아직 비어 있으면(TODO) 그 지점 네이버 지도(naverMap)로 대신 연결, 둘 다 없으면 안내 */
  function fillBookingLinks() {
    document.querySelectorAll('[data-booking]').forEach((a) => {
      const b = SITE.branches.find((x) => x.id === a.dataset.booking);
      const url = b?.naverBooking || b?.naverMap;
      if (url) {
        a.href = url;
      } else {
        a.removeAttribute('target');
        a.addEventListener('click', (e) => { e.preventDefault(); alert('예약 링크 준비 중입니다. 전화로 문의해 주세요.'); });
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

  /** 지점 바로가기 바(푸터 바로 위): 칸 전체 = 병원소개 해당 지점 링크(.branch-bar__cover), 그 위에 전화번호(tel) 링크
      칸 내용: 지점명(지점 색) · 전화번호 · '오시는길' 안내 텍스트(화살표는 바깥쪽 — 왼쪽 창원점 ←, 오른쪽 마산점 →)
      진료시간은 바로 아래 푸터에 있어 생략. hover 줄무늬 효과는 common.css '지점 바로가기 바' */
  function renderBranchBar() {
    const box = document.querySelector('[data-branch-bar]');
    if (!box) return;
    box.innerHTML = SITE.branches.map((b) => `
      <div class="branch-bar__item branch-bar__item--${b.id}">
        <a class="branch-bar__cover" href="${root}/about/clinic.html#${b.id}" aria-label="화이트e치과 ${esc(b.name)} 오시는길 (병원소개)"></a>
        <h2 class="branch-bar__name">화이트e치과 <em class="text-${b.id}">${esc(b.name)}</em></h2>
        <a class="branch-bar__tel" href="${telHref(b.tel)}" aria-label="${esc(b.name)} 전화 ${esc(b.tel)}">${esc(b.tel)}</a>
        <p class="branch-bar__more" aria-hidden="true">${b.id === 'changwon' ? '<span class="branch-bar__arrow">←</span> 오시는길' : '오시는길 <span class="branch-bar__arrow">→</span>'}</p>
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
