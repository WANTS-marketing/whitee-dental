#!/usr/bin/env node
/* ==========================================================================
   기존 사이트(그누보드) 치료사례(시술 전후) 게시판 → 원본 수집 (1단계)
   https://whiteedental.co.kr/bbs/board.php?bo_table=gallery  (wr_id 5~18, 14건)

   ⚠️ 기존 사이트는 이 게시판의 글 상세(본문)를 '회원만' 볼 수 있게 막아 두었다 ("글을 읽을 권한이 없습니다")
      → 로그인 없이 얻을 수 있는 것만 가져온다
        - 목록: 제목, 작성일(MM-DD), 썸네일 주소
        - 원본 이미지: 썸네일 이름(thumb-{이름}_285x105.jpg)에서 원본 이름({이름}.jpg)을 알아내 /data/editor/YYMM/ 에서 받는다
          (글마다 대표 이미지 1장 — 글 안에 이미지가 더 있었는지는 로그인 없이는 알 수 없음)
        - 작성 연도: 이미지 폴더 YYMM (/data/editor/2610/ → 2026년 10월) + 목록 MM-DD
      본문 텍스트는 못 가져온다 → 대표 이미지 위 안내 문구(교정 기간·내용)를 build-gallery.js 의 CAPTIONS 에 옮겨 적었다
   - 요청 사이 1초 간격 (기존 사이트 부담 줄이기)
   - 결과: scripts/import/raw/gallery/list.json + {wrId}.jpg (원본 합본 — AFTER·환자 이니셜이 보여 공개 저장소에 커밋하지 않음, .gitignore. 보관본: 자료/기존사이트-치료사례/)

   실행: node scripts/import/fetch-gallery.js [--force]
   ========================================================================== */
const fs = require('fs');
const path = require('path');

const BASE = 'https://whiteedental.co.kr';
const OUT = path.join(__dirname, 'raw', 'gallery');
const DELAY = 1000;
const UA = 'Mozilla/5.0 (compatible; whitee-renewal-import/1.0)';
const force = process.argv.includes('--force');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ');

async function get(url, binary) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return binary ? Buffer.from(await res.arrayBuffer()) : await res.text();
    } catch (err) {
      console.warn('  재시도', i + 1, err.message);
      await sleep(DELAY * 3);
    }
  }
  return null;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const items = [];
  for (let page = 1; page <= 5; page++) {
    const html = await get(`${BASE}/bbs/board.php?bo_table=gallery&page=${page}`);
    await sleep(DELAY);
    if (!html) break;
    const lis = [...html.matchAll(/<li class="gall_li[\s\S]*?<\/li>/g)].map((m) => m[0]);
    if (!lis.length) break;
    let added = 0;
    for (const li of lis) {
      const id = li.match(/wr_id=(\d+)/);
      if (!id || items.some((x) => x.wrId === Number(id[1]))) continue;
      const title = li.match(/class="bo_tit">([\s\S]*?)<\/a>/);
      const thumb = li.match(/<img[^>]+src="([^"]+)"/);
      const date = li.match(/gall_date">[\s\S]*?<\/i>\s*([^<]+)</);
      items.push({
        wrId: Number(id[1]),
        title: title ? decode(title[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim() : '',
        listDate: date ? date[1].trim() : null,
        listThumb: thumb ? decode(thumb[1]) : null,
        url: `${BASE}/bbs/board.php?bo_table=gallery&wr_id=${id[1]}`,
      });
      added++;
    }
    if (!added) break;
  }
  console.log('목록', items.length, '건');

  for (const it of items) {
    // 원본 이미지 주소: .../data/editor/2610/thumb-{이름}_285x105.jpg → .../data/editor/2610/{이름}.jpg
    const m = it.listThumb && it.listThumb.match(/^(.*\/data\/editor\/(\d{2})(\d{2})\/)thumb-(.+?)_\d+x\d+\.(\w+)$/);
    if (!m) { it.error = '썸네일 주소 형식이 달라 원본을 찾지 못함'; continue; }
    const [, dir, yy, mm, name] = m;
    const [md, dd] = (it.listDate || '').split('-');
    it.yearMonth = `20${yy}-${mm}`;
    if (md && md !== mm) it.note = `목록 월(${md})과 이미지 폴더 월(${mm})이 다름 — 목록 날짜 사용`;
    it.date = `20${yy}-${md || mm}-${dd || '01'}T09:00:00+09:00`;
    const file = path.join(OUT, `${it.wrId}.jpg`);
    for (const ext of ['jpg', 'jpeg', 'png']) {
      const url = `${dir}${name}.${ext}`;
      if (!force && fs.existsSync(file)) { it.image = url; break; }
      const buf = await get(url, true);
      await sleep(DELAY);
      if (buf && buf.length > 1000) { fs.writeFileSync(file, buf); it.image = url; break; }
    }
    if (!it.image) it.error = '원본 이미지를 받지 못함';
    console.log(it.wrId, it.date.slice(0, 10), it.image ? 'ok' : it.error, it.title);
  }
  fs.writeFileSync(path.join(OUT, 'list.json'), JSON.stringify(items.sort((a, b) => b.wrId - a.wrId), null, 2));
})();
