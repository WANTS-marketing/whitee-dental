#!/usr/bin/env node
/* ==========================================================================
   기존 사이트 치료사례(시술 전후) → 새 사이트 치료사례 데이터 (2단계)
   입력: scripts/import/raw/gallery/list.json + {wrId}.jpg (fetch-gallery.js)
   출력: assets/images/cases/case-{번호}-before.jpg · case-{번호}-after-blur.jpg (공개)
         AFTER 원본 case-{번호}-after.jpg 는 저장소 밖 자료/기존사이트-치료사례/after/ (로그인 회원 전용 — 공개 저장소에 올리지 않음, 운영 시 서버 저장소로)
         assets/data/cases.json (최신순)

   - 기존 이미지는 한 장(1000×600)에 [안내 띠 / BEFORE | AFTER / 로고] 가 붙은 양식
     → 흰 사진 테두리(세로·가로로 끊김 없이 흰 줄)를 찾아 BEFORE·AFTER 사진 칸만 잘라 낸다
       가운데 화살표 원이 걸치는 쪽(BEFORE 오른쪽 · AFTER 왼쪽)은 조금 더 안쪽으로
       두 칸 크기가 어긋나거나 테두리를 못 찾으면 자르지 않고 '수동 확인' 목록에 남긴다(그 글은 데이터에서 빠짐)
   - 원본 합본 이미지는 사이트에 올리지 않는다: AFTER 가 그대로 보이고 안내 띠에 환자 이니셜이 있어서
     (원본은 scripts/import/raw/gallery/ — 저장소에 올리지 않음(.gitignore), 보관본은 프로젝트 밖 자료/기존사이트-치료사례/)
   - AFTER 흐림 미리보기: 원본 대신 아주 작게 줄였다가 흐리게 키운 이미지 (CSS 흐림을 꺼도 원본이 보이지 않게)
   - 이미지 처리는 Chrome(playwright-core)의 canvas — build-story.js 와 같은 방식 (CHROME_PATH 로 경로 지정 가능)

   실행: node scripts/import/build-gallery.js
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..', '..');
const RAW = path.join(__dirname, 'raw', 'gallery');
const OUT_IMG = path.join(ROOT, 'assets', 'images', 'cases');
const OUT_JSON = path.join(ROOT, 'assets', 'data', 'cases.json');
const OUT_AFTER = process.env.CASES_AFTER_DIR || path.resolve(ROOT, '..', '자료', '기존사이트-치료사례', 'after'); // AFTER 원본 — 저장소 밖
const MAX_W = 1600;

/* 본문 — 기존 글 본문은 회원 전용이라 가져오지 못했다. 대표 이미지 위 안내 띠 문구를 옮겨 적은 것
   (안내 띠 맨 앞의 환자 이니셜 '고00' 등은 개인정보라 뺐다) */
const CAPTIONS = {
  18: { period: '1년 11개월', range: '2021.01 ~ 2022.11', detail: '덧니, 개방교합 해소' },
  17: { period: '3년 5개월', range: '', detail: '부정교합 개선 교정' },
  16: { period: '2년 5개월', range: '2024.01 ~ 2026.06', detail: '치아배열 교정' },
  15: { period: '1년 4개월', range: '2022.01 ~ 2023.05', detail: '덧니 개선 교정' },
  14: { period: '2년 2개월', range: '2024.01 ~ 2026.03', detail: '덧니 개선 교정' },
  13: { period: '3년 11개월', range: '2022.04 ~ 2026.03', detail: '치아돌출 및 치열개선 목적 교정' },
  12: { period: '4년', range: '2022.01 ~ 2026.01', detail: '전치부 총생 및 교합 개선 목적 교정' },
  11: { period: '1년 6개월', range: '2022.07 ~ 2024.01', detail: '전치부 반대교합 개선 및 치아 사이 공간 개선 교정' },
  10: { period: '1년 11개월', range: '2022.01 ~ 2024.08', detail: '삐뚤한 치아교정' },
  9: { period: '2년 7개월', range: '2021.12 ~ 2024.07', detail: '삐뚤한 치아교정' },
  8: { period: '2년 0개월', range: '2023.05 ~ 2025.05', detail: '고등학생 때 덧니 해소를 위한 교정 진행' },
  7: { period: '1년 1개월', range: '2024.02 ~ 2025.03', detail: '과개교합 및 구강악습관 개선을 위한 프리올소 성장기 교정' },
  6: { period: '2년 11개월', range: '2021.10 ~ 2023.08', detail: '덧니 교정' },
  5: { period: '2년 11개월', range: '2019.08 ~ 2022.07', detail: '교정, 보철, 임플란트' },
};

