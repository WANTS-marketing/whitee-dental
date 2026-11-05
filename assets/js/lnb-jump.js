/* ==========================================================================
   서브 LNB 로 다른 페이지를 열면 → 새 페이지를 본문 시작 위치에서 연다 (LNB 가 있는 서브페이지 <head> 에서 바로 실행, defer 아님)
   - LNB 메뉴(PC 왼쪽 세로 메뉴 · 1024px 이하 가로 탭)를 눌렀을 때만: common.js initLnb 가 sessionStorage 에 {to: 경로, t: 시각} 을 남긴다
   - 이 스크립트는 표시를 읽자마자 지우고, 같은 주소 + 10초 안 + 일반 이동(뒤로가기·새로고침 아님)일 때만 동작
     → 뒤로가기·새로고침·헤더 메뉴·푸터·메인 링크로 들어오면 지금처럼 맨 위부터(브라우저 기본 위치 복원)
   - 위치 = 배너(.sub-visual) 아래 끝 - 헤더 높이 → 흰 헤더 바로 아래에 LNB 타이틀 블록·경로 줄(모바일은 가로 탭)이 보인다
   - 부드러운 스크롤 없이 즉시. 그리기 전에 위치를 잡도록, 이동할 때까지 화면을 숨겨 둔다(html.is-lnb-jump — common.css)
     문서를 다 읽은 직후(DOMContentLoaded) 이동 → 공통 헤더·푸터는 그 뒤에 들어오므로, 그동안 문서가 짧아 위치가 깎이지 않게
     잠깐 최소 높이를 준다(html.is-lnb-hold). 헤더는 들어오는 순간 흰 헤더(.is-scrolled)로 시작(전환 효과 없이)
   - 저장소를 못 쓰는 환경(사생활 보호 모드 등)에서는 아무것도 하지 않음 — 오류 없이 기본 동작
   ========================================================================== */
(function () {
  var KEY = 'witee-lnb-jump';
  var data = null;
  try {
    data = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    sessionStorage.removeItem(KEY);
  } catch (e) { return; }
  if (!data || data.to !== location.pathname || !(Date.now() - data.t < 10000)) return;
  try {
    var nav = performance.getEntriesByType('navigation')[0];
    if (nav && nav.type !== 'navigate') return; // 뒤로가기·새로고침 = 브라우저 기본 위치 복원
  } catch (e) { /* 확인 불가 — 그대로 진행 */ }

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
  var header = null;
  function whiteHeader() {
    header = document.getElementById('header');
    if (!header) return false;
    header.classList.add('is-instant', 'is-scrolled');
    requestAnimationFrame(function () { requestAnimationFrame(function () { header.classList.remove('is-instant'); }); });
    return true;
  }
  var mo = new MutationObserver(function () { if (whiteHeader()) mo.disconnect(); });
  mo.observe(root, { childList: true, subtree: true });

  document.addEventListener('DOMContentLoaded', function () {
    var visual = document.querySelector('.sub-visual');
    if (visual) {
      var headerH = parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 0;
      var top = Math.max(0, Math.round(visual.getBoundingClientRect().bottom + window.scrollY - headerH));
      window.scrollTo({ top: top, behavior: 'instant' });
    }
    show();
  });
  // 공통 헤더·푸터까지 들어오면 최소 높이 해제 (실패해도 4초 뒤 해제)
  function release() { root.classList.remove('is-lnb-hold'); }
  document.addEventListener('components:loaded', release, { once: true });
  setTimeout(release, 4000);
})();
