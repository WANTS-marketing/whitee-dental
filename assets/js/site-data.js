/* ==========================================================================
   병원 기본 데이터 — 지점·의료진·SNS
   병원 정보가 바뀌면 이 파일만 고치면 된다. (2차에 Supabase로 옮길 대상 아님: 거의 안 바뀌는 정보)
   ========================================================================== */

/* 진료시간 — 창원점·마산점 공통, 한 곳에서 관리 (병원 제공 자료로 확정 2026-11-10, 24시간 표기)
   쓰는 곳(모두 이 값): 메인 히어로 진료시간 카드 · 진료과목 '지점 안내' · 푸터 · 오시는길 · 상담문의 작성 지점 카드 · FAQ 답변의 {hours} · 진료과목 구조화 데이터(평일·토요일만)
   지점별로 달라지면 branches[].hours 에 그 지점 값을 따로 넣으면 된다 */
const CLINIC_HOURS = [
  { label: '평일', time: '10:00–21:00' },
  { label: '토요일', time: '10:00–16:00' },
  { label: '공휴일(평일)', time: '10:00–18:00' },
  { label: '공휴일(토요일)', time: '10:00–14:30' },
];
const CLINIC_HOURS_NOTE = '대체공휴일은 정상 진료합니다'; // 진료시간 아래 작은 글씨(파랑)

