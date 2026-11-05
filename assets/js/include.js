/* ==========================================================================
   공통 컴포넌트 include
   <div data-include="header"></div> 자리에 /components/header.html 을 넣는다.
   컴포넌트 안의 {{ROOT}} 는 <html data-root=".."> 값으로 바뀐다.
   (GitHub Pages 하위 경로 /whitee-dental/ 와 자체 도메인 양쪽에서 동작하도록 상대경로 사용)
   ※ fetch 를 쓰므로 파일을 더블클릭(file://)하면 동작하지 않음 → 로컬 서버로 열 것 (README 참고)
   ========================================================================== */
(function () {
  const root = document.documentElement.dataset.root || '.';
  /* 로컬 Live Server(VS Code 확장) 대비 — 배포본(GitHub Pages)에는 영향 없음
     Live Server 는 fetch 로 받는 컴포넌트 HTML 에도 자동 새로고침 <script> 를 넣는다. 넣을 자리를 </body> → </svg> 순으로 찾는데,
     컴포넌트엔 </body> 가 없으면 모든 </svg> 앞에 스크립트를 넣으면서 Content-Length 는 1번만큼만 늘려 응답 끝이 잘린다
     (헤더 뒷부분 .mega 패널·유틸 메뉴가 사라져 '메가메뉴 배경 없음' 이 됨).
     그래서 각 컴포넌트 끝에 <template data-dev-trap></body></template> 를 둬 스크립트가 그 안에 1번만 들어가게 하고, 여기서 통째로 지운다.
     ※ 새 컴포넌트를 만들면 이 줄도 끝에 같이 넣을 것 */
  const DEV_TRAP = /<template data-dev-trap>[\s\S]*?<\/template>/gi;

  async function load(el) {
    const name = el.dataset.include;
    try {
      const res = await fetch(`${root}/components/${name}.html`);
      if (!res.ok) throw new Error(res.status);
      const html = (await res.text())
        .replace(DEV_TRAP, '') // 로컬 Live Server 대비 자리(+그 안에 들어간 새로고침 스크립트) 제거 (위 설명)
        .replaceAll('{{ROOT}}', root);
      if (el.dataset.keep !== undefined) {
        el.innerHTML = html; // 자리 요소 유지 (퀵메뉴처럼 위치 클래스가 필요한 경우)
      } else {
        el.outerHTML = html;
      }
    } catch (err) {
      console.error(`[include] components/${name}.html 로드 실패`, err);
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([...document.querySelectorAll('[data-include]')].map(load));
    document.dispatchEvent(new CustomEvent('components:loaded'));
  });
})();
