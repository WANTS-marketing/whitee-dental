/* ==========================================================================
   서브페이지 동작 — <body data-page="..."> 값에 따라 필요한 것만 실행
   상담문의 폼([data-inquiry-form])은 어느 페이지에 있든 동작
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  const run = {
    doctors: renderDoctorsPage,
    location: renderLocationPage,
    notice: renderNoticeList,
    news: renderNewsList,
    cases: renderCasesList,
    faq: renderFaqList,
  }[page];
  run?.();
  document.querySelectorAll('[data-inquiry-form]').forEach(initInquiryForm);
  document.querySelectorAll('[data-kakao-login]').forEach((btn) => btn.addEventListener('click', () => window.API.signInWithKakao()));
});

/* ---------- 의료진 소개 ---------- */
function renderDoctorsPage() {
  const box = document.querySelector('[data-doctors-page]');
  if (!box) return;
  const { esc, img, branchBadge } = window.UI;
  box.innerHTML = window.SITE.branches.map((b) => `
    <section class="doctor-group" id="${b.id}" aria-labelledby="doctor-group-${b.id}">
      <h2 class="doctor-group__title" id="doctor-group-${b.id}">화이트e치과 <span class="text-${b.id}">${esc(b.name)}</span> 의료진</h2>
      <ul class="card-grid">
        ${window.SITE.getDoctorsByBranch(b.id).map((d) => `
          <li class="doctor-item">
            <div class="doctor-item__photo img-ph"><img src="${img(d.photo)}" alt="${esc(d.name)} ${esc(d.title)} 사진" loading="lazy"></div>
            <p class="doctor-item__tag">${branchBadge(d.branches.length > 1 ? 'both' : d.branches[0])}</p>
            <h3 class="doctor-item__name">${esc(d.name)} <small>${esc(d.title)}</small></h3>
            <p class="doctor-item__dept">${esc(d.dept)}</p>
            <!-- TODO: 약력·학회 활동 (병원 자료 받으면 추가) -->
          </li>`).join('')}
      </ul>
    </section>`).join('');
}

/* ---------- 오시는길 ---------- */
function renderLocationPage() {
  const box = document.querySelector('[data-location]');
  if (!box) return;
  const { esc, telHref, img } = window.UI;
  box.innerHTML = window.SITE.branches.map((b) => `
    <article class="branch-card branch-card--${b.id}" id="${b.id}">
      <h2 class="branch-card__name">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>
        화이트e치과 <em>${esc(b.name)}</em></h2>
      <p class="branch-card__addr">${esc(b.address)}<br>(${esc(b.addressNote)})</p>
      <a class="branch-card__tel" href="${telHref(b.tel)}">
        <svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" opacity=".45" d="M7 6h4l2.5 6-3 2a14 14 0 006.5 6.5l2-3 6 2.5v4a3 3 0 01-3 3A21 21 0 014 9a3 3 0 013-3z"/><circle cx="23" cy="8" r="5" fill="currentColor"/></svg>
        ${esc(b.tel)}</a>
      <p class="branch-card__hours"><strong>진료시간</strong>${b.hours.map((h) => `${esc(h.label)} ${esc(h.time)}`).join(' · ')}</p>
      <!-- TODO: 지도 — 네이버 지도 API 키 발급 후 임베드, 지금은 이미지 자리 -->
      <div class="map-ph img-ph"><img src="${img(`map-${b.id}.jpg`)}" alt="${esc(b.name)} 위치 지도" loading="lazy"></div>
      <div class="branch-card__actions">
        <a class="btn btn--${b.id}" href="${esc(b.naverMap)}" target="_blank" rel="noopener">네이버 지도로 보기</a>
        <a class="btn btn--line" href="${telHref(b.tel)}">전화하기</a>
      </div>
      <!-- TODO: 주차 안내·대중교통 안내 (병원 확인 필요) -->
    </article>`).join('');
  // 해시(#changwon / #masan)로 들어오면 렌더 후 해당 위치로 이동
  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
}

/* ---------- 공지사항 ---------- */
async function renderNoticeList() {
  const list = document.querySelector('[data-notice-list]');
  if (!list) return;
  const { esc, formatDate, branchBadge } = window.UI;
  try {
    const rows = await window.API.getNotices();
    list.innerHTML = rows.length ? rows.map((r, i) => `
      <li class="board__item">
        <span class="board__no">${r.pinned ? '공지' : rows.length - i}</span>
        <span class="board__title">${branchBadge(r.branch)}${esc(r.title)}</span>
        <time class="board__date" datetime="${esc(r.date)}">${formatDate(r.date)}</time>
      </li>`).join('') : '<li class="empty">등록된 공지사항이 없습니다.</li>';
  } catch (err) {
    console.error(err);
    list.innerHTML = '<li class="empty">목록을 불러오지 못했습니다.</li>';
  }
}

