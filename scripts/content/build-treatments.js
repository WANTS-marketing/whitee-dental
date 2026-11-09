/* ==========================================================================
   진료과목 6개 페이지·메뉴 만들기 — 데이터: assets/data/treatments.json (원고에서 생성: md-to-treatments.js)
   node scripts/content/build-treatments.js

   만드는 것 (모두 같은 데이터, 순서 = treatments.json 순서)
   1) treatment/{slug}.html 6개 — 원고 문장(h1·요약·포인트·기준·단계·FAQ)을 HTML 에 그대로 넣는다(검색엔진·AI 가 JS 없이 읽게)
      + title · description · canonical · og + FAQPage · Dentist(창원점·마산점) 구조화 데이터
      '진료 연결'(지점 탭·주소·전화·진료시간)만 화면에서 site-data.js 로 그린다(pages.js renderTreatmentConnect)
   2) treatment/wisdom-scaling.html — 예전 주소 → wisdom-tooth.html 로 이동 (스케일링·사랑니 두 링크도 표시)
   3) components/header.html 진료과목 하위 메뉴(PC·모바일) — <!-- treatments:menu --> 표시 사이
   4) index.html 메인 진료안내 카드 — <!-- treatments:cards --> 표시 사이
   5) sitemap.xml 진료과목 주소 — <!-- treatments:sitemap --> 표시 사이
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '../..');
const SITE_URL = 'https://wants-marketing.github.io/whitee-dental';
const TODAY = new Date().toISOString().slice(0, 10);
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const write = (p, s) => fs.writeFileSync(path.join(ROOT, p), s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const jsonLd = (o) => `<script type="application/ld+json">\n${JSON.stringify(o, null, 2).replace(/</g, '\\u003c')}\n</script>`;

const DATA = JSON.parse(read('assets/data/treatments.json'));
const T = DATA.treatments;
// 지점 정보(주소·전화·진료시간) — site-data.js 를 그대로 읽는다(푸터·오시는길·히어로 진료시간 카드와 같은 값)
const sandbox = { window: {} };
vm.runInNewContext(read('assets/js/site-data.js'), sandbox);
const BRANCHES = sandbox.window.SITE.branches;

/** 표시 사이 내용 바꾸기 */
function replaceBetween(s, name, inner, file) {
  const re = new RegExp(`(<!-- ${name} -->)[\\s\\S]*?(\\s*<!-- /${name} -->)`, 'g');
  if (!re.test(s)) throw new Error(`${file}: <!-- ${name} --> 표시 없음`);
  return s.replace(re, (m, a, b) => `${a}\n${inner}${b}`);
}

/* ---------- 1) 페이지 ---------- */
const ICON_HOME = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9v11h13V9"/></svg>';

const dentistLd = () => BRANCHES.map((b) => ({
  '@type': 'Dentist',
  '@id': `${SITE_URL}/about/clinic.html#${b.id}`,
  name: b.fullName,
  url: `${SITE_URL}/about/clinic.html`,
  telephone: b.tel,
  address: { '@type': 'PostalAddress', streetAddress: b.address.replace(/^경상남도 창원시 /, ''), addressLocality: '창원시', addressRegion: '경상남도', addressCountry: 'KR' },
  openingHoursSpecification: (b.hours || []).filter((h) => /\d/.test(h.time)).map((h) => {
    const [opens, closes] = h.time.split(/[–~-]/).map((x) => x.trim());
    const days = /^평일|월/.test(h.label) ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] : /^토/.test(h.label) ? ['Saturday'] : [];
    return { '@type': 'OpeningHoursSpecification', dayOfWeek: days, opens, closes };
  }).filter((o) => o.dayOfWeek.length),
}));

