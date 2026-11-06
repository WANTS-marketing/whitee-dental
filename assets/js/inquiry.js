/* ==========================================================================
   상담문의 목록 (FAQ > 상담문의하기 = faq/contact.html) — pages.js 가 InquiryBoard.init() 을 부른다. 스타일: common.css '상담 현황'
   데이터는 api.js 함수만 쓴다: listInquiries({ branch, page }) · getInquiry(id, password)  (저장 방식은 몰라도 됨 — docs/API-SPEC.md)
   글쓰기는 따로: faq/contact-write.html (전송 성공 → 이 목록으로 돌아와 방금 쓴 글 강조)

   도구 줄 [총 N건 · 지점 칩(전체 / 창원점 / 마산점, 선택 = --color-accent) | 상담문의하기 →] → 목록 → 페이지 번호(한 페이지 15개) → [상담문의하기 →]
     '내 문의': 이 탭에서 쓴 글(sessionStorage witee-inquiry-mine — common.js 폼이 남김) 제목 옆 표시. 방금 쓴 글(witee-inquiry-just)은 옅은 파랑 배경으로 잠깐 강조
     PC: 표 [번호 | 지점 | 진료과목 | 제목(자물쇠) | 작성자(김○○) | 상태 | 작성일]
     모바일(768px 이하): 같은 표를 카드형으로 [지점 · 상태 / 제목 / 작성자 · 날짜]
   상태(지점·페이지)는 주소에 남긴다 → ?branch=masan&page=2 (뒤로가기·새로고침 그대로)
   행을 누르면 비밀번호 팝업(UI.dialog) → 맞으면 같은 팝업에 본인 문의 내용·답변 (연락처는 010-****-5678)
     틀리면 '비밀번호가 일치하지 않습니다.' / 같은 글에서 5회 연속 틀리면 30초 입력 제한 (sessionStorage — 화면 쪽 처리일 뿐,
     실제 제한은 서버가 해야 한다: API-SPEC '서버에서 반드시 처리할 것')
   ========================================================================== */
