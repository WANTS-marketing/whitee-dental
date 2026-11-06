/* ==========================================================================
   관리자 화면 (admin/index.html) — 시안: 로그인 없이 열린다. 실제 운영 시 관리자 인증 필요 (docs/API-SPEC.md)
   상담문의 탭: 목록(전체 항목) · 지점·상태 필터 · 검색(이름·연락처) · 페이지 번호(15개)
     행을 누르면 상세 팝업 → 문의 내용 + 답변 작성칸 + '답변 등록'(상태 자동 답변완료) + 상태 변경 + 삭제(사이트 확인 팝업)
     데이터는 api.js 함수만: adminListInquiries · adminGetInquiry · answerInquiry · updateInquiryStatus · deleteInquiry
   나머지 탭(공지·소식·사례·FAQ): 목록 보기만 — 등록·수정·삭제는 서버 연결 때 (API-SPEC '그 밖의 데이터')
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const { esc, formatDate, branchBadge } = window.UI;
  const titleEl = document.querySelector('[data-admin-title]');
  const thead = document.querySelector('[data-admin-thead]');
  const tbody = document.querySelector('[data-admin-tbody]');
  const branchSel = document.querySelector('[data-admin-branch]');
  const statusSel = document.querySelector('[data-admin-status]');
  const searchInput = document.querySelector('[data-admin-search]');
  const newBtn = document.querySelector('[data-admin-new]');
  const countEl = document.querySelector('[data-admin-count]');
  const pagerEl = document.querySelector('[data-admin-pager]');
  const actions = '<div class="admin__actions"><button type="button" data-todo>수정</button><button type="button" data-todo>삭제</button></div>';
  const STATUS_LABEL = { received: '접수', answered: '답변완료' };
  const pad = (n) => String(n).padStart(2, '0');
  const dateTime = (iso) => { if (!iso) return '-'; const d = new Date(iso); return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const statusBadge = (s) => `<span class="inq-status inq-status--${esc(s)}">${STATUS_LABEL[s] || esc(s)}</span>`;
  const short = (s, n = 40) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n)}…` : t; };

  // 목록만 보는 탭: 제목, 데이터 함수, 컬럼 [머리글, 셀 렌더러]
  const TABS = {
    notice: {
      title: '공지사항', load: () => window.API.getNotices(),
      cols: [['고정', (r) => (r.pinned ? '📌' : '')], ['지점', (r) => branchBadge(r.branch)], ['제목', (r) => esc(r.title), 'is-wrap'], ['작성일', (r) => formatDate(r.date)], ['관리', () => actions]],
    },
    news: {
      title: '치과소식', load: () => window.API.getNews(),
      cols: [['지점', (r) => branchBadge(r.branch)], ['제목', (r) => esc(r.title), 'is-wrap'], ['썸네일', (r) => esc(r.thumbnail)], ['작성일', (r) => formatDate(r.date, true)], ['관리', () => actions]],
    },
    cases: {
      title: '치료사례', load: () => window.API.getCases(),
      cols: [['분류', (r) => esc(r.categoryName)], ['지점', (r) => branchBadge(r.branch)], ['제목', (r) => esc(r.title), 'is-wrap'], ['작성일', (r) => formatDate(r.date)], ['관리', () => actions]],
    },
    faq: {
      title: 'FAQ', load: () => window.API.getFaqs(),
      cols: [['순서', (r) => r.order], ['분류', (r) => esc(r.category)], ['질문', (r) => esc(r.question), 'is-wrap'], ['메인 노출', (r) => (r.featured ? 'O' : '')], ['관리', () => actions]],
    },
  };

  let current = 'inquiries';
  let rows = [];
  let page = 1;

  /* ---------- 상담문의 ---------- */
  const INQ_COLS = ['번호', '접수일', '지점', '경로', '진료과목', '이름', '연락처', '내용', '상태'];
  async function drawInquiries() {
    const res = await window.API.adminListInquiries({ branch: branchSel.value, status: statusSel.value, q: searchInput.value, page });
    thead.innerHTML = `<tr>${INQ_COLS.map((h) => `<th scope="col">${h}</th>`).join('')}</tr>`;
    if (!res.ok) { tbody.innerHTML = `<tr><td colspan="${INQ_COLS.length}" class="empty">${esc(res.error.message)}</td></tr>`; return; }
    const { items, total, totalPages, counts } = res.data;
    page = res.data.page;
    countEl.innerHTML = `전체 <b>${counts.all}</b> · 접수 <b>${counts.received}</b> · 답변완료 <b>${counts.answered}</b>${statusSel.value ? ` — ${STATUS_LABEL[statusSel.value]} ${total}건` : ''}`;
    tbody.innerHTML = items.length ? items.map((r) => `
      <tr class="admin__row" data-inq="${r.id}" tabindex="0" aria-label="${r.id}번 ${esc(r.name)} 문의 상세 열기">
        <td>${r.id}</td><td>${dateTime(r.createdAt)}</td><td>${branchBadge(r.branch)}</td><td>${esc(r.source)}</td><td>${esc(r.treatment)}</td>
        <td>${esc(r.name)}</td><td>${esc(r.phone)}</td><td class="is-wrap">${esc(short(r.content)) || '<span class="admin__none">내용 없음</span>'}</td><td>${statusBadge(r.status)}</td>
      </tr>`).join('') : `<tr><td colspan="${INQ_COLS.length}" class="empty">조건에 맞는 상담이 없습니다.</td></tr>`;
    pagerEl.innerHTML = totalPages > 1 ? Array.from({ length: totalPages }, (_, i) => `<button type="button" class="pager__btn${i + 1 === page ? ' is-current' : ''}" data-admin-page="${i + 1}"${i + 1 === page ? ' aria-current="page"' : ''}>${i + 1}</button>`).join('') : '';
  }

  async function openInquiry(id) {
    const res = await window.API.adminGetInquiry(id);
    if (!res.ok) { window.UI.alert(res.error.message); drawInquiries(); return; }
    const r = res.data;
    const body = `
      <div class="adm-inq">
        <p class="inq-detail__tags">${branchBadge(r.branch)}<span class="inq-detail__treat">${esc(r.treatment)}</span>${statusBadge(r.status)}</p>
        <dl class="adm-inq__info">
          <div><dt>이름</dt><dd>${esc(r.name)}</dd></div>
          <div><dt>연락처</dt><dd><a href="tel:${esc(r.phone.replace(/\D/g, ''))}">${esc(r.phone)}</a></dd></div>
          <div><dt>접수일</dt><dd>${dateTime(r.createdAt)}</dd></div>
          <div><dt>경로</dt><dd>${esc(r.source)}</dd></div>
        </dl>
        <section class="inq-detail__sec"><h3 class="inq-detail__h">문의 내용</h3><p class="inq-detail__text">${r.content ? esc(r.content) : '<span class="inq-detail__none">내용 없음 (빠른상담 — 연락처만 접수)</span>'}</p></section>
        <form class="adm-inq__answer" data-adm-answer novalidate>
          <label class="inq-detail__h" for="adm-answer">답변${r.answeredAt ? ` <span class="inq-detail__date">최근 등록 ${dateTime(r.answeredAt)}</span>` : ''}</label>
          <textarea class="form__textarea" id="adm-answer" name="answer" maxlength="2000" placeholder="답변을 입력하면 상담 현황에서 본인(비밀번호 확인)에게만 보입니다.">${esc(r.answer)}</textarea>
          <p class="form__msg" role="status" data-adm-msg></p>
          <div class="adm-inq__bar">
            <button class="btn btn--point" type="submit">${r.answer ? '답변 수정' : '답변 등록'}</button>
            <span class="adm-inq__status">
              <label class="sr-only" for="adm-status">상태</label>
              <select class="form__select" id="adm-status" data-adm-status>${Object.entries(STATUS_LABEL).map(([v, l]) => `<option value="${v}"${v === r.status ? ' selected' : ''}>${l}</option>`).join('')}</select>
              <button class="btn btn--line" type="button" data-adm-status-save>상태 변경</button>
            </span>
            <button class="btn btn--danger adm-inq__del" type="button" data-adm-delete>삭제</button>
          </div>
        </form>
      </div>`;
    window.UI.dialog({
      title: `${r.id}번 ${r.title}`, body, wide: true,
      onOpen: ({ panel, close }) => {
        const form = panel.querySelector('[data-adm-answer]');
        const msg = panel.querySelector('[data-adm-msg]');
        const setMsg = (t, type) => { msg.textContent = t; msg.className = `form__msg${type ? ` is-${type}` : ''}`; };
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const out = await window.API.answerInquiry(r.id, form.elements.answer.value);
          if (!out.ok) { setMsg(out.error.message, 'error'); form.elements.answer.focus(); return; }
          setMsg('답변을 등록했습니다. 상태가 답변완료로 바뀌었습니다.', 'success');
          panel.querySelector('[data-adm-status]').value = 'answered';
          panel.querySelector('.inq-detail__tags .inq-status').outerHTML = statusBadge('answered');
          form.querySelector('[type="submit"]').textContent = '답변 수정';
          drawInquiries();
        });
        panel.querySelector('[data-adm-status-save]').addEventListener('click', async () => {
          const v = panel.querySelector('[data-adm-status]').value;
          const out = await window.API.updateInquiryStatus(r.id, v);
          if (!out.ok) { setMsg(out.error.message, 'error'); return; }
          setMsg(`상태를 '${STATUS_LABEL[v]}'(으)로 바꿨습니다.`, 'success');
          panel.querySelector('.inq-detail__tags .inq-status').outerHTML = statusBadge(v);
          drawInquiries();
        });
        panel.querySelector('[data-adm-delete]').addEventListener('click', async () => {
          const yes = await window.UI.confirm(`${r.id}번 ${r.name} 님의 문의를 삭제할까요? 삭제하면 되돌릴 수 없습니다.`, { title: '상담 삭제', okLabel: '삭제', danger: true });
          if (!yes) return;
          const out = await window.API.deleteInquiry(r.id);
          if (!out.ok) { setMsg(out.error.message, 'error'); return; }
          close(null);
          drawInquiries();
        });
        form.elements.answer.focus({ preventScroll: true });
      },
    });
  }

  /* ---------- 나머지 탭 (목록만) ---------- */
  function drawList() {
    const tab = TABS[current];
    const branch = branchSel.value;
    const q = searchInput.value.trim();
    const filtered = rows.filter((r) =>
      (!branch || !r.branch || r.branch === branch || r.branch === 'both') &&
      (!q || JSON.stringify(r).includes(q)));
    countEl.innerHTML = `총 <b>${filtered.length}</b>건`;
    pagerEl.innerHTML = '';
    thead.innerHTML = `<tr>${tab.cols.map(([h]) => `<th scope="col">${h}</th>`).join('')}</tr>`;
    tbody.innerHTML = filtered.length
      ? filtered.map((r) => `<tr>${tab.cols.map(([, fn, cls]) => `<td${cls ? ` class="${cls}"` : ''}>${fn(r)}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${tab.cols.length}" class="empty">데이터가 없습니다.</td></tr>`;
  }
  const draw = () => (current === 'inquiries' ? drawInquiries() : drawList());

  async function select(key) {
    current = key;
    page = 1;
    titleEl.textContent = key === 'inquiries' ? '상담문의' : TABS[key].title;
    document.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === key));
    statusSel.hidden = key !== 'inquiries';
    newBtn.hidden = key === 'inquiries'; // 상담은 홈페이지 폼으로만 들어온다
    searchInput.placeholder = key === 'inquiries' ? '이름·연락처 검색' : '검색';
    if (key !== 'inquiries') {
      try { rows = await TABS[key].load(); } catch (err) { console.error(err); rows = []; }
    }
    draw();
  }

  document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => select(b.dataset.tab)));
  [branchSel, statusSel].forEach((el) => el.addEventListener('change', () => { page = 1; draw(); }));
  searchInput.addEventListener('input', () => { page = 1; draw(); });
  pagerEl.addEventListener('click', (e) => { const b = e.target.closest('[data-admin-page]'); if (b) { page = Number(b.dataset.adminPage); draw(); } });
  tbody.addEventListener('click', (e) => { const tr = e.target.closest('[data-inq]'); if (tr && !e.target.closest('a')) openInquiry(Number(tr.dataset.inq)); });
  tbody.addEventListener('keydown', (e) => { const tr = e.target.closest('[data-inq]'); if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openInquiry(Number(tr.dataset.inq)); } });
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-todo], [data-admin-new]')) window.UI.alert('등록·수정·삭제는 서버 연결 후 제공됩니다. (docs/API-SPEC.md)');
  });

  select(current);
});