/** 진료 분류 — 제목에 '교정' → 치아교정. 1번 글(wr_id 5: 교정·보철·임플란트)은 복수 분류.
    제목에 '교정'이 없어도 안내 띠가 '교정기간'이면 치아교정 (wr_id 18 '덧니, 개방교합 해소') */
function categoriesOf(wrId, title) {
  if (wrId === 5) return ['치아교정', '보철', '임플란트'];
  if (/교정/.test(title) || CAPTIONS[wrId]?.period) return ['치아교정'];
  return ['기타'];
}
/** 목록 제목: '화이트e치과 시술 전후(덧니 교정)' → '덧니 교정' (괄호가 없으면 원래 제목) */
const shortTitle = (t) => (t.match(/\(([^()]+)\)\s*$/) || [, t])[1].trim();

/* ---------- 브라우저 안에서 실행: 경계 찾기 · 자르기 · 흐림 ---------- */
async function splitInPage({ b64, maxW }) {
  const blob = await (await fetch(`data:image/jpeg;base64,${b64}`)).blob();
  const bmp = await createImageBitmap(blob);
  const W = bmp.width, H = bmp.height;
  const c = new OffscreenCanvas(W, H);
  const g = c.getContext('2d');
  g.drawImage(bmp, 0, 0);
  const d = g.getImageData(0, 0, W, H).data;
  const white = (x, y) => { const i = (y * W + x) * 4; return d[i] >= 232 && d[i + 1] >= 232 && d[i + 2] >= 232; };
  const runs = (arr, min) => { const out = []; let s = -1; arr.forEach((v, i) => { if (v >= min) { if (s < 0) s = i; } else if (s >= 0) { out.push([s, i - 1]); s = -1; } }); if (s >= 0) out.push([s, arr.length - 1]); return out; };

  // 1) 세로 흰 줄(사진 테두리 좌우) — 사진 높이 범위에서 75% 이상 흰 열 (가운데 화살표 원이 안쪽 테두리를 일부 가려 0.8 안팎, 사진 안은 0.2 이하)
  const y0 = Math.round(H * 0.31), y1 = Math.round(H * 0.8);
  const colWhite = Array.from({ length: W }, (_, x) => { let n = 0; for (let y = y0; y < y1; y++) if (white(x, y)) n++; return n / (y1 - y0); });
  const half = (from, to) => { const r = runs(colWhite.slice(from, to), 0.75).map(([a, b]) => [a + from, b + from]); return r.length >= 2 ? { left: r[0][1] + 1, right: r.at(-1)[0] - 1 } : null; };
  const L = half(0, Math.floor(W / 2)), R = half(Math.ceil(W / 2), W);
  if (!L || !R) return { error: '사진 테두리(세로 흰 줄)를 찾지 못함' };
  // 2) 가로 흰 줄(사진 위 테두리 · 아래 라벨 칸 시작) — BEFORE 칸 기준
  const rowWhite = Array.from({ length: H }, (_, y) => { let n = 0; for (let x = L.left; x <= L.right; x++) if (white(x, y)) n++; return n / (L.right - L.left + 1); });
  const rr = runs(rowWhite.slice(Math.round(H * 0.2), Math.round(H * 0.92)), 0.9).map(([a, b]) => [a + Math.round(H * 0.2), b + Math.round(H * 0.2)]);
  if (rr.length < 2) return { error: '사진 테두리(가로 흰 줄)를 찾지 못함' };
  // 사진 위 테두리 = 이미지 1/4 아래에서 처음 나오는 흰 줄 (그 위 안내 띠 둘레 흰 여백은 건너뜀)
  // 사진 아래 = 그다음 처음 나오는 흰 줄(Before/After 라벨 칸 시작) — 더 아래 로고 둘레 흰 배경은 쓰지 않음
  const topRun = rr.find(([a]) => a >= H * 0.25);
  if (!topRun) return { error: '사진 위 테두리를 찾지 못함' };
  const top = topRun[1] + 1;
  const label = rr.find(([a]) => a > top + H * 0.2);
  if (!label) return { error: '라벨 칸 경계를 찾지 못함' };
  const bottom = label[0] - 1;
  const box = { before: { x: L.left, w: L.right - L.left + 1 }, after: { x: R.left, w: R.right - R.left + 1 }, top, h: bottom - top + 1 };
  if (Math.abs(box.before.w - box.after.w) > box.before.w * 0.05) return { error: `BEFORE·AFTER 칸 너비가 다름 (${box.before.w} / ${box.after.w})`, box };
  if (box.before.w < W * 0.3 || box.h < H * 0.25) return { error: '사진 칸이 너무 작음', box };

  // 3) 자르기 — 둘레 3px, 화살표 쪽 14px 더 안쪽
  const INSET = 3, ARROW = 14;
  const crop = async (x, w, padL, padR, outW) => {
    const sx = x + padL, sw = w - padL - padR, sy = top + INSET, sh = box.h - INSET * 2;
    const scale = Math.min(1, (outW || maxW) / sw);
    const oc = new OffscreenCanvas(Math.round(sw * scale), Math.round(sh * scale));
    const og = oc.getContext('2d');
    og.imageSmoothingQuality = 'high';
    og.drawImage(bmp, sx, sy, sw, sh, 0, 0, oc.width, oc.height);
    return oc;
  };
  const toB64 = async (cv, q) => { const out = await cv.convertToBlob({ type: 'image/jpeg', quality: q }); const buf = new Uint8Array(await out.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000)); return btoa(s); };
  const before = await crop(box.before.x, box.before.w, INSET, INSET + ARROW);
  const after = await crop(box.after.x, box.after.w, INSET + ARROW, INSET);
  // 흐림 미리보기: 20px 폭으로 줄였다가 → 흐리게 키움 (원본 정보가 남지 않게)
  const tiny = new OffscreenCanvas(20, Math.max(1, Math.round(20 * after.height / after.width)));
  tiny.getContext('2d').drawImage(after, 0, 0, tiny.width, tiny.height);
  const blur = new OffscreenCanvas(after.width, after.height);
  const bg = blur.getContext('2d');
  bg.filter = 'blur(10px)';
  bg.imageSmoothingQuality = 'high';
  bg.drawImage(tiny, -20, -20, blur.width + 40, blur.height + 40); // 가장자리 비침 없게 조금 크게
  return {
    box, size: [before.width, before.height],
    before: await toB64(before, 0.86), after: await toB64(after, 0.86), blur: await toB64(blur, 0.7),
  };
}