function page(t) {
  const url = `${SITE_URL}/treatment/${t.slug}.html`;
  const lnb = T.map((x) => `            <li><a href="${x.slug}.html"${x.slug === t.slug ? ' aria-current="page"' : ''}>${esc(x.nameKo)}</a></li>`).join('\n');
  // 결정 기준 3칸 공통: 한 줄에 한 항목(흰 줄) — [아이콘] 글자. 아이콘: 검사 = 체크 / 선택지 = 오른쪽 화살표 / 질문 = Q
  const CRIT_ICON = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    option: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15M13.5 6l6 6-6 6"/></svg>',
    question: '<b aria-hidden="true">Q</b>',
  };
  const critList = (items, kind) => `<ul class="t-crit__list">${items.map((x) => `<li class="t-crit__item"><span class="t-crit__icon t-crit__icon--${kind}">${CRIT_ICON[kind]}</span><span class="t-crit__text">${esc(x)}</span></li>`).join('')}</ul>`;

  /* ---------- 추가 블록 (기존 상세 기반, treatments.json extras) ---------- */
  const X = t.extras || {};
  /* 이미지 칸: 자리표시(연한 회색 + '파일명 · 권장 크기')를 먼저 그리고, pages.js 가 assets/images/{file}.webp → .jpg → .png 를 찾아
     있으면 그 사진으로 바꾼다(없으면 자리표시 그대로 — 깨진 이미지 아이콘 없음). 파일 목록: docs/IMAGE-SLOTS.md */
  const slot = (s, alt = '', cls = '') => `<div class="t-slot${cls ? ` ${cls}` : ''}" style="aspect-ratio: ${s.ratio}" data-slot="${esc(s.file)}" data-slot-alt="${esc(alt)}"><span class="t-slot__ph" aria-hidden="true">${esc(s.name)} · ${esc(s.size)}</span></div>`;
  const photoStrip = X.photos ? `
        <!-- 추가 · 사진 띠 (기존 상세 기반, 원고 '추가 블록 — 사진 띠') -->
        <div class="t-photos">
${X.photos.map((p) => `          <figure class="t-photo">${slot(p, "")}<figcaption class="t-photo__cap">${esc(p.caption)}</figcaption></figure>`).join('\n')}
        </div>
` : '';
  /* 이런 경우에도 상담해 보세요 — 탭 갤러리 (2026-11-09): 탭 6개 → 패널 [사진 55% | 글 45%] → ‹ 1 / 6 ›
     패널은 모두 같은 칸에 겹쳐 두어 높이 = 가장 긴 패널(탭을 바꿔도 아래가 들썩이지 않음). 동작: pages.js initTreatmentGallery
     게시: 아니요(네비게이션·자가혈)도 화면에 표시하고 안내 문구(note)를 붙임 — 병원 확인 대기(docs/HOSPITAL-CHECK.md #8) */
  const cases = X.cases || [];
  const caseSection = cases.length ? `
        <!-- 추가 · 이런 경우에도 상담해 보세요 (기존 상세 기반, 원고 '추가 블록') -->
        <section class="t-sec" aria-labelledby="t-cases-title">
          <h2 class="t-sec__title t-sec__title--center" id="t-cases-title">이런 경우에도 상담해 보세요</h2>
          <div class="t-gallery" data-t-gallery>
            <div class="t-gallery__tabs" role="tablist" aria-label="상담해 볼 경우 선택">
${cases.map((c, i) => `              <button type="button" class="t-gallery__tab" role="tab" id="t-case-tab-${i + 1}" aria-controls="t-case-panel-${i + 1}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''}>${esc(c.tab)}</button>`).join('\n')}
            </div>
            <div class="t-gallery__stage" data-t-gallery-stage>
${cases.map((c, i) => `              <div class="t-gallery__panel${i === 0 ? ' is-active' : ''}" role="tabpanel" id="t-case-panel-${i + 1}" aria-labelledby="t-case-tab-${i + 1}"${i ? ' aria-hidden="true"' : ''}>
                ${slot(c.image, '', 't-gallery__img')}
                <div class="t-gallery__text">
                  <span class="t-gallery__no">${String(i + 1).padStart(2, '0')}</span>
                  <h3 class="t-gallery__title">${esc(c.titleMain)}${c.titleSub ? `<span class="t-gallery__sub">${esc(c.titleSub)}</span>` : ''}</h3>
                  <p class="t-gallery__desc">${esc(c.text)}</p>
                  <p class="t-gallery__fits-title">이런 분이라면 상담해 보세요</p>
                  <ul class="t-gallery__fits">${c.fits.map((f) => `<li>${CRIT_ICON.check}<span>${esc(f)}</span></li>`).join('')}</ul>
                  ${c.note ? `<p class="t-gallery__note">${esc(c.note)}</p>` : ''}
                </div>
              </div>`).join('\n')}
            </div>
            <div class="t-gallery__nav">
              <button type="button" class="t-gallery__arrow" data-t-gallery-prev aria-label="이전 경우 보기"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
              <span class="t-gallery__count" aria-live="polite"><b data-t-gallery-now>1</b> / ${cases.length}</span>
              <button type="button" class="t-gallery__arrow" data-t-gallery-next aria-label="다음 경우 보기"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
            </div>
          </div>
        </section>
