/* ==========================================================================
   진료과목 6개 페이지·메뉴 만들기 — 데이터: assets/data/treatments.json (원고에서 생성: md-to-treatments.js)
   node scripts/content/build-treatments.js

   만드는 것 (모두 같은 데이터, 순서 = treatments.json 순서)
   1) treatment/{slug}.html 6개 — 원고 문장(h1·요약·포인트·기준·단계·FAQ)을 HTML 에 그대로 넣는다(검색엔진·AI 가 JS 없이 읽게)
      + title · description · canonical · og + FAQPage · Dentist(창원점·마산점) 구조화 데이터
      '지점 안내'(원고 '진료 연결' — 지점 탭·주소·전화·진료시간·버튼)만 화면에서 site-data.js 로 그린다(pages.js renderTreatmentPage)
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
  /* 이런 경우에도 상담해 보세요 — 펼침형 갤러리 (2026-11-09, 참고: NHN 메인 'Weaving New Play')
     데스크톱(1025px~): 카드 6장 한 줄 — 선택 카드 = 넓게 [사진 | 설명 칸], 나머지 = 120px 띠(사진만). 줄은 본문 시작선에서 화면 오른쪽 끝까지,
       선택 카드가 줄 맨 왼쪽에 오도록 줄 전체가 옆으로 이동(끝 쪽은 오른쪽에 빈칸이 생기지 않게 멈춤). 아래 글자 탭
     1024px 이하: 가로 스와이프 카드(scroll-snap) — [사진 위 | 설명 아래], 높이 = 내용만큼
     동작: pages.js initTreatmentFold · 게시: 아니요(네비게이션·자가혈)도 표시 + 안내 문구(note) — 병원 확인 대기(docs/HOSPITAL-CHECK.md #8) */
  const cases = X.cases || [];
  const caseSection = cases.length ? `
        <!-- 추가 · ${esc(X.casesTitle || '이런 경우에도 상담해 보세요')} (기존 상세 기반, 원고 '추가 블록') -->
        <section class="t-sec" aria-labelledby="t-cases-title">
          <h2 class="sr-only" id="t-cases-title">${esc(X.casesTitle || '이런 경우에도 상담해 보세요')}</h2><!-- 화면 제목은 2026-11-09 삭제(임플란트) — 두 페이지 같은 모양으로 화면낭독기용으로만 남김. 제목 문구는 원고 '### 추가 블록 — 이런 … 상담해 보세요' -->
          <div class="t-fold" data-t-fold>
            <div class="t-fold__viewport" data-t-fold-viewport>
              <div class="t-fold__track" data-t-fold-track>
${cases.map((c, i) => { const no = String(i + 1).padStart(2, '0'); return `                <div class="t-fold__card${i === 0 ? ' is-open' : ''}" role="tabpanel" id="t-case-panel-${i + 1}" aria-labelledby="t-case-tab-${i + 1}">
                  <button type="button" class="t-fold__hit" aria-label="${no} ${esc(c.tab)} 보기"></button>
                  <div class="t-fold__media">${slot(c.image, '')}<span class="t-fold__no" aria-hidden="true">${no}</span>${c.illustrative !== false ? '<span class="t-fold__ill">이미지는 이해를 돕기 위한 예시입니다</span>' : ''}</div>
                  <div class="t-fold__body"${i === 0 ? '' : ' aria-hidden="true"'}><div class="t-fold__inner">
                    <span class="t-fold__num">${no}</span>
                    <h3 class="t-fold__title">${esc(c.titleMain)}${c.titleSub ? `<span class="t-fold__sub">${esc(c.titleSub)}</span>` : ''}</h3>
                    <p class="t-fold__desc">${esc(c.text).split(' / ').join('<br>')}</p>
                    <p class="t-fold__fits-title">이런 분이라면 상담해 보세요</p>
                    <ul class="t-fold__fits">${c.fits.map((f) => `<li>${CRIT_ICON.check}<span>${esc(f)}</span></li>`).join('')}</ul>
                    ${c.note ? `<p class="t-fold__note">${esc(c.note)}</p>` : ''}
                    ${c.caseKey ? `<a class="t-fold__cases" href="../community/cases.html?category=${esc(c.caseKey)}">${esc(c.titleSub || c.tab)} 치료사례 보기 →</a>` : ''}
                  </div></div>
                </div>`; }).join('\n')}
              </div>
            </div>
            <div class="t-fold__tabs" role="tablist" aria-label="상담해 볼 경우 선택">
${cases.map((c, i) => `              <button type="button" class="t-fold__tab" role="tab" id="t-case-tab-${i + 1}" aria-controls="t-case-panel-${i + 1}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''}>${esc(c.tab)}</button>`).join('\n')}
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
  /* 교정 장치 비교 — '검사부터 관리까지' 다음 독립 섹션 (치아교정, 2026-11-09 — 기존 상세 16 표 중 유형 · 겉보기 · 방문 간격만)
     표 하나로 [항목 열 160px | 장치 4열]: 맨 위 줄 = [섹션 제목 + 부제 | 장치 그림 4:3 + 이름 ×4] → 그림과 값 칸이 같은 세로줄
     섹션 가로 중심 = 화면 가운데(갤러리 중심과 같게 — pages.js 가 LNB 만큼 옆으로 옮김, 폭은 본문 칸 그대로)
     표 값의 ' + ' 앞에서 줄바꿈(예: 치아색 브라켓 / + 은색 뚜껑 — 표시만, 모바일 카드는 한 줄)
     768px 이하 = 표를 숨기고 장치별 카드 세로 쌓기(그림 → 이름 → 항목 3줄) — 둘 중 하나만 보임(sub.css)
     단계 '링크 단계' 본문 끝에 '장치별 비교 보기 ↓' (pages.js: 부드럽게 스크롤)
     data-verified="false" = 병원 확인 전(docs/HOSPITAL-CHECK.md #14) — 화면에는 표시 */
  /* 3D 디지털 시스템 (치아교정, 2026-11-09 — 기존 상세 05 기반, 2026-11-10 기존 홈페이지 명칭): 라벨(파랑) + 제목 + 소개 한 줄(모두 가운데)
     → 장비 3칸 표 [그림 4:3 + 이름 + 한 줄 설명, 가운데 정렬] — 위 2px 남색 · 아래 1px 선 · 칸 사이 세로선, 768px 이하 세로 쌓기(sub.css)
     위치: '치료를 결정하기 전 알아야 할 기준' 다음, '검사부터 관리까지' 앞 (위 영역 = 본문 칸) */
  const G = X.digital;
  const digitalSection = G ? `
        <!-- 추가 · ${esc(G.title)} (기존 상세 05 기반, 원고 '추가 블록 — 3D 디지털 시스템') -->
        <section class="t-sec t-digital" aria-labelledby="t-digital-title">
          <span class="t-digital__label">${esc(G.label)}</span>
          <h2 class="t-sec__title t-digital__title" id="t-digital-title">${esc(G.title)}</h2>
          <p class="t-digital__lead">${esc(G.text)}</p>
          <ul class="t-digital__list">
${G.items.map((d) => `            <li class="t-digital__item">${slot(d.image, '')}<h3 class="t-digital__name">${esc(d.name)}</h3><p class="t-digital__text">${esc(d.text)}</p></li>`).join('\n')}
          </ul>
        </section>
` : '';
  const DEV_ROWS = [['유형', 'type'], ['겉보기', 'look'], ['방문 간격', 'visit']];
  const D = X.devices;
  const deviceSection = D ? `
        <!-- 추가 · ${esc(D.title)} (기존 상세 16 기반, 원고 '추가 블록 — 장치 비교') -->
        <section class="t-sec t-devices" id="t-devices" aria-labelledby="t-devices-title">
          <table class="t-devices__table">
            <caption class="sr-only">${esc(D.title)} — ${DEV_ROWS.map((r) => r[0]).join(' · ')}</caption>
            <colgroup><col class="t-devices__col-label">${D.items.map(() => '<col>').join('')}</colgroup>
            <thead><tr><td class="t-devices__head"><h2 class="t-sec__title" id="t-devices-title">${esc(D.title)}</h2>${D.sub ? `<p class="t-devices__sub">${esc(D.sub)}</p>` : ''}</td>${D.items.map((d) => `<th scope="col" data-verified="${d.verified}">${slot(d.image, '')}<span class="t-devices__name">${esc(d.name)}</span></th>`).join('')}</tr></thead>
            <tbody>${DEV_ROWS.map(([label, key]) => `<tr><th scope="row">${label}</th>${D.items.map((d) => `<td>${esc(d[key]).replace(/ \+ /g, '<br>+ ')}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>
          <ul class="t-devices__cards">${D.items.map((d) => `<li class="t-devices__card" data-verified="${d.verified}">${slot(d.image, '')}<p class="t-devices__name">${esc(d.name)}</p><dl>${DEV_ROWS.map(([label, key]) => `<div><dt>${label}</dt><dd>${esc(d[key])}</dd></div>`).join('')}</dl></li>`).join('')}</ul>
          ${D.note ? `<p class="t-devices__note">${esc(D.note)}</p>` : ''}
        </section>
` : '';
  const stepHtml = (s, i) => {
    const img = X.stepImage && X.stepImage.step === i + 1 ? X.stepImage : null;
    const dev = D && D.linkStep === i + 1 ? `<a class="t-step__link" href="#t-devices" data-t-jump>${esc(D.link)}</a>` : '';
    const text = `<h3 class="t-step__title">${esc(s.title)}</h3><p class="t-step__body">${esc(s.body)}</p>${dev}`;
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

${digitalSection}
        <!-- 5. 검사부터 관리까지 (4단계 세로 타임라인) -->
        <section class="t-sec" aria-labelledby="t-steps-title">
          <h2 class="t-sec__title" id="t-steps-title">검사부터 관리까지</h2>
          <ol class="t-steps">
${t.steps.map(stepHtml).join('\n')}
          </ol>
        </section>

${deviceSection}
        <!-- 아래 영역(갤러리 · FAQ · 기공센터 · 진료 연결 · 하단 고지): 폭은 본문 칸 그대로, 화면 1025px 이상에서 가로 중심 = 화면 가운데(= 갤러리 중심) — pages.js [data-t-lower]
             표처럼 본문 성격의 블록(치아교정 장치 비교)은 위 영역(사이드 메뉴 옆 본문 칸)에 둠 -->
        <div class="t-lower" data-t-lower>
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
        <!-- 7. 지점 안내 | 창원점 · 마산점 (원고 '진료 연결') — 지점 탭 + [주소 | 전화 | 진료시간 | 버튼]은 pages.js renderTreatmentPage 가 site-data.js 에서 그림
             담당 의료진은 표시하지 않음(의료진 변동 가능성, 2026-11-10 — specialties 는 데이터로만) -->
        <section class="t-sec t-connect" aria-labelledby="t-connect-title" data-t-connect>
          <h2 class="t-sec__title" id="t-connect-title">지점 안내 <span class="t-connect__sub">창원점 · 마산점</span></h2>
          <p class="t-connect__text">${esc(DATA.common.connectText)}</p>
          <div class="t-connect__box" data-t-connect-box></div>
        </section>

        <!-- 8. 하단 고지 (원고 공통 문구) — 의료진 검수일은 값이 있을 때만 -->
        <div class="t-notice">
          <p>${esc(DATA.common.notice)}</p>
${t.review && t.review.date ? `          <p>${esc(DATA.common.reviewLabel)}: ${esc(t.review.date)}${t.review.reviewer ? ` · ${esc(t.review.reviewer)}` : ''}</p>\n` : ''}        </div>
        </div>
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