(function () {
  const BRANCHES = [{ id: '', name: '전체' }, { id: 'changwon', name: '창원점' }, { id: 'masan', name: '마산점' }];
  const STATUS_LABEL = { received: '접수', answered: '답변완료' };
  const MAX_FAIL = 5;
  const LOCK_SEC = 30;
  const FAIL_KEY = 'witee-inquiry-fail';
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = (n) => String(n).padStart(2, '0');
  const fullDate = (iso) => { const d = new Date(iso); return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`; };
  const dateTime = (iso) => { const d = new Date(iso); return `${fullDate(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };

  const ICON = {
    lock: '<svg class="inq-lock" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  };

  /* ---------- 비밀번호 틀린 횟수 (화면 쪽) ---------- */
  const readFails = () => { try { return JSON.parse(sessionStorage.getItem(FAIL_KEY)) || {}; } catch (e) { return memFails; } };
  let memFails = {};
  const writeFails = (v) => { memFails = v; try { sessionStorage.setItem(FAIL_KEY, JSON.stringify(v)); } catch (e) { /* 메모리만 */ } };
  const lockLeft = (id) => { const f = readFails()[id]; return f && f.until > Date.now() ? Math.ceil((f.until - Date.now()) / 1000) : 0; };
  function addFail(id) {
    const all = readFails();
    const f = all[id] && !(all[id].until && all[id].until <= Date.now()) ? all[id] : { count: 0 };
    f.count += 1;
    if (f.count >= MAX_FAIL) { f.until = Date.now() + LOCK_SEC * 1000; f.count = 0; }
    all[id] = f;
    writeFails(all);
    return f;
  }
  const clearFail = (id) => { const all = readFails(); delete all[id]; writeFails(all); };

  function init() {
    const root = document.querySelector('[data-inquiry-board]');
    if (!root) return;
    const { esc, branchBadge } = window.UI;
    const writeBtn = '<a class="btn inq-board__write" href="contact-write.html">상담문의하기 <span aria-hidden="true">→</span></a>';
    let mine = [];
    try { mine = JSON.parse(sessionStorage.getItem('witee-inquiry-mine') || '[]').map(Number); } catch (e) { /* 표시 없음 */ }
    let just = null;
    try { just = Number(sessionStorage.getItem('witee-inquiry-just')) || null; sessionStorage.removeItem('witee-inquiry-just'); } catch (e) { /* 강조 없음 */ }

    // 방금 작성 페이지에서 접수하고 돌아왔는데 병원에 전달되지 않는 시안이면 목록 위에 안내 (키가 등록되면 안 보임)
    const demoNote = just && !window.UI.deliveryReady() ? `<p class="inq-board__demo" role="status">${window.UI.demoHtml()}</p>` : '';
    root.innerHTML = `${demoNote}
      <div class="inq-board__tools">
        <div class="inq-board__left">
          <p class="inq-board__count" data-i-count aria-live="polite"></p>
          <nav class="board-cats inq-board__cats" aria-label="지점"><ul class="board-cats__list" data-i-cats></ul></nav>
        </div>
        ${writeBtn}
      </div>
      <table class="inq-table">
        <caption class="sr-only">상담 현황 — 제목을 누르고 비밀번호를 입력하면 본인 문의와 답변을 볼 수 있습니다</caption>
        <thead><tr><th scope="col" class="inq-col-no">번호</th><th scope="col" class="inq-col-branch">지점</th><th scope="col" class="inq-col-treat">진료과목</th><th scope="col" class="inq-col-title">제목</th><th scope="col" class="inq-col-name">작성자</th><th scope="col" class="inq-col-status">상태</th><th scope="col" class="inq-col-date">작성일</th></tr></thead>
        <tbody data-i-list><tr><td colspan="7" class="inq-table__empty">불러오는 중입니다.</td></tr></tbody>
      </table>
      <nav class="pager" aria-label="페이지" data-i-pager></nav>
      <div class="inq-board__bottom">${writeBtn}</div>
      <p class="inq-board__note">모든 상담 글은 비밀글입니다. 글을 쓸 때 입력한 비밀번호 4자리로 본인 문의와 답변을 확인할 수 있습니다.</p>`;
    const $ = (s) => root.querySelector(s);
    const catsEl = $('[data-i-cats]'); const countEl = $('[data-i-count]'); const listEl = $('[data-i-list]'); const pagerEl = $('[data-i-pager]'); const table = $('.inq-table');

    const readState = () => {
      const p = new URLSearchParams(location.search);
      const branch = BRANCHES.some((b) => b.id && b.id === p.get('branch')) ? p.get('branch') : '';
      return { branch, page: Math.max(1, parseInt(p.get('page'), 10) || 1) };
    };
    const urlOf = ({ branch, page }) => {
      const p = new URLSearchParams();
      if (branch) p.set('branch', branch);
      if (page > 1) p.set('page', page);
      const s = p.toString();
      return location.pathname + (s ? `?${s}` : '');
    };

    function pagerHtml(page, pages, st) {
      if (pages <= 1) return '';
      const btn = (p, label, cls = '', aria = '') => `<a class="pager__btn ${cls}" href="${esc(urlOf({ ...st, page: p }))}" data-i-page="${p}"${aria}>${label}</a>`;
      const off = (label, cls) => `<span class="pager__btn ${cls} is-disabled" aria-hidden="true">${label}</span>`;
      const gap = '<span class="pager__gap" aria-hidden="true">…</span>';
      let h = page > 1 ? btn(page - 1, ICON.left, 'pager__arrow', ' aria-label="이전 페이지"') : off(ICON.left, 'pager__arrow');
      const from = Math.max(1, Math.min(page - 2, pages - 4));
      const to = Math.min(pages, from + 4);
      const num = (p) => btn(p, p, p === page ? 'is-current' : '', p === page ? ' aria-current="page"' : ` aria-label="${p}페이지"`);
      if (from > 1) { h += num(1); if (from > 2) h += gap; }
      for (let p = from; p <= to; p++) h += num(p);
      if (to < pages) { if (to < pages - 1) h += gap; h += num(pages); }
      h += page < pages ? btn(page + 1, ICON.right, 'pager__arrow', ' aria-label="다음 페이지"') : off(ICON.right, 'pager__arrow');
      return h;
    }

    const statusBadge = (s) => `<span class="inq-status inq-status--${esc(s)}">${STATUS_LABEL[s] || esc(s)}</span>`;
    const rowHtml = (r, no) => `
      <tr class="inq-row${r.id === just ? ' is-just' : ''}" data-i-id="${r.id}">
        <td class="inq-col-no">${no}</td>
        <td class="inq-col-branch">${branchBadge(r.branch)}</td>
        <td class="inq-col-treat">${esc(r.treatment)}</td>
        <td class="inq-col-title"><button class="inq-row__btn" type="button" data-i-open="${r.id}">${ICON.lock}<span class="inq-row__title">${esc(r.title)}</span>${mine.includes(r.id) ? '<span class="inq-mine">내 문의</span>' : ''}<span class="sr-only"> (비밀글, ${STATUS_LABEL[r.status] || ''})</span></button></td>
        <td class="inq-col-name"><span class="sr-only">작성자 </span>${esc(r.maskedName)}</td>
        <td class="inq-col-status">${statusBadge(r.status)}</td>
        <td class="inq-col-date"><time datetime="${esc(r.createdAt)}">${fullDate(r.createdAt)}</time></td>
      </tr>`;

    let current = []; // 지금 보이는 목록 (팝업 제목용)
    async function draw({ animate = false } = {}) {
      const st = readState();
      const [res, ...counts] = await Promise.all([
        window.API.listInquiries({ branch: st.branch, page: st.page }),
        ...BRANCHES.map((b) => window.API.listInquiries({ branch: b.id, perPage: 1 })),
      ]);
      if (!res.ok) { listEl.innerHTML = `<tr><td colspan="7" class="inq-table__empty">${esc(res.error.message)}</td></tr>`; return; }
      const { items, total, page, perPage, totalPages } = res.data;
      current = items;
      catsEl.innerHTML = BRANCHES.map((b, i) => `
        <li><a class="board-cats__btn" href="${esc(urlOf({ branch: b.id, page: 1 }))}" data-i-branch="${b.id}"${b.id === st.branch ? ' aria-current="true"' : ''}>${b.name} <span class="board-cats__n">${counts[i].ok ? counts[i].data.total : ''}</span></a></li>`).join('');
      countEl.innerHTML = `총 <b>${total.toLocaleString('ko-KR')}</b>건`;
      listEl.innerHTML = items.length
        ? items.map((r, i) => rowHtml(r, total - (page - 1) * perPage - i)).join('')
        : '<tr><td colspan="7" class="inq-table__empty">등록된 상담 글이 없습니다.</td></tr>';
      pagerEl.innerHTML = pagerHtml(page, totalPages, st);
      if (just) {
        const row = listEl.querySelector('.inq-row.is-just');
        if (row) { row.querySelector('[data-i-open]').focus({ preventScroll: true }); setTimeout(() => row.classList.add('is-just-fade'), 2400); }
        just = null; // 한 번만
      }
      if (animate) [table, pagerEl].forEach((el) => { el.classList.remove('is-fade-in'); void el.offsetWidth; el.classList.add('is-fade-in'); });
    }
    function toTop() {
      const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
      const y = root.getBoundingClientRect().top + window.scrollY - headerH - 24;
      if (y < window.scrollY) window.scrollTo({ top: Math.max(0, y), behavior: reduceMotion() ? 'auto' : 'smooth' });
    }
    const go = (st, scroll) => { history.pushState(null, '', urlOf(st)); draw({ animate: true }); if (scroll) toTop(); };

    root.addEventListener('click', (e) => {
      const cat = e.target.closest('[data-i-branch]');
      if (cat) { e.preventDefault(); go({ branch: cat.dataset.iBranch, page: 1 }); return; }
      const pg = e.target.closest('[data-i-page]');
      if (pg) { e.preventDefault(); go({ ...readState(), page: Number(pg.dataset.iPage) }, true); return; }
      const row = e.target.closest('.inq-row');
      if (row) { const r = current.find((x) => String(x.id) === row.dataset.iId); if (r) openPost(r, row.querySelector('[data-i-open]')); }
    });
    window.addEventListener('popstate', () => draw({ animate: true }));
    draw();
  }

  /* ---------- 비밀번호 → 본인 문의·답변 팝업 ---------- */
  function openPost(r, opener) {
    const { esc, branchBadge } = window.UI;
    opener?.focus({ preventScroll: true }); // 닫으면 이 행으로 포커스 복귀
    const pwBody = `
      <form class="inq-pw" novalidate>
        <p class="inq-pw__desc">글을 쓸 때 입력한 <b>비밀번호 4자리</b>를 입력해 주세요.</p>
        <label class="sr-only" for="inq-pw-input">비밀번호 (숫자 4자리)</label>
        <input class="form__input inq-pw__input" id="inq-pw-input" name="pw" type="password" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="숫자 4자리" aria-describedby="inq-pw-msg">
        <p class="form__msg inq-pw__msg" id="inq-pw-msg" role="alert"></p>
        <div class="site-dialog__actions">
          <button class="btn btn--line" type="button" data-dialog-close>취소</button>
          <button class="btn btn--point" type="submit">확인</button>
        </div>
      </form>`;
    const detailHtml = (d) => `
      <div class="inq-detail">
        <p class="inq-detail__tags">${branchBadge(d.branch)}<span class="inq-detail__treat">${esc(d.treatment)}</span><span class="inq-status inq-status--${esc(d.status)}">${STATUS_LABEL[d.status] || ''}</span></p>
        <dl class="inq-detail__info">
          <div><dt>작성자</dt><dd>${esc(d.maskedName)}</dd></div>
          <div><dt>연락처</dt><dd>${esc(d.maskedPhone)}</dd></div>
          <div><dt>작성일</dt><dd><time datetime="${esc(d.createdAt)}">${dateTime(d.createdAt)}</time></dd></div>
        </dl>
        <section class="inq-detail__sec">
          <h3 class="inq-detail__h">문의 내용</h3>
          <p class="inq-detail__text">${d.content ? esc(d.content) : '<span class="inq-detail__none">빠른상담으로 접수되어 내용 없이 연락처만 남기셨습니다.</span>'}</p>
        </section>
        <section class="inq-detail__sec inq-detail__sec--answer">
          <h3 class="inq-detail__h">답변${d.answeredAt ? ` <time class="inq-detail__date" datetime="${esc(d.answeredAt)}">${dateTime(d.answeredAt)}</time>` : ''}</h3>
          <p class="inq-detail__text">${d.answer ? esc(d.answer) : '<span class="inq-detail__none">아직 답변이 등록되지 않았습니다. 확인 후 답변드리거나 남겨주신 연락처로 연락드리겠습니다.</span>'}</p>
        </section>
      </div>
      <div class="site-dialog__actions"><button class="btn btn--point" type="button" data-dialog-close>닫기</button></div>`;

    window.UI.dialog({
      title: r.title,
      body: pwBody,
      onOpen: ({ panel, setBody }) => {
        const form = panel.querySelector('.inq-pw');
        const input = form.elements.pw;
        const msg = panel.querySelector('.inq-pw__msg');
        const submit = form.querySelector('[type="submit"]');
        let timer = null;
        const setMsg = (t, type = 'error') => { msg.textContent = t; msg.className = `form__msg inq-pw__msg${t ? ` is-${type}` : ''}`; };
        const showLock = () => {
          const left = lockLeft(r.id);
          input.disabled = submit.disabled = left > 0;
          if (left > 0) { setMsg(`비밀번호를 ${MAX_FAIL}회 잘못 입력했습니다. ${left}초 후 다시 입력해 주세요.`); timer = setTimeout(showLock, 1000); }
          else { if (timer) setMsg(''); timer = null; input.focus({ preventScroll: true }); }
        };
        input.addEventListener('input', () => { const v = input.value.replace(/\D/g, '').slice(0, 4); if (v !== input.value) input.value = v; });
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          if (lockLeft(r.id)) return showLock();
          if (!/^\d{4}$/.test(input.value)) { setMsg('비밀번호 숫자 4자리를 입력해 주세요.'); input.focus(); return; }
          submit.disabled = true;
          const res = await window.API.getInquiry(r.id, input.value);
          submit.disabled = false;
          if (res.ok) {
            clearFail(r.id);
            panel.classList.add('is-detail');
            setBody(detailHtml(res.data));
            panel.querySelector('.site-dialog__body').scrollTop = 0;
            panel.focus({ preventScroll: true });
            return;
          }
          if (res.error.code === 'WRONG_PASSWORD') {
            const f = addFail(r.id);
            input.value = '';
            if (f.until) return showLock();
            setMsg(`${res.error.message} (${f.count}/${MAX_FAIL})`);
            input.focus();
          } else if (res.error.code === 'LOCKED') {
            setMsg(res.error.message);
          } else setMsg(res.error.message);
        });
        showLock();
      },
    });
  }

  window.InquiryBoard = { init };
})();
