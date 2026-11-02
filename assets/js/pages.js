/* ==========================================================================
   서브페이지 동작 — <body data-page="..."> 값에 따라 필요한 것만 실행
   상담문의 폼([data-inquiry-form])은 어느 페이지에 있든 동작
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  const run = {
    doctors: renderDoctorsPage,
    location: renderLocationPage,
    tour: renderTour,
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
    <section class="doctor-group" id="${b.id}" data-branch="${b.id}" aria-labelledby="doctor-group-${b.id}">
      <h2 class="doctor-group__title" id="doctor-group-${b.id}">화이트e치과 <span class="text-${b.id}">${esc(b.name)}</span> 의료진</h2>
      <div class="doctor-profiles">
        ${window.SITE.getDoctorsByBranch(b.id).map((d) => `
          <article class="doctor-profile" id="${b.id}-${window.SITE.doctorSlug(d)}">
            <div class="doctor-profile__photo img-ph"><img src="${img(d.photo)}" alt="${esc(d.name)} ${esc(d.title)} 사진" loading="lazy"></div>
            <div class="doctor-profile__body">
              <p class="doctor-profile__tag">${branchBadge(d.branches.length > 1 ? 'both' : d.branches[0])}<span class="doctor-profile__dept">${esc(d.dept)}</span></p>
              <h3 class="doctor-profile__name">${esc(d.name)} <small>${esc(d.title)}</small></h3>
              ${d.career?.length ? `<ul class="doctor-profile__career">${d.career.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
            </div>
          </article>`).join('')}
      </div>
    </section>`).join('');
  // 메인 '의료진 자세히 보기'(#changwon-lee-eunju 등)로 들어오면 내용을 그린 뒤 해당 원장으로 이동
  if (location.hash) requestAnimationFrame(() => document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ behavior: 'instant', block: 'start' }));
}

/* ---------- 오시는길 ----------
   지도: about/location.html 의 .loc__map 안에 카카오맵 '지도 퍼가기' 코드를 직접 붙여넣는다 (API 키 불필요).
   퍼가기 코드는 페이지를 읽는 동안 실행돼야 하므로 JS로 넣지 않고 HTML에 둔다. 여기서는 지점 정보·교통편만 채운다. */
function renderLocationPage() {
  if (!document.querySelector('[data-location]')) return;
  const { esc, telHref } = window.UI;
  const DOT = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="4" fill="currentColor"/></svg>';

  window.SITE.branches.forEach((b) => {
    const info = document.querySelector(`[data-loc-info="${b.id}"]`);
    const transit = document.querySelector(`[data-loc-transit="${b.id}"]`);
    if (info) {
      info.innerHTML = `
        <dl>
          <dt>주소</dt><dd><strong>${esc(b.address)} (${esc(b.addressNote)})</strong>${b.landmark ? `<br>${esc(b.landmark)}` : ''}</dd>
          <dt>전화</dt><dd><a class="loc__tel" href="${telHref(b.tel)}">${esc(b.tel)}</a></dd>
          <dt>이메일</dt><dd><a href="mailto:${esc(b.email)}">${esc(b.email)}</a></dd>
          <dt>진료시간</dt><dd><strong>${esc(b.hoursShort)}</strong></dd>
          <dt>주차</dt><dd>${b.parking ? esc(b.parking) : '주차 가능 · 자세한 안내는 전화로 문의해 주세요'}</dd>
          <dt>이용안내</dt><dd><ul class="amenities">${b.amenities.map((a) => `<li>${DOT}${esc(a)}</li>`).join('')}</ul></dd>
        </dl>
        <div class="loc__actions">
          <a class="btn btn--${b.id}" href="${esc(b.naverMap)}" target="_blank" rel="noopener">네이버 지도로 보기</a>
          <a class="btn btn--line" href="${telHref(b.tel)}">전화하기</a>
        </div>`;
    }
    if (transit && b.transit.length) {
      transit.innerHTML = `
        <div class="transit">
          <h3 class="transit__title">교통편 안내</h3>
          <ul class="transit__list">
            ${b.transit.map((t) => `<li class="transit__item"><strong>${esc(t.type)}</strong><div>${t.lines.map((l) => `<p>${esc(l)}</p>`).join('')}</div></li>`).join('')}
          </ul>
        </div>`;
    }
  });
  // 해시(#changwon / #masan)로 들어오면 렌더 후 해당 위치로 이동
  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
}