window.SITE = {
  branches: [
    {
      id: 'changwon',
      name: '창원점',
      fullName: '화이트e치과의원 창원점',
      address: '경상남도 창원시 성산구 단정로 7, 밀레니엄타워 3층', // 원고(docs/content/treatments-6-content.md '지점 정보') 표기
      addressLines: ['경상남도 창원시 성산구 단정로 7', '밀레니엄타워 3층'], // 병원소개 오시는길 표: 의미 단위 줄 나눔 (2번째 줄 뒤에 (addressNote))
      addressNote: '상남동 롯데리아 3층',
      ceo: '이은주',
      bizNo: '566-95-00700',
      tel: '055-716-2884',
      email: 'whitee2018@naver.com',
      hoursVerified: true, // 병원 제공 자료(2026-11-10) — 일요일 휴진 표기 여부만 확인(docs/HOSPITAL-CHECK.md #1)
      hours: CLINIC_HOURS,
      hoursNote: CLINIC_HOURS_NOTE,
      naverMap: 'https://naver.me/FY3f3LdP',
      naverBooking: '', // TODO: 창원점 네이버 예약 링크 병원 확인 — 비어 있으면 퀵메뉴 네이버예약이 네이버 지도(naverMap)로 연결
      landmark: '상남동 다이소 앞 건물',
      parking: '건물 지하주차장 무료 · 상남동 공영주차빌딩 1시간 무료',
      amenities: ['예약', '주차', '무선인터넷', '남/녀 화장실 구분'],
      transit: [], // TODO: 창원점 대중교통 안내 병원 확인
    },
    {
      id: 'masan',
      name: '마산점',
      fullName: '화이트e치과의원 마산점',
      address: '경상남도 창원시 마산회원구 3·15대로 686, 9~10층', // 원고 '지점 정보'와 같음
      addressLines: ['경상남도 창원시 마산회원구 3·15대로 686', '9~10층'],
      addressNote: '석전동 365병원',
      ceo: '정호석',
      bizNo: '577-91-01943',
      tel: '055-255-2000',
      email: 'whitee2024@naver.com',
      hoursVerified: true, // 병원 제공 자료(2026-11-10) — 일요일 휴진 표기 여부만 확인(docs/HOSPITAL-CHECK.md #1)
      hours: CLINIC_HOURS,
      hoursNote: CLINIC_HOURS_NOTE,
      naverMap: 'https://naver.me/xWTYEspr',
      naverBooking: '', // TODO: 마산점 네이버 예약 링크 병원 확인 — 비어 있으면 퀵메뉴 네이버예약이 네이버 지도(naverMap)로 연결
      landmark: '마산역 도보 3분',
      parking: '', // TODO: 마산점 주차 안내 병원 확인
      amenities: ['예약', '주차', '무선인터넷', '남/녀 화장실 구분'],
      transit: [
        { type: '자가용', lines: ['경상남도 창원시 마산회원구 3·15대로 686, 9~10층 (석전동 365병원)'] },
        { type: '시내버스', lines: ['마산역 365병원 정류장 하차 (마산시외버스터미널 방향)', '간선 100, 101, 103, 110, 111, 113, 115, 122, 162 · 지선 24, 27, 46, 50, 71, 262, 263 · 급행 800 · 좌석 707, 710, 762'] },
        { type: '시외버스', lines: ['마산시외버스터미널 하차 → 간선 101 → 마산역 하차 → 도보 250m', '또는 터미널에서 도보 10분 (700m)'] },
        { type: '기차', lines: ['경전선 마산역 하차, 도보 5분 (350m)'] },
      ],
    },
  ],

  /* 병원소개(about/clinic.html) 내부 둘러보기 — 파일은 assets/images/tour-{지점}-NN.jpg, 순서 = 갤러리 순서 (사진 5장이면 PC 에서 마지막 장이 두 칸) */
  tour: {
    // 창원점: 실제 원내 사진 (자료/서브/병원소개-창원, 파일 이름 = 공간) — 첫 장은 갤러리 큰 칸
    changwon: [
      { file: 'tour-changwon-01.jpg', caption: '대기실' },
      { file: 'tour-changwon-02.jpg', caption: '상담실' },
      { file: 'tour-changwon-03.jpg', caption: '통로' },
      { file: 'tour-changwon-04.jpg', caption: '병원 입구' },
      { file: 'tour-changwon-05.jpg', caption: '진료실' },
      { file: 'tour-changwon-06.jpg', caption: '진료실 전경' },
    ],
    // 마산점: 실제 원내 사진 (자료/서브/병원소개-마산, 2024-03 촬영 240307_MED_*) — 첫 장은 갤러리 큰 칸
    masan: [
      { file: 'tour-masan-01.jpg', caption: '대기실' },
      { file: 'tour-masan-02.jpg', caption: '병원 입구' },
      { file: 'tour-masan-03.jpg', caption: '접수·안내 데스크' },
      { file: 'tour-masan-04.jpg', caption: '진료실' },
      { file: 'tour-masan-05.jpg', caption: '상담실' },
      { file: 'tour-masan-06.jpg', caption: '대기 라운지' },
    ],
  },

  /* 지점별 SNS (비어 있으면 링크가 비활성 처리됨) */
  social: {
    changwonInstagram: 'https://www.instagram.com/changwon_white2/',
    changwonBlog: 'https://blog.naver.com/whitee2018',
    masanInstagram: 'https://www.instagram.com/masan_white2/',
    masanBlog: 'https://blog.naver.com/whitee2024',
  },

  /* 의료진 — 지점별, 대표원장 먼저. branches 가 2개면 '창원·마산' 겸직 태그
     career: 기존 사이트 약력 이미지를 텍스트로 옮긴 것 (리뉴얼 콘텐츠 정리.docx). 오탈자 가능성 있음 → 오픈 전 병원 확인
             이은주·정호석은 병원 원내 약력(자료/원내 원장님 약력_2023.04월 원내약력.hwp)과 대조해 반영 (2026-11-06)
     메인 의료진 사진 보정 (배경 지운 사진 doctor-{영문}-cut.png, 400×664 기준) — 원장마다 촬영 거리가 달라서
       photoScale   사진 배율 (1 = 기본. 얼굴이 작아 보이면 키우고, 커 보이면 줄인다)
       photoOffsetY 위아래 이동, 사진 칸 높이 대비 % (+ 아래로 / - 위로) → 정수리 선을 맞춘다
       photoOffsetX 좌우 이동, 사진 칸 높이 대비 % (+ 오른쪽 / - 왼쪽), 없으면 0
       photoBlend   흰 배경 사진의 흰색을 섹션 배경과 섞어 지우기(mix-blend-mode: multiply). 없으면 켜짐.
                    지금 -cut.png 는 전원 흰 배경(투명 아님)이라 모두 true → 배경을 지운 투명 PNG 로 바꾼 원장은 false 로
       photoBacker  true 면 사진 뒤에 흰 둥근 그라데이션(인물 크기)을 깐다 — 섹션 배경 사진(doctors-bg.jpg)의 무늬가 흰 가운 등으로 비칠 때 그 원장만.
                    photoBlend: true 일 때만 쓰임 (투명 PNG 면 필요 없음). 없으면 꺼짐
     지금 값 = '정수리 ~ 턱' 높이가 모두 같고(사진 기준 225px) 정수리가 칸 위에서 7% 선에 오도록 계산한 값. 방법은 README '자주 하는 수정'
     의료진 소개 페이지(about/doctors.html) 사진 크롭 — staffCrop: { scale, x, y } (메인 의료진 photoScale·photoOffset 과 따로, 2026-11-08)
       기준 = 김영우 원장 구도(머리~가슴). 사진 칸 = 상자 위로 튀어나온 부분(--pop) + 상자 높이. pages.js renderDoctorsPage 가 --cs/--cx/--cy 로 넘김
       scale  사진 높이 ÷ 사진 칸 높이. 얼굴 길이(정수리~턱)가 모두 같게: 김영우 1/(1-0.05) × (김영우 얼굴 0.415 ÷ 이 원장 얼굴 길이, 사진 높이 대비)
       x      얼굴 가운데의 가로 위치(사진 너비 대비 0~1) → 이 점을 사진 칸 가운데에 맞춘다
       y      정수리 위치(사진 높이 대비 0~1) → 이 점을 사진 칸 위 끝에 맞춘다 (= 상자 위로 튀어나온 높이 모두 같음)
       아래쪽은 상자 아래 끝에서 잘림(상반신). 사진을 바꾸면 정수리·턱·얼굴 가운데를 다시 재서 넣는다 */
  /* 메인 히어로 슬라이드별 사진 설정 (index.html 슬라이드 순서와 같게, main.js initHero 가 적용) — PC(1025px 이상)에만
       pos     사진 위치 object-position ('가로% 세로%') — 사진이 화면보다 넓거나 높을 때 어느 쪽을 보일지
       scale   확대 비율 (1 = 꽉 채움). 1 보다 크면 origin 을 기준으로 키운다 — 피사체를 가운데~오른쪽으로 옮길 때
       origin  확대 기준점 transform-origin ('가로% 세로%'), 없으면 가운데
       caption 인물 이름표 { name, role, x, y } — x·y = 이름표 왼쪽 위 위치(히어로 기준 %). 의료진이 없는 사진은 넣지 않는다
               1367px 이상에서만 보이고(그 아래·모바일은 숨김), 슬라이드가 들어온 뒤 0.4s 후 아래에서 올라온다
     모바일은 사진 위치를 따로(main.css 768px 이하) */
  heroSlides: [
    { pos: '0% 40%' }, // 1 브랜드(hero-01-brand.jpg 1944×809 가로로 긴 사진): 왼쪽 끝 맞춤 — 왼쪽 모니터·세면대 위에 글자, 환자는 오른쪽 (모바일은 가운데)
    { pos: '64% 30%', caption: { name: '정호석 대표원장', role: '통합치의학과 전문의', x: 75, y: 54 } }, // 2 진료 장면(2026-11-10 교체 — 자료/의료진/정호석-KakaoTalk_20230516_144714707.jpg 를 원장님 가까이 3:2 로 자름): 원장님 가운데~오른쪽, 왼쪽은 스태프(글자 자리)
    { pos: '36% 50%', scale: 1.1, caption: { name: '이은주 대표원장', role: '치과교정과 전문의', x: 60, y: 45 } }, // 2 상담: 원장님이 화면 가로 약 60~85%
    { pos: '50% 50%' }, // 3 야경(자료/메인페이지/tc02290001877.jpg): 퇴근길 도로·빌딩, 가운데 맞춤
    { pos: '50% 46%' }, // 4 임플란트 모형(세로 사진 — 가로 꽉 채움): 모형이 가운데~오른쪽, 확대는 하지 않음(이미 크게 보임)
  ],

  /* 전문의 진료과 — 메인 '분야별 전문의' 설명 · 치과소개 COLLABORATION · 임플란트·치아교정 전문의 원 · 4가지 약속 '협진' 문구 공통 (common.js renderSiteBlocks)
     치주과는 뺌 (2026-11-09: 치주과 전문의 원장 퇴사, 보류 중 — 잇몸치료 진료 항목은 그대로). 보존과 = 조혜진 원장(치과보존과 전문의) */
  specialties: ['치과교정과', '치과보철과', '치과보존과', '구강악안면외과', '통합치의학과'],

  /* 진료 철학 — 치과소개 인트로(about/intro.html .slogan) · 메인 WHY WHITE e 왼쪽 공통 (기존 홈페이지 메인 배너 이미지 문구 그대로)
       words = 세 단어 [한글, 한자, 풀이] → 치과소개 부제는 풀이를 ', ' 로 이어 붙임, text = 치과소개 본문 */
  philosophy: {
    words: [
      { ko: '소통', hanja: '疏通', desc: '내 마음을 듣고' },
      { ko: '교감', hanja: '交感', desc: '내 마음을 알아주고' },
      { ko: '공감', hanja: '共感', desc: '내 마음을 살피는 치료' },
    ],
    text: '원인을 파악하고 개인별 맞춤 책임진료를 통해 환자분의 입장에서 한 번 더 생각하여 가족처럼 소중히 치료하겠습니다.',
  },

  /* 화이트e치과 4가지 약속 — 치과소개(about/intro.html WHY WHITE e) · 메인(WHY 화이트e) 공통
       icon = svg 안쪽 (viewBox 0 0 24 24, 선), text = 치과소개용 설명, short = 메인용 한 줄 ({spec} = 진료과 목록)
       image = 메인 카드 배경 사진 (assets/images/ 안 — 병원 사진을 받으면 이 값만 교체), imagePos = 세로 카드에서 보일 위치(object-position, 없으면 가운데)
       href = 메인 카드 연결 주소 (사이트 루트 기준) — 2026-11-09 '자세히 보기' 삭제로 지금은 쓰지 않음, 다시 링크를 달 때 사용 */
  promises: [
    { title: '분야별 협진 진료시스템', text: '{spec} 전문의가 함께 진료합니다.', short: '분야별 전문의가 함께 진단하고 계획합니다',
      image: 'banner-clinic.jpg', href: 'about/intro.html#collaboration',
      icon: '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2 20c0-3.3 2.7-6 6-6 1.5 0 2.9.6 4 1.5A6 6 0 0122 20"/>' },
    { title: '전지점 공동운영 기공센터', text: '창원점·마산점이 기공센터를 함께 운영합니다.', short: '창원점·마산점이 기공센터를 함께 운영합니다', // TODO: 기공센터 설명 병원 확인
      image: 'promise-lab.jpg', imagePos: '34% center', href: 'about/intro.html#why', // 기공 작업 손·세라믹 치아 (자료/메인페이지/pc0040586614.jpg → 1600px)
      icon: '<path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"/>' },
    { title: '합리적인 치료비용', text: '상담과 정확한 진단을 바탕으로 합리적인 비용의 치료를 계획합니다.', short: '정확한 진단으로 꼭 필요한 치료만 계획합니다',
      image: 'promise-cost.jpg', imagePos: '64% center', href: 'about/intro.html#why', // 치아 저금통·동전 (자료/메인페이지/cm080938973.jpg → 1600px)
      icon: '<circle cx="12" cy="12" r="9"/><path d="M8 9l2 6 2-4 2 4 2-6M7 12h10"/>' },
    { title: '전지점 평일 야간진료', text: '창원점·마산점 모두 평일 저녁 9시까지 진료합니다.', short: '창원점·마산점 모두 평일 저녁 9시까지',
      image: 'promise-night.jpg', href: 'about/clinic.html#loc-title-changwon', // 마산점 입구 — 화이트e치과 간판·평일 야간진료 안내 (공유폴더 권혜빈/클라이언트2/[화이트E치과 창원마산점]/마산점/인테리어/240307_MED_0003.jpeg → 1600px) // 병원 오시는길 — 창원점 오시는길(진료시간) 블록
      icon: '<path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z"/>' },
  ],

  /* 협력 기관 — 메인 'WHITE e PARTNERS' · 치과소개(about/intro.html #partners) 공통 (common.js renderSiteBlocks)
       출처: 2026-11-02 커밋 bd5b31e(디자인 2차)에서 처음 입력 — 출처 기록 없음. 기존 홈페이지(메인·의료진소개 이미지)·자료 폴더에서도 확인 못 함
       → 모두 verified: false (병원 확인 필요 목록: docs/PARTNERS-CHECK.md). 지우지 않고 유지
       highlights 강조 카드: icon = svg 안쪽(viewBox 0 0 24 24, 선)
       list 협력 기관: logo = assets/images/partners/ 안 파일 이름 — 있으면 로고 이미지, 비어 있으면 글자 타일 (로고를 받으면 logo 만 채우면 됨) */
  partners: {
    highlights: [
      { title: '부산대학병원 협력', desc: '협력 의료기관', verified: false, // TODO: 협력 내용 확인
        icon: '<path d="M4 21V8l8-5 8 5v13"/><path d="M9 21v-5h6v5M12 8v5M9.5 10.5h5"/>' },
      { title: '경찰 자문', desc: '자문 활동', verified: false, // TODO: 자문 내용 확인
        icon: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>' },
      { title: '방송 출연', desc: '‘세상에 이런일이’', verified: false,
        icon: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 3l4 4 4-4"/>' },
    ],
    list: [
      { name: "전국금속노동조합", logo: '', verified: false },
      { name: "DOOSAN", logo: '', verified: false },
      { name: "한화디펜스", logo: '', verified: false },
      { name: "경상남도 대한미용협회", logo: '', verified: false },
      { name: "창원대학교", logo: '', verified: false },
      { name: "창원시 배드민턴협회", logo: '', verified: false },
      { name: "마산 어시장상인회", logo: '', verified: false },
      { name: "한국실버경찰봉사대 의창구지회", logo: '', verified: false },
      { name: "웨딩드림", logo: '', verified: false },
      { name: "라라한방병원", logo: '', verified: false },
      { name: "미시안 안과의원", logo: '', verified: false },
      { name: "미시안 여성의원", logo: '', verified: false },
      { name: "창원시 사회인 야구단", logo: '', verified: false },
      { name: "(주)창원청과시장", logo: '', verified: false },
      { name: "탑골프아카데미", logo: '', verified: false },
      { name: "효성중공업", logo: '', verified: false },
      { name: "경남 자율방재단연합회", logo: '', verified: false },
      { name: "창원시 소프트볼협회", logo: '', verified: false, note: "처음 넣을 때부터 '로고 확인' 표시가 있던 항목" },
      { name: "바르게살기운동 경남협의회", logo: '', verified: false },
      { name: "창원 LG 세이커스", logo: '', verified: false },
      { name: "경남FC", logo: '', verified: false },
      { name: "창원 시청축구단", logo: '', verified: false },
      { name: "창원 성산소방서", logo: '', verified: false },
      { name: "엔디티 엔지니어링(주)", logo: '', verified: false },
      { name: "중소기업융합경남연합회", logo: '', verified: false },
      { name: "가온내과", logo: '', verified: false },
      { name: "365병원", logo: '', verified: false, note: "마산점 건물(석전동 365병원)과 이름이 같음 — 주소 정보에서 잘못 들어온 것인지 확인" },
      { name: "강추한방병원", logo: '', verified: false },
      { name: "창원메트로시티석전 아파트", logo: '', verified: false, note: "마산점 주소 동네(석전동)와 겹침 — 주소 정보에서 잘못 들어온 것인지 확인" },
    ],
  },

  /* 지점별 의료진 순서 (이름) — 의료진 소개(about/doctors.html) · 메인 의료진 공통 (SITE.getDoctorsByBranch 가 이 순서로 정렬)
     2026-11-10 병원 요청: 대표원장 → 김영우 원장 → 나머지는 그전 순서 그대로. 목록에 없는 원장은 뒤에 데이터 순서대로
     메인 의료진 섹션은 따로 mainDoctorOrder(아래)를 쓴다 */
  doctorOrder: {
    changwon: ['이은주', '김영우', '권진선', '이휘소'],
    masan: ['정호석', '김영우', '송희태', '조용정', '조혜진'],
  },
  /* 메인 의료진 섹션 인물 나열 순서 (왼쪽 → 오른쪽, 이름) — 의료진 소개 페이지(doctorOrder)와 따로 관리 (2026-11-10 병원 요청으로 오늘 수정 전 순서로 되돌림)
     대표원장을 가운데 두는 배치. 목록에 없는 원장은 뒤에 데이터 순서대로 */
  mainDoctorOrder: {
    changwon: ['권진선', '이은주', '김영우', '이휘소'], // 이은주·김영우 가운데, 권진선·이휘소 양옆
    masan: ['조혜진', '김영우', '정호석', '조용정', '송희태'], // 정호석 가운데, 김영우·조용정 양옆, 조혜진·송희태 바깥
  },

  /* 의료진 — 의료진 소개(about/doctors.html)·메인 의료진 공통
       focus  주요 진료 (의료진 소개 이름 아래 진료과 태그 옆) — 진료과 기준 임시 작성, 병원 확인 필요(HANDOVER)
       logos  학회·학교 로고 [{ src: 'logo-xxx.png', alt: '대한치과교정학회' }] — 의료진 소개 이름 줄 오른쪽 끝 (assets/images/, 지금은 비어 있음)
       photoHeadTop 사진(doctor-*-cut.png) 안 머리 위 끝 위치 (사진 높이 대비 0~1, 사진을 바꾸면 다시 잴 것) — 의료진 소개에서 머리가 약력 상자 위로 100px 나오게 사진 높이를 정하는 데 쓴다 (이 페이지는 photoScale·photoOffset 대신 이 값)
       career 약력 — 화면에서 자동 분류(SITE.classifyCareer): 전문의 / 학력 / 경력 / 학회 활동 */
  doctors: [
    // 창원점
    {
      name: '이은주', focus: '교정치료, 투명교정, 설측교정', logos: [], title: '대표원장', dept: '치과교정과', branches: ['changwon'], photo: 'doctor-lee-eunju.jpg', staffCrop: { scale: 1.32, x: 0.498, y: 0.167 }, photoHeadTop: 0.167, photoScale: 1.15, photoOffsetY: 2.3, photoBlend: false, photoBacker: false, // 배경 투명 PNG (2026-11-06 교체: 이은주2-Photoroom.png)
      career: [
        '보건복지부 인증 치과교정과 전문의', '보건복지부 인증 통합치의학과 전문의',
        '부산대학교 치과대학 수석졸업', '부산대학교 치과교정학 석사', '부산대학교병원 치과교정과 인턴·레지던트 수료',
        '부산대학교병원 개원 50주년 기념 우수직원 표창', '대한치과교정학회 우수포스터 수상', '서울대학교 턱교정연수회 수료·우등상 수상',
        '대한치과교정학회 인정의·정회원', '미국치과교정학회(AAO) 국제회원', '세계교정치과의사연맹(WFO) 펠로우',
        '대한설측교정학회(KALO) 회원', '대한통합치과학회 정회원',
      ],
    },
    {
      name: '권진선', focus: '임플란트, 보철치료', logos: [], title: '원장', dept: '치과보철과', branches: ['changwon'], photo: 'doctor-kwon-jinseon.jpg', staffCrop: { scale: 1.495, x: 0.529, y: 0.061 }, photoHeadTop: 0.061, photoScale: 1.22, photoOffsetY: 21.7, photoOffsetX: -0.1, photoBlend: false, photoBacker: false,
      career: [
        '보건복지부 인증 치과보철과 전문의', '부산대학교 치과병원 치과보철과 외래교수', '부산대학교 대학원 치과보철학 박사',
        '부산대학교 치의학전문대학원 졸업', '부산대학교 치과병원 인턴, 치과보철과 레지던트 수료', '대한치과보철학회 인정의·정회원',
      ],
    },
    {
      name: '이휘소', focus: '충치치료, 신경치료, 보철치료', logos: [], title: '원장', dept: '보철·보존', branches: ['changwon'], photo: 'doctor-lee-hwiso.jpg', staffCrop: { scale: 1.603, x: 0.495, y: 0.063 }, photoHeadTop: 0.063, photoScale: 1.21, photoOffsetY: 20.3, photoBlend: false, photoBacker: false, // 배경 투명 PNG (2026-11-09 교체: 이휘소 원장-Photoroom.png 1600×2400 → 기존 구도대로 잘라 400×664)
      career: [
        '연세대학교 치과대학 졸업', '대한치과의사협회지 2021.06 논문 저자', '오스템 엔도 세미나, 김평식 엔도 세미나 수료',
        '대한치과보존학회·대한심미치과학회 정회원', '경남교통방송(tbn) 라디오 출연', '대한치과의사협회 표창장 (2021)', '전) 김제시보건소 역학조사관',
      ],
    },
    // 마산점
    {
      // TODO: 진료과 표기 병원 확인 — 현재 '통합치의학과', 기존 사이트 약력에는 '소아치과 전문의'로 표기됨
      name: '정호석', focus: '임플란트, 보철치료, 소아치료', logos: [], title: '대표원장', dept: '통합치의학과', branches: ['masan'], photo: 'doctor-jeong-hoseok.jpg', staffCrop: { scale: 1.677, x: 0.485, y: 0.145 }, photoHeadTop: 0.145, photoScale: 1.17, photoOffsetY: 7.2, photoOffsetX: 0.9, photoBlend: false, photoBacker: false,
      career: [
        '보건복지부 인증 소아치과 전문의', '보건복지부 인증 통합치의학과 전문의', '원광대학교 치과대학 졸업', '원광대학교병원 소아치과 인턴·레지던트 수료', '원광대학교 치과대학원 수료',
        '화성시치과의사회 회장 역임, (현) 고문', '대한치과보철학회 인증 우수보철치과의사과정 수료', '미국 펜실베니아대학교 근관치료과정 수료',
        '대한소아치과학회 인정의·정회원', '대한치과보존학회·대한치과보철학회·대한치주과학회·대한통합치과학회 정회원',
      ],
    },
    {
      name: '송희태', focus: '교정치료, 투명교정', logos: [], title: '원장', dept: '치과교정과', branches: ['masan'], photo: 'doctor-song-heetae.jpg', staffCrop: { scale: 1.319, x: 0.622, y: 0.104 }, photoHeadTop: 0.104, photoScale: 1, photoOffsetY: -3.3, photoOffsetX: -2.9, photoBlend: false, photoBacker: false,
      career: [
        '보건복지부 인증 치과교정과 전문의', '보건복지부 인증 통합치의학과 전문의', '대한치과교정학회 인정의',
        '서울대학교 학사, 경희대학교 치의학석사', '경희대학교 치과병원 인턴 수석 수료, 교정과 레지던트', '대한치과교정학회 정회원',
        '세계교정의사연맹 Fellow, 미국·유럽·일본 치과교정학회 국제회원', '인코그니토·인비절라인·MTA(Mini tube appliance) 인증의',
        '「Plus+ smile excellence」 2016 편저', '대한치과교정학회 우수증례상 (2020, 2022)',
      ],
    },
    {
      name: '조용정', focus: '임플란트, 보철치료', logos: [], title: '원장', dept: '치과보철과', branches: ['masan'], photo: 'doctor-cho-yongjeong.jpg', staffCrop: { scale: 1.479, x: 0.4, y: 0.056 }, photoHeadTop: 0.054, photoScale: 1.16, photoOffsetY: 16.5, photoOffsetX: 3, photoBlend: false, photoBacker: false, // 배경 투명 PNG (2026-11-09 교체: 조용정 원장님.png 1365×2048 → 기존 구도대로 잘라 602×999)
      career: [
        '보건복지부 인증 치과보철과 전문의', '서울대학교 치과대학 졸업', '강남성모병원 인턴, 치과보철과 레지던트 수료',
        '대한치과보철학회 인정의·정회원', '국군수도병원 보철과장 역임', '전) 서울에스바른치과 대표원장',
      ],
    },
    {
      name: '조혜진', focus: '충치치료, 신경치료', logos: [], title: '원장', dept: '치과보존과', branches: ['masan'], photo: 'doctor-cho-hyejin.jpg', staffCrop: { scale: 1.377, x: 0.547, y: 0.041 }, photoHeadTop: 0.041, photoScale: 1.08, photoOffsetY: 9.2, photoOffsetX: 0.8, photoBlend: false, photoBacker: false,
      career: [
        '보건복지부 인증 치과보존과 전문의', '보건복지부 인증 통합치의학과 전문의', '원광대학교 치과대학 졸업',
        '조선대학교 치과병원 인턴, 치과보존과 레지던트 수료', '대한치과보존학회 인정의·정회원',
        '대한통합치과학회·대한근관치료학회·대한현미경치과학회 정회원',
      ],
    },
    // 겸직
    {
      name: '김영우', focus: '임플란트, 사랑니발치', logos: [], title: '원장', dept: '구강악안면외과', branches: ['changwon', 'masan'], photo: 'doctor-kim-youngwoo.jpg', staffCrop: { scale: 1.072, x: 0.444, y: 0.067 }, photoHeadTop: 0.064, photoScale: 0.95, photoOffsetY: -4.3, photoOffsetX: 3.2, photoBlend: false, photoBacker: false,
      career: [
        '보건복지부 인증 구강악안면외과 전문의', '보건복지부 인증 통합치의학과 전문의', '서울대학교치과병원 구강악안면외과 인턴·레지던트 수료',
        '서울대학교 치의학대학원 구강악안면외과학 석사 수료', '대한구강악안면성형재건외과학회 인정의',
        '구강악안면임플란트학회·국제임플란트학회·대한통합치의학회 정회원',
      ],
    },
  ],
};

/** 약력 분류 (메인 의료진 팝업 · 의료진 소개 공통) — 'cert' 전문의 / 'edu' 학력(졸업·석사·박사·학사) / 'society' 학회 활동(학회·연맹 회원·인정의·펠로우) / 'career' 그 외 경력
    분류가 애매한 항목은 경력으로 간다 → docs/HANDOVER.md '약력 분류 병원 확인' */
window.SITE.classifyCareer = function (c) {
  if (c.startsWith('보건복지부 인증')) return 'cert';
  if (/졸업|석사|박사|학사/.test(c)) return 'edu';
  if (/학회|연맹/.test(c) && /회원|인정의|펠로우|Fellow/.test(c) && !/수상|표창|수료|발표/.test(c)) return 'society';
  return 'career';
};
/** 경력 중 연수·세미나·과정 수료 (의료진 소개에서 학회와 같은 기본 글자로) — 인턴·레지던트·대학원 수료는 경력 그대로 */
window.SITE.isTraining = (c) => /세미나|연수|과정|코스|인증의/.test(c) && !/인턴|레지던트|대학원/.test(c);
/** 학회 활동 항목 나누기 (표시만, 데이터는 그대로)
    "세계교정의사연맹 Fellow, 미국·유럽·일본 치과교정학회 국제회원" → ', ' 로 (각 부분이 학회·연맹일 때)
    "대한치과보존학회·대한치주과학회 정회원" → '·' 로 나누고 끝의 공통 꼬리(정회원)를 각 학회에 붙인다 */
window.SITE.splitSociety = function splitSociety(c) {
  const commaParts = c.split(', ');
  if (commaParts.length > 1 && commaParts.every((p) => /학회|연맹/.test(p))) return commaParts.flatMap(splitSociety);
  const parts = c.split('·');
  if (parts.length < 2 || !parts.every((p) => /학회/.test(p))) return [c];
  const tail = parts[parts.length - 1].match(/^(.*학회)(\s.+)$/);
  if (!tail) return [c];
  return parts.map((p, i) => (i === parts.length - 1 ? p : p + tail[2]));
};

/** 의료진 앵커 id 용 slug — 사진 파일명에서 (doctor-lee-eunju.jpg → lee-eunju)
    의료진 소개 페이지의 각 원장 위치 = about/doctors.html#{지점id}-{slug} */
window.SITE.doctorSlug = (d) => d.photo.replace(/^doctor-/, '').replace(/\.\w+$/, '');

/** 지점별 의료진 — SITE.doctorOrder[지점] 순서(없는 원장은 뒤에 데이터 순서), 겸직 의사는 양쪽에 모두 포함 */
window.SITE.getDoctorsByBranch = function (branchId) {
  const order = (window.SITE.doctorOrder || {})[branchId] || [];
  const rank = (d) => { const i = order.indexOf(d.name); return i < 0 ? order.length : i; };
  return window.SITE.doctors.filter((d) => d.branches.includes(branchId)).map((d, i) => [d, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(([d]) => d);
};
/** 진료시간 한 줄 글자 — '평일 10:00–21:00 · 토요일 10:00–16:00 · …' (FAQ 답변 {hours} 등) */
window.SITE.hoursText = function (branch) {
  const b = branch || window.SITE.branches[0];
  return (b.hours || []).map((h) => `${h.label} ${h.time}`).join(' · ');
};