` : '';
  const labBlock = X.lab ? `
        <!-- 추가 · 기공센터 (기존 상세 공통 블록 F-02 기반, 원고 '추가 블록 — 기공센터') -->
        <section class="t-sec t-lab" aria-labelledby="t-lab-title">
          ${slot(X.lab, "", 't-lab__img')}
          <div class="t-lab__text">
            <span class="t-lab__label">${esc(X.lab.label)}</span>
            <h2 class="t-lab__title" id="t-lab-title">${esc(X.lab.title)}</h2>
            <p class="t-lab__body">${esc(X.lab.text)}</p>
          </div>
        </section>
` : '';
  const stepHtml = (s, i) => {
    const img = X.stepImage && X.stepImage.step === i + 1 ? X.stepImage : null;
    const text = `<h3 class="t-step__title">${esc(s.title)}</h3><p class="t-step__body">${esc(s.body)}</p>`;
    return `            <li class="t-step${img ? ' t-step--media' : ''}"><span class="t-step__no" aria-hidden="true">${i + 1}</span><div${img ? ' class="t-step__media"' : ''}>${img ? `<div>${text}</div>${slot(img, img.alt)}` : text}</div></li>`;
  };
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'MedicalWebPage', '@id': `${url}#page`, url, name: t.seoTitle, description: t.description, inLanguage: 'ko-KR', about: { '@type': 'MedicalProcedure', name: t.nameKo } },
      { '@type': 'FAQPage', '@id': `${url}#faq`, mainEntity: t.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
      ...dentistLd(),
    ],
  };
  return `<!DOCTYPE html>
<html lang="ko" data-root="..">
<head>
  <!-- 이 파일은 scripts/content/build-treatments.js 가 만든다 — 문구는 docs/content/treatments-6-content.md(원고) → assets/data/treatments.json 에서 고칠 것 -->
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(t.seoTitle)}</title>
  <meta name="description" content="${esc(t.description)}">
  <meta name="naver-site-verification" content="9bc82b586e6aa173ce4c34f00fa7825fdf2832b1">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="화이트e치과">
  <meta property="og:title" content="${esc(t.seoTitle)}">
  <meta property="og:description" content="${esc(t.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${SITE_URL}/assets/images/og-image.jpg">
  <meta property="og:locale" content="ko_KR">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="../favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
  <link rel="stylesheet" href="../assets/css/variables.css">
  <link rel="stylesheet" href="../assets/css/common.css">
  <link rel="stylesheet" href="../assets/css/sub.css">
  <script src="../assets/js/config.js" defer></script>
  <script src="../assets/js/site-data.js" defer></script>
  <script src="../assets/js/api.js" defer></script>
  <script src="../assets/js/include.js" defer></script>
  <script src="../assets/js/common.js" defer></script>
  <script src="../assets/js/pages.js" defer></script>
  ${jsonLd(ld)}
</head>
<body class="is-sub has-lnb no-hero" data-page="treatment"> <!-- no-hero: 상단 배너 없음 → 처음부터 흰 헤더, 본문은 헤더 아래 56px (common.css) -->
  <div data-include="header"></div>

  <main id="main">
    <!-- 서브 레이아웃: 왼쪽 LNB(하위 메뉴) + 오른쪽 본문 — 1024px 이하는 본문 위 가로 탭 (common.css '서브 LNB') -->
    <div class="sub-layout container">
      <aside class="lnb">
        <nav class="lnb__nav" aria-label="진료과목 하위 메뉴">
          <div class="lnb__head"><p class="lnb__title">진료과목</p><p class="lnb__en">TREATMENT</p></div>
          <ul class="lnb__list">
${lnb}
          </ul>
        </nav>
      </aside>
      <div class="sub-body t-page">
        <div class="sub-head">
          <ol class="breadcrumb" aria-label="현재 위치">
            <li><a class="breadcrumb__home" href="../index.html" aria-label="홈">${ICON_HOME}</a></li>
            <li>진료과목</li>
            <li aria-current="page">${esc(t.nameKo)}</li>
          </ol>
          <p class="sub-head__title">${esc(t.nameKo)}</p><!-- 페이지 이름(제목 글자) — h1 은 아래 비주얼 박스 원고 문장 하나 -->
          <p class="sub-head__desc">${esc(t.description)}</p>
        </div>

        <!-- 1. 비주얼 박스: 영문 라벨 + h1(원고 H1). 사진 = treatments.json image -->
        <div class="t-visual">
          <img class="t-visual__img${t.visualFlip ? ' t-visual__img--flip' : ''}" src="../assets/images/${esc(t.image)}" alt="">
          <div class="t-visual__text">
            <span class="t-visual__label">${esc(t.labelEn)}</span>
            <h1 class="t-visual__title">${t.h1Break && t.h1.startsWith(t.h1Break) ? `${esc(t.h1Break)}<br>${esc(t.h1.slice(t.h1Break.length).trim())}` : esc(t.h1)}</h1>
          </div>
        </div>

        <!-- 2. 요약 문단 -->
        <p class="t-summary${t.summaryCenter ? ' t-summary--center' : ''}">${(t.summaryBreaks || []).reduce((h, br) => h.replace(esc(br), `${esc(br)}<br class="only-desktop">`), esc(t.summary))}</p>

        <!-- 3. 화이트e치과 진료 포인트 (문장 끝 마침표는 화면에서 붙임 — 원고에는 없음) -->
        <section class="t-sec" aria-labelledby="t-points-title">
          <h2 class="t-sec__title t-sec__title--center" id="t-points-title">화이트e치과 진료 포인트</h2>
          <ol class="t-points">
${t.points.map((p, i) => `            <li class="t-point"><span class="t-point__no">${String(i + 1).padStart(2, '0')}</span><p class="t-point__text">${esc(p)}${/[.?!]$/.test(p) ? '' : '.'}</p></li>`).join('\n')}
          </ol>
        </section>
${photoStrip}
        <!-- 4. 치료를 결정하기 전 알아야 할 기준 -->
        <section class="t-sec" aria-labelledby="t-criteria-title">
          <h2 class="t-sec__title t-sec__title--center" id="t-criteria-title">치료를 결정하기 전 알아야 할 기준</h2>
          <div class="t-criteria">
            <div class="t-crit"><h3 class="t-crit__title">검사에서 확인할 것</h3><div class="t-crit__body">${critList(t.criteria.check, 'check')}</div></div>
            <div class="t-crit"><h3 class="t-crit__title">치료 선택지</h3><div class="t-crit__body">${critList(t.criteria.options, 'option')}${t.criteria.optionsNote ? `<p class="t-crit__note">${esc(t.criteria.optionsNote)}</p>` : ''}</div></div>
            <div class="t-crit"><h3 class="t-crit__title">이런 질문을 많이 하세요</h3><div class="t-crit__body">${critList(t.criteria.questions, 'question')}</div></div>
          </div>
        </section>

        <!-- 5. 검사부터 관리까지 (4단계 세로 타임라인) -->
        <section class="t-sec" aria-labelledby="t-steps-title">
          <h2 class="t-sec__title" id="t-steps-title">검사부터 관리까지</h2>
          <ol class="t-steps">
${t.steps.map(stepHtml).join('\n')}
          </ol>
        </section>
${caseSection}
        <!-- 6. 많이 묻는 질문 (아코디언 — 첫 번째만 열림, 내용 = 위 FAQPage 구조화 데이터와 같음) -->
        <section class="t-sec" aria-labelledby="t-faq-title">
          <h2 class="t-sec__title" id="t-faq-title">많이 묻는 질문</h2>
          <ul class="accordion t-faq" data-t-faq>
${t.faq.map((f, i) => `            <li class="accordion__item">
              <button class="accordion__btn" type="button" id="t-faq-q${i}" aria-expanded="${i === 0}" aria-controls="t-faq-a${i}"><span class="accordion__no" aria-hidden="true">Q</span><span class="accordion__q">${esc(f.q)}</span><span class="accordion__icon" aria-hidden="true"></span></button>
              <div class="accordion__panel" id="t-faq-a${i}" role="region" aria-labelledby="t-faq-q${i}"${i === 0 ? ' style="height: auto"' : ''}><p class="accordion__a">${esc(f.a)}</p></div>
            </li>`).join('\n')}
          </ul>
        </section>
${labBlock}
        <!-- 7. 진료 연결 | 창원점 · 마산점 — 지점 탭·주소·전화·진료시간은 pages.js renderTreatmentPage 가 site-data.js 에서 그림 (담당 의료진 줄은 2026-11-09 뺌) -->
        <section class="t-sec t-connect" aria-labelledby="t-connect-title" data-t-connect>
          <h2 class="t-sec__title" id="t-connect-title">진료 연결 <span class="t-connect__sub">창원점 · 마산점</span></h2>
          <p class="t-connect__text">${esc(DATA.common.connectText)}</p>
          <div class="t-connect__box" data-t-connect-box></div>
        </section>

        <!-- 8. 하단 고지 (원고 공통 문구) — 의료진 검수일은 값이 있을 때만 -->
        <div class="t-notice">
          <p>${esc(DATA.common.notice)}</p>
${t.review && t.review.date ? `          <p>${esc(DATA.common.reviewLabel)}: ${esc(t.review.date)}${t.review.reviewer ? ` · ${esc(t.review.reviewer)}` : ''}</p>\n` : ''}        </div>
      </div>
    </div>
  </main>

  <div class="quick quick--float" data-include="quick" data-keep></div>
  <div data-include="footer"></div>
</body>
</html>
`;
}
T.forEach((t) => write(`treatment/${t.slug}.html`, page(t)));

