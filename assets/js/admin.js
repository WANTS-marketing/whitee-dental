/* ==========================================================================
   관리자 화면 (1차: 목록 UI만 — 저장·수정·삭제는 2차 Supabase 연동 때 연결)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const { esc, formatDate, branchBadge } = window.UI;
  const titleEl = document.querySelector('[data-admin-title]');
  const thead = document.querySelector('[data-admin-thead]');
  const tbody = document.querySelector('[data-admin-tbody]');
  const branchSel = document.querySelector('[data-admin-branch]');
  const searchInput = document.querySelector('[data-admin-search]');
  const actions = '<div class="admin__actions"><button type="button" data-todo>수정</button><button type="button" data-todo>삭제</button></div>';

  // 탭별: 제목, 데이터 함수, 컬럼 [머리글, 셀 렌더러]
  const TABS = {
    inquiries: {
      title: '상담문의', load: () => window.API.getInquiries(),
      cols: [
        ['접수일', (r) => formatDate(r.date, true)],
        ['지점', (r) => branchBadge(r.branch)],
        ['경로', (r) => esc(r.source)],
        ['진료과목', (r) => esc(r.treatment)],
        ['이름', (r) => esc(r.name)],
        ['연락처', (r) => esc(r.phone)],
        ['내용', (r) => esc(r.message || '-'), 'is-wrap'],
        ['상태', (r) => `<span class="admin__status admin__status--${r.status}">${r.status === 'done' ? '연락완료' : '신규'}</span>`],
      ],
    },
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

  function draw() {
    const tab = TABS[current];
    const branch = branchSel.value;
    const q = searchInput.value.trim();
    const filtered = rows.filter((r) =>
      (!branch || !r.branch || r.branch === branch || r.branch === 'both') &&
      (!q || JSON.stringify(r).includes(q)));
    thead.innerHTML = `<tr>${tab.cols.map(([h]) => `<th scope="col">${h}</th>`).join('')}</tr>`;
    tbody.innerHTML = filtered.length
      ? filtered.map((r) => `<tr>${tab.cols.map(([, fn, cls]) => `<td${cls ? ` class="${cls}"` : ''}>${fn(r)}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${tab.cols.length}" class="empty">데이터가 없습니다.</td></tr>`;
  }

  async function select(key) {
    current = key;
    titleEl.textContent = TABS[key].title;
    document.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === key));
    try {
      rows = await TABS[key].load();
    } catch (err) {
      console.error(err);
      rows = [];
    }
    draw();
  }

  document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => select(b.dataset.tab)));
  branchSel.addEventListener('change', draw);
  searchInput.addEventListener('input', draw);
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-todo], [data-admin-new]')) alert('2차(Supabase 연동)에서 제공될 기능입니다.');
  });

  select(current);
});
