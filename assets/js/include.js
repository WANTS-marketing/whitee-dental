/* ==========================================================================
   공통 컴포넌트 include
   <div data-include="header"></div> 자리에 /components/header.html 을 넣는다.
   컴포넌트 안의 {{ROOT}} 는 <html data-root=".."> 값으로 바뀐다.
   (GitHub Pages 하위 경로 /whitee-dental/ 와 자체 도메인 양쪽에서 동작하도록 상대경로 사용)
   ※ fetch 를 쓰므로 파일을 더블클릭(file://)하면 동작하지 않음 → 로컬 서버로 열 것 (README 참고)
   ========================================================================== */
(function () {
  const root = document.documentElement.dataset.root || '.';

  async function load(el) {
    const name = el.dataset.include;
    try {
      const res = await fetch(`${root}/components/${name}.html`);
      if (!res.ok) throw new Error(res.status);
      const html = (await res.text()).replaceAll('{{ROOT}}', root);
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