/* ---------- 병원 둘러보기: 지점 탭 + 갤러리 + 라이트박스 ---------- */
function renderTour() {
  const gallery = document.querySelector('[data-tour-gallery]');
  if (!gallery) return;
  const { esc, img } = window.UI;
  const tabs = [...document.querySelectorAll('.branch-tabs [role="tab"]')];
  let photos = [];

  function show(branch) {
    photos = window.SITE.tour[branch] || [];
    gallery.innerHTML = photos.map((p, i) => `
      <button type="button" class="gallery__item img-ph" data-index="${i}" aria-label="${esc(p.caption)} 크게 보기">
        <img src="${img(p.file)}" alt="${esc(p.caption)}" loading="lazy">
        <span class="gallery__cap">${esc(p.caption)}</span>
      </button>`).join('');
  }
  function select(tab) {
    tabs.forEach((t) => {
      t.setAttribute('aria-selected', String(t === tab));
      t.tabIndex = t === tab ? 0 : -1;
    });
    gallery.setAttribute('aria-labelledby', tab.id);
    show(tab.dataset.branch);
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      next.focus();
      select(next);
    });
  });

  // 라이트박스
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', '사진 크게 보기');
  box.innerHTML = `
    <figure class="lightbox__figure"><img class="lightbox__img" alt=""><figcaption class="lightbox__cap"></figcaption></figure>
    <button type="button" class="lightbox__btn lightbox__close" aria-label="닫기"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 5l14 14M19 5L5 19"/></svg></button>
    <button type="button" class="lightbox__btn lightbox__prev" aria-label="이전 사진"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 5l-7 7 7 7"/></svg></button>
    <button type="button" class="lightbox__btn lightbox__next" aria-label="다음 사진"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></button>`;
  document.body.appendChild(box);
  const lbImg = box.querySelector('.lightbox__img');
  const lbCap = box.querySelector('.lightbox__cap');
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
      box.querySelector('.lightbox__close').focus();
    }
  }
  function close() {
    box.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    opener?.focus();
  }
  gallery.addEventListener('click', (e) => {
    const item = e.target.closest('.gallery__item');
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

  select(tabs[0]);
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
/* FAQ 게시판 — 카테고리(자주 찾는 질문 = featured) + 검색(질문+답변 즉시 필터) + 아코디언
   카테고리 이름은 assets/data/faq.json 의 category 값과 같아야 한다 */
const FAQ_CATS = ['자주 찾는 질문', '전체', '임플란트', '치아교정', '일반치료', '사랑니·스케일링', '심미치료', '진료·예약', '비용'];
async function renderFaqList() {
  const box = document.querySelector('[data-faq-list]');
  if (!box) return;
  const catsEl = document.querySelector('[data-faq-cats]');
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

  function draw() {
    const q = search.value.trim().toLowerCase();
    let list = cat === '자주 찾는 질문' ? rows.filter((r) => r.featured) : cat === '전체' ? rows : rows.filter((r) => r.category === cat);
    if (q) list = list.filter((r) => `${r.question} ${r.answer || ''}`.toLowerCase().includes(q));
    box.innerHTML = list.length
      ? list.map(item).join('')
      : `<li class="faq-list__empty">${q ? '검색 결과가 없습니다.' : '등록된 질문이 없습니다.'}</li>`;
  }

  catsEl.innerHTML = FAQ_CATS.map((c) => `<li><button type="button" class="faq-cats__btn" aria-pressed="${c === cat}">${esc(c)}</button></li>`).join('');
  catsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq-cats__btn');
    if (!btn) return;
    cat = btn.textContent;
    catsEl.querySelectorAll('.faq-cats__btn').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    draw();
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