/* ---------- 2) 예전 주소 wisdom-scaling.html → wisdom-tooth.html ---------- */
write('treatment/wisdom-scaling.html', `<!DOCTYPE html>
<html lang="ko" data-root="..">
<head>
  <!-- 예전 주소(사랑니·스케일링 한 페이지) — 2026-11-09 두 페이지로 나눔. scripts/content/build-treatments.js 가 만든다 -->
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>사랑니 발치 | 화이트e치과</title>
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="${SITE_URL}/treatment/wisdom-tooth.html">
  <meta http-equiv="refresh" content="0; url=wisdom-tooth.html">
  <link rel="icon" href="../favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../assets/css/variables.css">
  <link rel="stylesheet" href="../assets/css/common.css">
  <style>.moved { max-width: 520px; margin: 120px auto; padding: 0 24px; text-align: center; line-height: 1.8; } .moved a { color: var(--color-accent); font-weight: 600; text-decoration: underline; } .moved ul { margin-top: 16px; display: flex; justify-content: center; gap: 24px; }</style>
  <script>location.replace('wisdom-tooth.html' + location.hash);</script>
</head>
<body>
  <main class="moved">
    <p>사랑니·스케일링 안내가 두 페이지로 나뉘었습니다. 잠시 후 사랑니 발치 페이지로 이동합니다.</p>
    <ul>
      <li><a href="wisdom-tooth.html">사랑니 발치</a></li>
      <li><a href="scaling.html">스케일링</a></li>
    </ul>
  </main>
</body>
</html>
`);

