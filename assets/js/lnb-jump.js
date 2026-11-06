/* ==========================================================================
   서브페이지 시작 위치 — 같은 대메뉴 안에서 이동하면 본문부터, 그 밖에는 배너 맨 위부터
   (LNB 가 있는 서브페이지 <head> 에서 바로 실행, defer 아님 — 그리기 전에 위치를 정해야 해서)

   대메뉴 = 주소의 폴더: about(화이트e치과) · treatment(진료과목) · community(커뮤니티)
   ※ 커뮤니티·상담문의(faq/contact · contact-write) 페이지는 배너가 없어(글 우선) 이 스크립트를 넣지 않는다 — 항상 맨 위(= 바로 LNB·본문)부터

   1) 기록: 서브페이지에서 링크를 누르면 sessionStorage 에 {from: 지금 대메뉴, to: 갈 경로, t: 시각} 을 남긴다
      - 기록하는 링크 = LNB(PC 세로 메뉴 · 1024px 이하 가로 탭) · 헤더(대메뉴·메가메뉴 하위 링크·모바일 메뉴) · 본문(배너 제외)
      - 푸터·퀵메뉴 링크와 메인·FAQ·회원 페이지(이 스크립트가 없음)는 기록하지 않음 → 배너 맨 위부터
      - 새 탭·수정키(Ctrl·Shift 등) 클릭, 다른 사이트 링크는 기록하지 않음
   2) 판단: 새 페이지에서 기록을 읽자마자 지우고, 아래를 모두 만족할 때만 본문부터 연다
      - 기록의 to = 지금 경로, 10초 안, 기록의 from = 지금 페이지 대메뉴(같은 대메뉴 안 이동)
      - 일반 이동(뒤로가기·새로고침이면 브라우저 기본 위치 복원 그대로)
   3) 위치(부드러운 스크롤 없이 즉시):
      - PC(1025px~): 흰 헤더 아래 32px 에 LNB 타이틀 블록 윗선 = 본문 경로 줄 윗선 (배너는 헤더 뒤로 완전히 가려짐)
      - 1024px 이하: LNB 가로 탭 윗선이 흰 헤더 바로 아래 (탭이 배너 바로 아래에 붙어 있어 32px 을 띄우면 배너 끝이 띠처럼 보이므로)
      - 배너 높이가 CSS 고정값(common.css '.has-lnb .sub-visual' height)이라 문서를 다 읽은 직후(DOMContentLoaded) 계산해도 위치가 바뀌지 않는다
   4) 깜빡임 방지: 이동할 때까지 화면을 숨기고(html.is-lnb-jump), 공통 헤더·푸터가 들어오기 전 문서가 짧아 위치가 깎이지 않게
      잠깐 최소 높이를 준다(html.is-lnb-hold). 헤더는 들어오는 순간 흰 헤더(.is-scrolled)로 시작(전환 효과 없이)
   - 저장소를 못 쓰는 환경(사생활 보호 모드 등)에서는 아무것도 하지 않음 — 오류 없이 항상 배너 맨 위부터
   ========================================================================== */
(function () {
  var KEY = 'witee-lnb-jump';
  var GAP = 32; // PC: 흰 헤더 아래 ~ LNB 타이틀 블록·경로 줄 윗선 간격

  function groupOf(path) {
    var m = /\/(about|treatment|community)\/[^/]*$/.exec(path || '');
    return m ? m[1] : null;
  }
  var here = groupOf(location.pathname);

  // ---------- 1) 기록 ----------
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    if (!a.closest('.lnb, .header, .mnav, main') || a.closest('.sub-visual, .footer, .quick')) return;
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return; // 같은 페이지 안 바로가기
    try { sessionStorage.setItem(KEY, JSON.stringify({ from: here, to: url.pathname, t: Date.now() })); } catch (err) { /* 저장 불가 */ }
  });

  // ---------- 2) 판단 ----------
  var data = null;
  try {
    data = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    sessionStorage.removeItem(KEY);
  } catch (e) { return; }
  if (!data || !here || data.from !== here || data.to !== location.pathname || !(Date.now() - data.t < 10000)) return;
  if (location.hash) return; // 주소에 #바로가기가 있으면 브라우저가 그 위치로
  try {
    var nav = performance.getEntriesByType('navigation')[0];
    if (nav && nav.type !== 'navigate') return; // 뒤로가기·새로고침 = 브라우저 기본 위치 복원
  } catch (e) { /* 확인 불가 — 그대로 진행 */ }

  // ---------- 3)·4) 이동 ----------
  var root = document.documentElement;
  root.classList.add('is-lnb-jump', 'is-lnb-hold');
  var shown = false;
  function show() {
    if (shown) return;
    shown = true;
    root.classList.remove('is-lnb-jump');
  }
  setTimeout(show, 3000); // 혹시 이동이 늦어져도 화면은 보이게

  // 헤더가 들어오는 순간 흰 헤더로 (투명 → 흰색 전환이 보이지 않게)
  function whiteHeader() {
    var header = document.getElementById('header');
    if (!header) return false;
    header.classList.add('is-instant', 'is-scrolled');
    requestAnimationFrame(function () { requestAnimationFrame(function () { header.classList.remove('is-instant'); }); });
    return true;
  }
  var mo = new MutationObserver(function () { if (whiteHeader()) mo.disconnect(); });
  mo.observe(root, { childList: true, subtree: true });

  document.addEventListener('DOMContentLoaded', function () {
    var lnb = document.querySelector('.lnb');
    if (lnb) {
      var headerH = parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 0;
      var narrow = window.matchMedia('(max-width: 1024px)').matches;
      var lnbTop = lnb.getBoundingClientRect().top + window.scrollY;
      var top = Math.max(0, Math.round(lnbTop - headerH - (narrow ? 0 : GAP)));
      window.scrollTo({ top: top, behavior: 'instant' });
    }
    show();
  });
  // 공통 헤더·푸터까지 들어오면 최소 높이 해제 (실패해도 4초 뒤 해제)
  function release() { root.classList.remove('is-lnb-hold'); }
  document.addEventListener('components:loaded', release, { once: true });
  setTimeout(release, 4000);
})();
