/* ==========================================================================
   원고(docs/content/treatments-6-content.md) → assets/data/treatments.json
   node scripts/content/md-to-treatments.js
   - 원고 문장은 그대로 옮긴다(나누기만: 기준 칸의 쉼표·슬래시, 질문의 따옴표). 원고가 바뀌면 이 스크립트를 다시 돌린 뒤
     node scripts/content/build-treatments.js 로 페이지·메뉴를 다시 만든다
   - 사이트 표시용 값(nameKo · image · imageAlt · cardSub)은 원고에 없어서 아래 SITE_FIELDS 에서 붙인다
   ========================================================================== */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'docs/content/treatments-6-content.md');
const OUT = path.join(ROOT, 'assets/data/treatments.json');

// 원고에 없는 사이트 표시용 값 — cardSub(메인 진료안내 카드 한 줄)은 원고 SEO Title 가운데 구절
const SITE_FIELDS = {
  implant: { nameKo: '임플란트', image: 'clinic-implant.jpg', imageAlt: '잇몸뼈에 심은 임플란트 위에 지대주와 크라운을 올리는 모습 3D 그림', h1Break: '빠진 치아를 채우기 전에,', summaryBreaks: ['아닙니다.', '세웁니다.', '충분한지,'], summaryCenter: true }, // h1Break = 비주얼 박스 h1 줄바꿈 위치, summaryBreaks = 요약 문단 줄바꿈 위치(PC만), summaryCenter = 요약 가운데 정렬 (문구는 그대로)
  orthodontics: { nameKo: '치아교정', image: 'clinic-orthodontics.jpg', imageAlt: '치아에 붙인 교정 장치(브래킷)와 와이어 3D 그림', h1Break: '앞니 배열뿐 아니라,', summaryBreaks: ['"어떤 장치가 가장 빠른가"보다', '적합한가"입니다.', '성장기 예방교정을'], summaryCenter: true },
  aesthetic: { nameKo: '심미치료', image: 'clinic-aesthetic.jpg', imageAlt: '가지런하고 하얀 앞니와 잇몸 클로즈업 3D 그림', h1Break: '밝고 자연스러운 미소,' },
  general: { nameKo: '일반진료', image: 'clinic-general.jpg', imageAlt: '치과 거울에 비친 어금니 충치를 살펴보는 모습 3D 그림', cardSub: '충치·신경·잇몸치료', h1Break: '충치가 생겼다면,', summaryBreaks: ['다양합니다.', '판단하고,'], summaryCenter: true }, // SEO Title 가운데 구절('치과 일반진료')보다 앞 구절이 내용을 알려 줌
  scaling: { nameKo: '스케일링', image: 'clinic-wisdom-scaling.jpg', imageAlt: '스케일링 기구로 치아 표면을 깨끗하게 하는 모습 3D 그림', h1Break: '스케일링은 치석 제거에서', summaryBreaks: ['미용 관리가 아닙니다.', '진료입니다.'], summaryCenter: true },
  'wisdom-tooth': { nameKo: '사랑니 발치', image: 'clinic-wisdom-tooth.jpg', imageAlt: '잇몸 속에 비스듬히 누운 매복 사랑니와 어금니 3D 그림', h1Break: '사랑니, 모두 뽑는 것보다', visualFlip: true }, // visualFlip = 비주얼 박스 사진만 좌우 반전(누운 사랑니가 글자 뒤에 가려져서 — 메인 카드는 그대로)
};