/* ---------- 3) 헤더 진료과목 하위 메뉴 (PC·모바일) ---------- */
{
  let s = read('components/header.html');
  const items = (indent) => T.map((t) => `${indent}<li><a href="{{ROOT}}/treatment/${t.slug}.html">${esc(t.nameKo)}</a></li>`).join('\n');
  s = replaceBetween(s, 'treatments:menu', items('            '), 'header.html');
  s = replaceBetween(s, 'treatments:mnav', items('          '), 'header.html');
  write('components/header.html', s);
}

/* ---------- 4) 메인 진료안내 카드 ---------- */
{
  let s = read('index.html');
  const ARROW = '<span class="clinic-card__arrow" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3l5 5-5 5"/></svg></span>';
  const cards = T.map((t) => `          <a class="clinic-card clinic-card--${t.slug}" href="./treatment/${t.slug}.html">
            <span class="clinic-card__img img-ph"><img src="./assets/images/${esc(t.image)}" alt="${esc(t.imageAlt)}" loading="lazy"></span>
            <span class="clinic-card__body">
              <strong class="clinic-card__title">${esc(t.nameKo)}</strong>
              <span class="clinic-card__sub">${esc(t.cardSub)}</span>
            </span>
            ${ARROW}
          </a>`).join('\n');
  s = replaceBetween(s, 'treatments:cards', cards, 'index.html');
  write('index.html', s);
}

/* ---------- 5) sitemap ---------- */
{
  let s = read('sitemap.xml');
  s = replaceBetween(s, 'treatments:sitemap', T.map((t) => `  <url><loc>${SITE_URL}/treatment/${t.slug}.html</loc><lastmod>${TODAY}</lastmod></url>`).join('\n'), 'sitemap.xml');
  write('sitemap.xml', s);
}
console.log(`진료과목 ${T.length}개 페이지 + 예전 주소 이동 + 헤더 메뉴 + 메인 카드 + sitemap`);
