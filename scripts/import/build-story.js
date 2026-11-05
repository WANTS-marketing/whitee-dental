#!/usr/bin/env node
/* ==========================================================================
   치과스토리 원본(raw) → 사이트 데이터 (2단계)

   입력: scripts/import/raw/posts/{wr_id}.json   (fetch-story.js 가 만든 원본)
   출력: assets/data/news.json                  목록 (최신순, 본문 제외)
         assets/data/news/{slug}.html           글 본문 (정리된 HTML 조각)
         assets/images/news/{wr_id}/NN.jpg|png  본문 이미지 (가로 최대 1200px)
         assets/images/news/{wr_id}/thumb.jpg   목록 썸네일 (본문 첫 이미지, 가로 720px)

   - 이미지: 원본(view_image 의 fn) 을 먼저 받고, 없으면(404) 본문에 쓰인 600px 썸네일로 대체.
     받은 파일은 scripts/import/cache/ 에 두고(커밋 안 함) 다시 돌릴 때는 새로 받지 않는다. 내려받기 사이 1초 간격
   - 본문 정리·이미지 줄이기는 Chrome(playwright-core)의 DOM·canvas 로 한다
   - 분류(category)는 제목 키워드로 자동 — 아래 CATEGORY_RULES

   준비: cd scripts/import && npm install   (Chrome 이 설치돼 있어야 함 — 없으면 CHROME_PATH 환경변수)
   실행: node scripts/import/build-story.js
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '../..');
const RAW = path.join(__dirname, 'raw', 'posts');
const CACHE = path.join(__dirname, 'cache');
const OUT_LIST = path.join(ROOT, 'assets/data/news.json');
const OUT_BODY = path.join(ROOT, 'assets/data/news');
const OUT_IMG = path.join(ROOT, 'assets/images/news');
const UA = 'Mozilla/5.0 (compatible; whitee-renewal-import/1.0)';
const DELAY = 1000;
const MAX_W = 1200;
const THUMB_W = 720;

/* 제목으로 분류 — 위에서부터 처음 맞는 것 */
const CATEGORY_RULES = [
  ['진료안내', /진료안내|혜택 안내/],
  ['병원소식', /제휴|체결식|방문!|감독님/],
  ['치아교정', /교정|덧니|돌출입|부정교합|무턱|주걱턱|클리피|모르페우스|앞니가 벌어/],
  ['임플란트·틀니', /임플란트|틀니|노후 대비/],
  ['치료정보', /./],
];
const categoryOf = (title) => CATEGORY_RULES.find(([, re]) => re.test(title))[0];
const slugOf = (wrId) => `story-${wrId}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastFetch = 0;
async function download(url) {
  const wait = lastFetch + DELAY - Date.now();
  if (wait > 0) await sleep(wait);
  lastFetch = Date.now();
  // 큰 원본(10MB 이상)에서 연결이 멈추는 경우가 있어 60초 제한 + 3번까지 다시 시도
  for (let i = 1; i <= 3; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Connection: 'close' }, signal: AbortSignal.timeout(60000) });
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      console.warn(`    다시 시도 ${i}/3`, err.name, url.split('/').pop());
      await sleep(DELAY * 2);
    }
  }
  return null;
}
/** 캐시 경로: cache/2610/파일명 */
const cachePath = (url) => path.join(CACHE, ...new URL(url).pathname.split('/').slice(-2));
async function getImage(orig, fallback) {
  for (const url of [orig, fallback].filter(Boolean)) {
    const file = cachePath(url);
    if (fs.existsSync(file)) return { buf: fs.readFileSync(file), url };
    const buf = await download(url);
    if (buf && buf.length > 100) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, buf);
      return { buf, url };
    }
    console.warn('    못 받음', url);
  }
  return null;
}

/* ---------- 브라우저 안에서 실행: 본문 정리 ---------- */
function cleanInPage(html) {
  const root = document.createElement('div');
  root.innerHTML = html;
  const BLOCK = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'UL', 'OL', 'TABLE', 'TR', 'TD', 'BLOCKQUOTE', 'SECTION', 'ARTICLE', 'CENTER']);
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // 1) 이미지 → 자리표시(<img data-idx>), view_image 링크는 벗김
  const images = [];
  root.querySelectorAll('img').forEach((im) => {
    const a = im.closest('a.view_image');
    let orig = null;
    if (a) {
      try { const fn = new URL(a.getAttribute('href'), 'https://whiteedental.co.kr/bbs/').searchParams.get('fn'); if (fn) orig = new URL(fn, 'https://whiteedental.co.kr').href; } catch (e) { /* 원본 주소 없음 */ }
    }
    const src = new URL(im.getAttribute('src'), 'https://whiteedental.co.kr').href;
    images.push({ src, orig });
    const ph = document.createElement('img');
    ph.dataset.idx = String(images.length - 1);
    (a || im).replaceWith(ph);
  });

  // 강조로 볼 색: 검정·회색·흰색이 아닌 글자색, 흰색이 아닌 배경색
  const colorful = (c) => {
    const m = c && c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return false;
    const [r, g, b] = m.slice(1).map(Number);
    return Math.max(r, g, b) - Math.min(r, g, b) > 40; // 채도 있는 색만
  };

  // 2) 인라인 정리: b/strong/색 강조 → strong, u → mark, i → em, br 유지, 나머지 태그 벗김
  function inline(node) {
    let out = '';
    node.childNodes.forEach((n) => {
      if (n.nodeType === 3) { out += esc(n.textContent.replace(/[​﻿]/g, '').replace(/ /g, ' ')); return; }
      if (n.nodeType !== 1) return;
      const tag = n.tagName;
      if (tag === 'BR') { out += '<br>'; return; }
      if (tag === 'IMG') { out += `<img data-idx="${n.dataset.idx}">`; return; }
      const inner = inline(n);
      if (!inner.replace(/<br>/g, '').trim() && !/<img/.test(inner)) { out += inner.includes('<br>') ? '<br>' : (inner ? ' ' : ''); return; }
      const st = n.style || {};
      if (tag === 'B' || tag === 'STRONG' || colorful(st.color) || colorful(st.backgroundColor) || /^(bold|[6-9]00)$/.test(st.fontWeight || '')) out += `<strong>${inner}</strong>`;
      else if (tag === 'U') out += `<mark>${inner}</mark>`;
      else if (tag === 'I' || tag === 'EM') out += `<em>${inner}</em>`;
      else if (tag === 'STRIKE' || tag === 'S' || tag === 'DEL') out += `<s>${inner}</s>`;
      else out += inner;
    });
    return out;
  }

  // 3) 블록을 줄 단위로 펼침: { type:'line', html } | { type:'blank' } | { type:'img', idx } | { type:'heading', html }
  const items = [];
  const pushLine = (h, heading) => {
    // 줄 안의 이미지는 따로 꺼낸다
    const parts = h.split(/(<img data-idx="\d+">)/);
    parts.forEach((part) => {
      const im = part.match(/^<img data-idx="(\d+)">$/);
      if (im) { items.push({ type: 'img', idx: Number(im[1]) }); return; }
      // 줄 안의 <br> 로 다시 나눈다 (<br><br> = 빈 줄)
      part.split('<br>').forEach((seg, i, arr) => {
        const t = seg.replace(/\s+/g, ' ').trim();
        if (t && t.replace(/<[^>]+>/g, '').trim()) items.push({ type: heading ? 'heading' : 'line', html: t });
        else if (arr.length > 1 && i > 0 && i < arr.length - 1) items.push({ type: 'blank' });
      });
    });
    if (!h.replace(/<[^>]+>/g, '').trim() && !/<img/.test(h)) items.push({ type: 'blank' });
  };
  function walk(node) {
    // 블록 자식이 있으면 내려가고, 없으면(말단 블록) 한 줄로
    const hasBlockChild = [...node.children].some((c) => BLOCK.has(c.tagName));
    if (!hasBlockChild) { pushLine(inline(node), /^H[1-6]$/.test(node.tagName)); return; }
    let buf = document.createElement('span');
    const flush = () => { if (buf.childNodes.length) { const h = inline(buf); if (h.replace(/<br>/g, '').trim()) pushLine(h); buf = document.createElement('span'); } };
    [...node.childNodes].forEach((c) => {
      if (c.nodeType === 1 && BLOCK.has(c.tagName)) { flush(); walk(c); } else buf.appendChild(c.cloneNode(true));
    });
    flush();
  }
  walk(root);

  // 4) 묶기: 연속된 줄 = 한 문단(<br>), 빈 줄·이미지·소제목에서 끊는다
  // 같은 태그가 겹치면(<strong><strong>) 바깥 것만 남긴다
  const flat = (h) => ['strong', 'mark', 'em', 's'].reduce((s, t) => {
    let depth = 0;
    return s.replace(new RegExp(`<(/?)${t}>`, 'g'), (m, close) => {
      if (close) { depth--; return depth === 0 ? m : ''; }
      depth++; return depth === 1 ? m : '';
    });
  }, h);
  const tidy = (h) => flat(h).replace(/<\/strong>\s*<strong>/g, '').replace(/<\/mark>\s*<mark>/g, '').replace(/<(strong|mark|em|s)>\s*<\/\1>/g, '').replace(/\s+/g, ' ').trim();
  let html2 = '';
  let para = [];
  const endPara = () => { if (para.length) { html2 += `<p>${para.map(tidy).join('<br>')}</p>\n`; para = []; } };
  items.forEach((it) => {
    if (it.type === 'line') para.push(it.html);
    else if (it.type === 'heading') { endPara(); html2 += `<h3>${tidy(it.html.replace(/<\/?strong>/g, ''))}</h3>\n`; }
    else if (it.type === 'img') { endPara(); html2 += `<figure><img data-idx="${it.idx}"></figure>\n`; }
    else endPara();
  });
  endPara();

  const text = items.filter((it) => it.type === 'line' || it.type === 'heading').map((it) => it.html.replace(/<[^>]+>/g, '')).join(' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
  return { html: html2, text, images };
}

/* ---------- 브라우저 안에서 실행: 이미지 줄이기 ---------- */
async function resizeInPage({ b64, mime, maxW }) {
  const blob = await (await fetch(`data:${mime};base64,${b64}`)).blob();
  const bmp = await createImageBitmap(blob);
  const scale = Math.min(1, maxW / bmp.width);
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const c = new OffscreenCanvas(w, h);
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  // PNG 투명 여부 확인 (투명 픽셀이 있으면 PNG 로 유지)
  let alpha = false;
  if (mime === 'image/png') {
    g.drawImage(bmp, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data;
    for (let i = 3; i < d.length; i += 4 * 7) if (d[i] < 250) { alpha = true; break; }
    g.clearRect(0, 0, w, h);
  }
  if (!alpha) { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); }
  g.drawImage(bmp, 0, 0, w, h);
  const out = await c.convertToBlob(alpha ? { type: 'image/png' } : { type: 'image/jpeg', quality: 0.85 });
  const buf = new Uint8Array(await out.arrayBuffer());
  let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return { b64: btoa(s), ext: alpha ? 'png' : 'jpg', w, h, srcW: bmp.width, srcH: bmp.height };
}

function summaryOf(text) {
  // 인사말(안녕하세요. …입니다.) 은 요약에서 뺀다
  const t = text.replace(/^안녕하세요[.!]?\s*[^.!?]{0,40}입니다[.!]?\s*/, '').trim();
  return t.length > 100 ? t.slice(0, 100).trim() + '…' : t;
}

(async () => {
  const files = fs.readdirSync(RAW).filter((f) => f.endsWith('.json'));
  // --only=89,54 : 일부 글만 (확인용 — 목록 파일은 쓰지 않음)
  const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean).map(Number);
  const raws = files.map((f) => JSON.parse(fs.readFileSync(path.join(RAW, f), 'utf8')))
    .filter((r) => !only.length || only.includes(r.wrId))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  fs.mkdirSync(OUT_BODY, { recursive: true });

  const launch = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' };
  const browser = await chromium.launch(launch);
  const page = await browser.newPage();
  await page.goto('about:blank');

  const list = [];
  const report = { posts: 0, images: 0, fallback: [], missing: [] };
  for (const raw of raws) {
    const slug = slugOf(raw.wrId);
    const { html, text, images } = await page.evaluate(cleanInPage, raw.html);
    const dir = path.join(OUT_IMG, String(raw.wrId));
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });

    const srcs = [];
    let thumb = null;
    for (let i = 0; i < images.length; i++) {
      const im = images[i];
      const got = await getImage(im.orig, im.src);
      if (!got) { report.missing.push(`${raw.wrId}#${i + 1} ${im.src}`); srcs.push(null); continue; }
      if (im.orig && got.url !== im.orig) report.fallback.push(`${raw.wrId}#${i + 1}`);
      const mime = /\.png$/i.test(got.url) ? 'image/png' : /\.gif$/i.test(got.url) ? 'image/gif' : 'image/jpeg';
      const r = await page.evaluate(resizeInPage, { b64: got.buf.toString('base64'), mime, maxW: MAX_W });
      const name = `${String(i + 1).padStart(2, '0')}.${r.ext}`;
      fs.writeFileSync(path.join(dir, name), Buffer.from(r.b64, 'base64'));
      srcs.push({ file: `news/${raw.wrId}/${name}`, w: r.w, h: r.h });
      if (!thumb) {
        const t = await page.evaluate(resizeInPage, { b64: got.buf.toString('base64'), mime, maxW: THUMB_W });
        fs.writeFileSync(path.join(dir, `thumb.${t.ext}`), Buffer.from(t.b64, 'base64'));
        thumb = `news/${raw.wrId}/thumb.${t.ext}`;
      }
      report.images++;
    }

    // 자리표시 → 실제 이미지 (경로는 사이트 루트 기준 'assets/images/...' — 화면에서 루트 경로를 붙인다)
    const total = images.length;
    const body = html.replace(/<figure><img data-idx="(\d+)"><\/figure>/g, (m, idx) => {
      const s = srcs[Number(idx)];
      if (!s) return '';
      return `<figure><img src="assets/images/${s.file}" width="${s.w}" height="${s.h}" alt="${raw.title.replace(/"/g, '&quot;')} 이미지 ${Number(idx) + 1}/${total}" loading="lazy" decoding="async"></figure>`;
    });
    fs.writeFileSync(path.join(OUT_BODY, `${slug}.html`), `<!-- 원본: ${raw.url} (scripts/import/build-story.js 로 생성 — 직접 고치면 다시 생성할 때 덮어씀) -->\n${body}`);

    list.push({
      id: slug,
      wrId: raw.wrId,
      legacyUrl: raw.url,
      title: raw.title,
      category: categoryOf(raw.title),
      date: raw.date,
      summary: summaryOf(text),
      thumbnail: thumb,
      imageCount: srcs.filter(Boolean).length,
      branch: 'both',
    });
    report.posts++;
    console.log(`${report.posts}/${raws.length} ${slug} [${categoryOf(raw.title)}] 이미지 ${srcs.filter(Boolean).length}/${total} ${raw.title}`);
  }
  await browser.close();
  if (only.length) { console.log(JSON.stringify(list, null, 2)); return; }

  fs.writeFileSync(OUT_LIST, JSON.stringify(list, null, 2) + '\n');
  // 이전 실행에서 남은(지금은 없는) 글 본문 정리
  const keep = new Set(list.map((x) => `${x.id}.html`));
  fs.readdirSync(OUT_BODY).forEach((f) => { if (!keep.has(f)) fs.rmSync(path.join(OUT_BODY, f)); });

  const cats = list.reduce((m, x) => ((m[x.category] = (m[x.category] || 0) + 1), m), {});
  console.log('\n글', report.posts, '· 이미지', report.images, '· 분류', cats);
  console.log('원본 없어 600px 썸네일로 대체:', report.fallback.length, report.fallback.join(' '));
  console.log('못 받은 이미지:', report.missing.length, report.missing.join(' '));
})();