const md = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');
const blocks = md.split(/\n## 0\d /).slice(1).map((b) => b.split('\n---')[0]);

const sectionOf = (b, title) => {
  const i = b.indexOf(`### ${title}`);
  if (i < 0) throw new Error(`섹션 없음: ${title}`);
  const rest = b.slice(b.indexOf('\n', i) + 1);
  const end = rest.search(/\n### /);
  return (end < 0 ? rest : rest.slice(0, end)).trim();
};
const field = (b, label) => {
  const m = b.match(new RegExp(`^- ${label}: (.+)$`, 'm'));
  if (!m) throw new Error(`필드 없음: ${label}`);
  return m[1].trim();
};
const splitList = (s) => s.split(/\s*,\s*/).map((x) => x.trim()).filter(Boolean);

const treatments = blocks.map((b) => {
  const slug = field(b, 'URL slug');
  const seoTitle = field(b, 'SEO Title');
  const crit = sectionOf(b, '치료를 결정하기 전 알아야 할 기준');
  const critLine = (label) => { const m = crit.match(new RegExp(`^- ${label}: (.+)$`, 'm')); if (!m) throw new Error(`${slug} 기준 없음: ${label}`); return m[1].trim(); };
  const optRaw = critLine('치료 선택지');
  const [optItems, optNote] = optRaw.split(/\s+—\s+/);
  const qRaw = critLine('이런 질문을 많이 하세요');
  const steps = [];
  sectionOf(b, '검사부터 관리까지').split('\n').forEach((line) => {
    const m = line.match(/^\d+\.\s+(.+)$/);
    if (m) steps.push({ title: m[1].trim(), body: '' });
    else if (line.trim() && steps.length) steps[steps.length - 1].body += (steps[steps.length - 1].body ? ' ' : '') + line.trim();
  });
  const faq = [];
  sectionOf(b, '많이 묻는 질문').split('\n').forEach((line) => {
    const q = line.match(/^- Q\.\s+(.+)$/);
    const a = line.match(/^\s+A\.\s+(.+)$/);
    if (q) faq.push({ q: q[1].trim(), a: '' });
    else if (a && faq.length) faq[faq.length - 1].a = a[1].trim();
  });
  const specRaw = sectionOf(b, '진료 연결 — 관련 진료과');
  const specNote = (specRaw.match(/\(([^)]+)\)/) || [])[1] || '';
  const specialties = splitList(specRaw.replace(/\([^)]*\)/, ''));

  /* 추가 블록 (기존 상세 기반, 원고 문장과 별도) — 없으면 빈 값
     이미지 칸: '이름 (비율, 권장 크기)' → { file: 'treatment/{slug}/이름', name, ratio: '4/3', size: '1200×900' } (확장자 없이 — 화면에서 webp·jpg·png 순서로 찾음) */
  const optSection = (title) => { try { return sectionOf(b, title); } catch (e) { return ''; } };
  const slotOf = (s) => {
    const m = s.trim().match(/^([\w-]+)\s*\((\d+):(\d+),\s*([\d×x]+)\)$/);
    if (!m) throw new Error(`${slug} 이미지 칸 형식: ${s}`);
    return { file: `treatment/${slug}/${m[1]}`, name: m[1], ratio: `${m[2]}/${m[3]}`, size: m[4] };
  };
  const lineOf = (sec, label) => (sec.match(new RegExp(`^- ${label}: (.+)$`, 'm')) || [])[1]?.trim() || '';
  const extras = {};
  const photoSec = optSection('추가 블록 — 사진 띠');
  if (photoSec) extras.photos = photoSec.split('\n').filter((l) => /^- [\w-]+ \(/.test(l)).map((l) => { const [slot, caption] = l.slice(2).split(/\):\s*/); return { ...slotOf(`${slot})`), caption: caption.trim() }; });
  const stepImgSec = optSection('추가 블록 — 단계 이미지');
  if (stepImgSec) {
    const [stepPart, slot, altPart] = stepImgSec.replace(/^- /, '').split(/\s+\/\s+/);
    extras.stepImage = { step: Number(stepPart.replace(/\D/g, '')), ...slotOf(slot), alt: altPart.replace(/^alt:\s*/, '').trim() };
  }
  const caseSec = optSection('추가 블록 — 이런 경우에도 상담해 보세요');
  if (caseSec) {
    extras.cases = caseSec.split(/\n#### /).slice(1).map((c) => ({
      title: c.split('\n')[0].trim(),
      source: lineOf(c, '근거'),
      icon: lineOf(c, '아이콘'),
      verified: lineOf(c, '게시') === '예', // 아니요 = 데이터에만, 화면에 숨김
      text: lineOf(c, '설명'),
      fits: lineOf(c, '이런 분이라면 상담해 보세요').split(/\s+\/\s+/).filter(Boolean),
    }));
  }
  const labSec = optSection('추가 블록 — 기공센터');
  if (labSec) extras.lab = { label: lineOf(labSec, '라벨'), title: lineOf(labSec, '제목'), ...slotOf(lineOf(labSec, '이미지')), text: lineOf(labSec, '본문') };

  const t = {
    slug,
    ...SITE_FIELDS[slug],
    labelEn: field(b, '영문 라벨'),
    seoTitle,
    description: field(b, 'Description'),
    h1: b.match(/### H1[^\n]*\n([^\n]+)/)[1].trim(), // '### H1' 또는 '### H1 (비주얼 박스 헤드라인)' 다음 줄
    summary: sectionOf(b, '요약 문단'),
    points: sectionOf(b, '화이트e치과 진료 포인트').split('\n').map((l) => l.replace(/^\d+\.\s+/, '').trim()).filter(Boolean),
    criteria: {
      check: splitList(critLine('검사에서 확인할 것')),
      options: optItems.split(/\s*\/\s*/).map((x) => x.trim()).filter(Boolean),
      optionsNote: optNote ? optNote.trim() : '',
      questions: [...qRaw.matchAll(/"([^"]+)"/g)].map((m) => m[1]),
    },
    steps,
    faq,
    specialties,
    specialtiesNote: specNote,
    cardSub: SITE_FIELDS[slug].cardSub || seoTitle.split('|')[1].trim(),
    review: { verified: false, date: '', reviewer: '' }, // 원고 '의료진 검수일: [확인 필요]' — 값이 없으면 화면에서 그 줄을 숨김
    ...(Object.keys(extras).length ? { extras } : {}), // 추가 블록 (기존 상세 기반) — 원고 '### 추가 블록 —' 섹션
  };
  if (t.points.length !== 3 || t.steps.length !== 4 || t.faq.length !== 4 || t.faq.some((f) => !f.a) || !t.criteria.questions.length) throw new Error(`${slug} 개수 확인: ${JSON.stringify({ p: t.points.length, s: t.steps.length, f: t.faq.length })}`);
  return t;
});

const commonText = (title) => { const i = md.indexOf(`### ${title}`); const rest = md.slice(md.indexOf('\n', i) + 1); return rest.slice(0, rest.search(/\n### /)).trim(); };
const notice = commonText('하단 고지 공통 문구').split('\n');
const out = {
  _source: 'docs/content/treatments-6-content.md (scripts/content/md-to-treatments.js 로 생성 — 이 파일을 직접 고치지 말고 원고를 고친 뒤 다시 생성)',
  common: {
    connectText: commonText('진료 연결 공통 문구'),
    notice: notice[0].trim(),
    reviewLabel: '의료진 검수일', // 원고: '의료진 검수일: [확인 필요 — 병원 검수 후 날짜·검수자 입력]' — 값이 없으면 줄 숨김
  },
  treatments,
};
fs.writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
console.log(`${treatments.length}개 → ${path.relative(ROOT, OUT)}`);
