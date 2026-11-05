#!/usr/bin/env node
/* ==========================================================================
   기존 사이트(그누보드) 치과스토리 게시판 → 원본 수집 (1단계)
   https://whiteedental.co.kr/bbs/board.php?bo_table=story

   - 목록 page=1~N 에서 wr_id 를 모으고, 글마다 상세 페이지에서 제목·작성일·본문 HTML·목록 썸네일을 저장
   - 요청 사이 1초 간격 (기존 사이트 부담 줄이기)
   - 결과: scripts/import/raw/list.json, raw/posts/{wr_id}.json  — 이미 받은 글은 건너뜀(--force 로 다시)
   - 이미지 내려받기는 2단계 build-story.js 가 한다

   실행: node scripts/import/fetch-story.js [--force]
   ========================================================================== */
const fs = require('fs');
const path = require('path');

const BASE = 'https://whiteedental.co.kr';
const BOARD = 'story';
const RAW = path.join(__dirname, 'raw');
const DELAY = 1000;
const UA = 'Mozilla/5.0 (compatible; whitee-renewal-import/1.0)';
const force = process.argv.includes('--force');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ');

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return await res.text();
    } catch (err) {
      console.warn('  재시도', i + 1, err.message);
      await sleep(DELAY * 3);
    }
  }
  throw new Error('실패: ' + url);
}

/** 목록 한 페이지 → [{ wrId, title, listThumb, listDate }] */
function parseList(html) {
  const items = [];
  const re = /<li class="gall_li[\s\S]*?<\/li>/g;
  for (const [li] of html.matchAll(re)) {
    const id = li.match(/wr_id=(\d+)/);
    if (!id) continue;
    const title = li.match(/class="bo_tit">([\s\S]*?)<\/a>/);
    const thumb = li.match(/<img src="([^"]+)"/);
    const date = li.match(/gall_date">[\s\S]*?<\/i>\s*([^<]+)</);
    items.push({
      wrId: Number(id[1]),
      title: title ? decode(title[1].replace(/<[^>]+>/g, '')).trim() : '',
      listThumb: thumb ? decode(thumb[1]) : null,
      listDate: date ? date[1].trim() : null,
    });
  }
  return items;
}

/** 상세 → { title, dateRaw, date(ISO), html } */
function parseView(html) {
  const title = html.match(/<span class="bo_v_tit">([\s\S]*?)<\/span>/);
  const date = html.match(/class="if_date">[\s\S]*?<\/i>\s*(\d{2})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/);
  // 본문: <div id="bo_v_con"> … </div> (안쪽 div 중첩을 세어 짝 맞춤)
  const start = html.indexOf('<div id="bo_v_con">');
  let body = '';
  if (start >= 0) {
    let i = start + '<div id="bo_v_con">'.length, depth = 1;
    const tag = /<(\/?)div\b[^>]*>/gi;
    tag.lastIndex = i;
    let m;
    while ((m = tag.exec(html))) {
      depth += m[1] ? -1 : 1;
      if (depth === 0) { body = html.slice(i, m.index); break; }
    }
  }
  // 첨부 이미지 영역(#bo_v_img) — 본문 위에 붙는 첨부 사진
  const att = html.match(/<div id="bo_v_img">([\s\S]*?)<\/div>\s*<!-- 본문 내용 시작/);
  return {
    title: title ? decode(title[1].replace(/<[^>]+>/g, '')).trim() : '',
    dateRaw: date ? date[0].replace(/^.*<\/i>\s*/, '') : null,
    date: date ? `20${date[1]}-${date[2]}-${date[3]}T${date[4]}:${date[5]}:00+09:00` : null,
    attachHtml: att ? att[1].trim() : '',
    html: body.trim(),
  };
}

(async () => {
  fs.mkdirSync(path.join(RAW, 'posts'), { recursive: true });

  // 1) 목록 — 마지막 페이지 번호는 1페이지의 페이지 링크에서 찾는다
  const first = await get(`${BASE}/bbs/board.php?bo_table=${BOARD}&page=1`);
  const last = Math.max(1, ...[...first.matchAll(/[?&](?:amp;)?page=(\d+)/g)].map((m) => Number(m[1])));
  const list = [];
  for (let p = 1; p <= last; p++) {
    const html = p === 1 ? first : (await sleep(DELAY), await get(`${BASE}/bbs/board.php?bo_table=${BOARD}&page=${p}`));
    const items = parseList(html);
    console.log(`목록 ${p}/${last}: ${items.length}개`);
    items.forEach((it) => { if (!list.some((x) => x.wrId === it.wrId)) list.push({ ...it, page: p }); });
  }
  fs.writeFileSync(path.join(RAW, 'list.json'), JSON.stringify({ fetchedAt: new Date().toISOString(), board: BOARD, pages: last, count: list.length, items: list }, null, 2));
  console.log(`목록 합계 ${list.length}개`);

  // 2) 상세
  let n = 0;
  for (const it of list) {
    const file = path.join(RAW, 'posts', `${it.wrId}.json`);
    if (!force && fs.existsSync(file)) continue;
    await sleep(DELAY);
    const url = `${BASE}/bbs/board.php?bo_table=${BOARD}&wr_id=${it.wrId}`;
    const v = parseView(await get(url));
    if (!v.html) console.warn('  본문 없음?', it.wrId);
    fs.writeFileSync(file, JSON.stringify({ wrId: it.wrId, url, fetchedAt: new Date().toISOString(), listTitle: it.title, listThumb: it.listThumb, ...v }, null, 2));
    console.log(`상세 ${++n} wr_id=${it.wrId} ${v.date} ${v.title}`);
  }
  console.log('완료');
})();
