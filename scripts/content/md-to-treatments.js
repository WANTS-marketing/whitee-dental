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
  implant: { nameKo: '임플란트', image: 'clinic-implant.jpg', imageAlt: '잇몸뼈에 심은 임플란트 위에 지대주와 크라운을 올리는 모습 3D 그림' },
  orthodontics: { nameKo: '치아교정', image: 'clinic-orthodontics.jpg', imageAlt: '치아에 붙인 교정 장치(브래킷)와 와이어 3D 그림' },
  aesthetic: { nameKo: '심미치료', image: 'clinic-aesthetic.jpg', imageAlt: '가지런하고 하얀 앞니와 잇몸 클로즈업 3D 그림' },
  general: { nameKo: '일반진료', image: 'clinic-general.jpg', imageAlt: '치과 거울에 비친 어금니 충치를 살펴보는 모습 3D 그림', cardSub: '충치·신경·잇몸치료' }, // SEO Title 가운데 구절('치과 일반진료')보다 앞 구절이 내용을 알려 줌
  scaling: { nameKo: '스케일링', image: 'clinic-wisdom-scaling.jpg', imageAlt: '스케일링 기구로 치아 표면을 깨끗하게 하는 모습 3D 그림' },
  'wisdom-tooth': { nameKo: '사랑니 발치', image: 'clinic-wisdom-tooth.jpg', imageAlt: '치과 영상 촬영 장비 앞에서 검사를 준비하는 모습' },
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