/* ---------- 치과소식 ---------- */
async function renderNewsList() {
  const list = document.querySelector('[data-news-list]');
  if (!list) return;
  const { esc, img, formatDate } = window.UI;
  try {
    const rows = await window.API.getNews();
    list.innerHTML = rows.length ? rows.map((n) => `
      <li id="news-${esc(n.id)}">
        <div class="post-card__thumb img-ph"><img src="${img(n.thumbnail)}" alt="${esc(n.title)} 썸네일" loading="lazy"></div>
        <p class="post-card__title">${esc(n.title)}</p>
        <p class="post-card__date"><time datetime="${esc(n.date)}">${formatDate(n.date, true)}</time></p>
      </li>`).join('') : '<li class="empty">등록된 소식이 없습니다.</li>';
  } catch (err) {
    console.error(err);
    list.innerHTML = '<li class="empty">목록을 불러오지 못했습니다.</li>';
  }
}

/* ---------- 치료사례 (로그인 여부에 따라 잠금) ---------- */
async function renderCasesList() {
  const list = document.querySelector('[data-cases-list]');
  if (!list) return;
  const { esc, img, formatDate, branchBadge } = window.UI;
  const loggedIn = window.API.isLoggedIn();
  const category = new URLSearchParams(location.search).get('category');
  try {
    let rows = await window.API.getCases();
    if (category) rows = rows.filter((r) => r.category === category);
    list.innerHTML = rows.length ? rows.map((c) => `
      <li class="case-item${loggedIn ? ' is-unlocked' : ''}">
        <div class="case-item__img img-ph"><img src="${img(c.beforeImage)}" alt="${esc(c.categoryName)} 치료 전 사진${loggedIn ? '' : ' (흐림 처리)'}" loading="lazy">
          ${loggedIn ? '' : '<span class="case-item__lock">로그인 후 확인하실 수 있습니다</span>'}
        </div>
        <p class="post-card__title">${branchBadge(c.branch)}${esc(c.title)}</p>
        <p class="post-card__date">${formatDate(c.date)}</p>
      </li>`).join('') : '<li class="empty">등록된 사례가 없습니다.</li>';
  } catch (err) {
    console.error(err);
    list.innerHTML = '<li class="empty">목록을 불러오지 못했습니다.</li>';
  }
  const notice = document.querySelector('[data-cases-login]');
  if (notice) notice.hidden = loggedIn;
}

/* ---------- 자주 묻는 질문 ---------- */
async function renderFaqList() {
  const box = document.querySelector('[data-faq-list]');
  if (!box) return;
  try {
    const rows = await window.API.getFaqs();
    box.innerHTML = rows.map((f, i) => window.UI.faqItem(f, i, 'faq')).join('');
    window.UI.accordion(box);
  } catch (err) {
    console.error(err);
    box.innerHTML = '<li class="empty">질문을 불러오지 못했습니다.</li>';
  }
}

/* ---------- 상담문의 폼 (상담문의하기 · 빠른상담 공용) ---------- */
function initInquiryForm(form) {
  const msg = form.querySelector('.form__msg');
  const submitBtn = form.querySelector('[type="submit"]');
  const setMsg = (text, type) => {
    msg.textContent = text;
    msg.className = `form__msg${type ? ` is-${type}` : ''}`;
  };

  // 연락처: 숫자만 받아 하이픈 자동 입력
  const phone = form.elements.phone;
  phone?.addEventListener('input', () => {
    const d = phone.value.replace(/\D/g, '').slice(0, 11);
    phone.value = d.length < 4 ? d : d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}` : `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = form.elements;

    // 허니팟: 사람에게는 보이지 않는 칸 — 값이 있으면 봇으로 보고 조용히 종료
    if (f.website.value) {
      setMsg('상담 신청이 접수되었습니다.', 'success');
      form.reset();
      return;
    }
    if (!form.reportValidity()) return;
    if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(f.phone.value)) {
      setMsg('연락처를 정확히 입력해 주세요. (예: 010-1234-5678)', 'error');
      f.phone.focus();
      return;
    }

    submitBtn.disabled = true;
    setMsg('전송 중입니다…');
    try {
      const result = await window.API.submitInquiry({
        branch: f.branch.value,
        treatment: f.treatment.value,
        name: f.name.value.trim(),
        phone: f.phone.value,
        message: f.message?.value.trim(),
        source: form.dataset.inquiryForm || '상담문의',
      });
      setMsg(result.message, result.ok ? 'success' : 'error');
      if (result.ok) form.reset();
    } catch (err) {
      console.error(err);
      setMsg('전송에 실패했습니다. 잠시 후 다시 시도하거나 전화로 문의해 주세요.', 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}