(async () => {
  const list = JSON.parse(fs.readFileSync(path.join(RAW, 'list.json'), 'utf8'));
  fs.rmSync(OUT_IMG, { recursive: true, force: true });
  fs.mkdirSync(OUT_IMG, { recursive: true });
  fs.mkdirSync(OUT_AFTER, { recursive: true });
  const launch = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' };
  const browser = await chromium.launch(launch);
  const page = await browser.newPage();
  await page.goto('about:blank');

  const rows = [];
  const manual = [];
  for (const it of list) {
    const file = path.join(RAW, `${it.wrId}.jpg`);
    if (!fs.existsSync(file)) { manual.push(`${it.wrId} 원본 이미지 없음`); continue; }
    const r = await page.evaluate(splitInPage, { b64: fs.readFileSync(file).toString('base64'), maxW: MAX_W });
    if (r.error) { manual.push(`${it.wrId} ${r.error}`); continue; }
    const n = it.wrId;
    const names = { before: `case-${n}-before.jpg`, after: `case-${n}-after.jpg`, blur: `case-${n}-after-blur.jpg` };
    for (const k of Object.keys(names)) fs.writeFileSync(path.join(k === 'after' ? OUT_AFTER : OUT_IMG, names[k]), Buffer.from(r[k], 'base64'));
    const cap = CAPTIONS[n] || {};
    const body = [cap.period ? `교정 기간: ${cap.period}${cap.range ? ` (${cap.range})` : ''}` : '', cap.detail ? `치료 내용: ${cap.detail}` : ''].filter(Boolean).join('\n');
    rows.push({
      id: `case-${n}`,
      no: n,
      title: shortTitle(it.title),
      originalTitle: it.title,
      categories: categoriesOf(n, it.title),
      date: it.date,
      branch: null, // 기존 글에 지점 정보 없음
      beforeImage: `cases/${names.before}`,
      afterBlur: `cases/${names.blur}`,
      afterOriginal: names.after, // 저장소 밖 원본 파일 이름 — 화면에 쓰는 주소는 서버가 로그인 확인 후 내려줄 것 (api.js getCases)
      images: [
        { role: 'before', file: `cases/${names.before}`, w: r.size[0], h: r.size[1] },
      ],
      body,
      legacy: { wrId: n, url: it.url, image: it.image },
    });
    console.log(n, '나눔', JSON.stringify(r.box), r.size.join('x'));
  }
  await browser.close();
  rows.sort((a, b) => new Date(b.date) - new Date(a.date) || b.no - a.no);
  fs.writeFileSync(OUT_JSON, JSON.stringify(rows, null, 2) + '\n');
  console.log(`\n치료사례 ${rows.length}건 → assets/data/cases.json`);
  console.log(manual.length ? `수동 확인 필요 ${manual.length}건:\n  ${manual.join('\n  ')}` : '수동 확인 필요 없음 (모두 자동으로 나눔)');
})();
