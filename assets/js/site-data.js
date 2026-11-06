/* ==========================================================================
   병원 기본 데이터 — 지점·의료진·SNS
   병원 정보가 바뀌면 이 파일만 고치면 된다. (2차에 Supabase로 옮길 대상 아님: 거의 안 바뀌는 정보)
   ========================================================================== */
window.SITE = {
  branches: [
    {
      id: 'changwon',
      name: '창원점',
      fullName: '화이트e치과의원 창원점',
      address: '경상남도 창원시 성산구 단정로 7 밀레니엄타워 3층',
      addressLines: ['경상남도 창원시 성산구 단정로 7', '밀레니엄타워 3층'], // 병원소개 오시는길 표: 의미 단위 줄 나눔 (2번째 줄 뒤에 (addressNote))
      addressNote: '상남동 롯데리아 3층',
      ceo: '이은주',
      bizNo: '566-95-00700',
      tel: '055-716-2884',
      email: 'whitee2018@naver.com',
      hours: [
        { label: '평일', time: '10:00–21:00' },
        { label: '토', time: '10:00–16:00' },
        { label: '일요일', time: '휴진' },
      ],
      hoursShort: '평일 10:00–21:00 · 토 10:00–16:00 · 일요일 휴진',
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
      address: '경상남도 창원시 마산회원구 3·15대로 686, 9~10층',
      addressLines: ['경상남도 창원시 마산회원구 3·15대로 686', '9~10층'],
      addressNote: '석전동 365병원',
      ceo: '정호석',
      bizNo: '577-91-01943',
      tel: '055-255-2000',
      email: 'whitee2024@naver.com',
      hours: [
        { label: '평일', time: '10:00–21:00' },
        { label: '토', time: '10:00–16:00' },
        { label: '일요일', time: '휴진' },
      ],
      hoursShort: '평일 10:00–21:00 · 토 10:00–16:00 · 일요일 휴진',
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
     지금 값 = '정수리 ~ 턱' 높이가 모두 같고(사진 기준 225px) 정수리가 칸 위에서 7% 선에 오도록 계산한 값. 방법은 README '자주 하는 수정' */
  /* 메인 히어로 슬라이드별 사진 설정 (index.html 슬라이드 순서와 같게, main.js initHero 가 적용) — PC(1025px 이상)에만
       pos     사진 위치 object-position ('가로% 세로%') — 사진이 화면보다 넓거나 높을 때 어느 쪽을 보일지
       scale   확대 비율 (1 = 꽉 채움). 1 보다 크면 origin 을 기준으로 키운다 — 피사체를 가운데~오른쪽으로 옮길 때
       origin  확대 기준점 transform-origin ('가로% 세로%'), 없으면 가운데
       caption 인물 이름표 { name, role, x, y } — x·y = 이름표 왼쪽 위 위치(히어로 기준 %). 의료진이 없는 사진은 넣지 않는다
               1367px 이상에서만 보이고(그 아래·모바일은 숨김), 슬라이드가 들어온 뒤 0.4s 후 아래에서 올라온다
     모바일은 사진 위치를 따로(main.css 768px 이하) */
  heroSlides: [
    { pos: '50% 40%' }, // 1 진료 장면: 입·손이 이미 가운데~오른쪽
    { pos: '36% 50%', scale: 1.1, caption: { name: '이은주 대표원장', role: '치과교정과 전문의', x: 60, y: 45 } }, // 2 상담: 원장님이 화면 가로 약 60~85%
    { pos: '78% 50%' }, // 3 야경 건물: 건물을 오른쪽으로
    { pos: '50% 46%' }, // 4 임플란트 모형(세로 사진 — 가로 꽉 채움): 모형이 가운데~오른쪽, 확대는 하지 않음(이미 크게 보임)
  ],

  /* 메인 의료진 섹션 인물 나열 순서 (왼쪽 → 오른쪽, 이름). 없는 지점은 대표원장 먼저 + 데이터 순서. 의료진 소개 페이지 순서는 그대로 */
  mainDoctorOrder: {
    changwon: ['권진선', '이은주', '김영우', '이휘소'], // 이은주·김영우 가운데, 권진선·이휘소 양옆
    masan: ['조혜진', '김영우', '정호석', '조용정', '송희태'], // 정호석 가운데, 김영우·조용정 양옆, 조혜진·송희태 바깥
  },

  doctors: [
    // 창원점
    {
      name: '이은주', title: '대표원장', dept: '치과교정과', branches: ['changwon'], photo: 'doctor-lee-eunju.jpg', photoScale: 1.15, photoOffsetY: 2.3, photoBlend: false, photoBacker: false, // 배경 투명 PNG (2026-11-06 교체: 이은주2-Photoroom.png)
      career: [
        '보건복지부 인증 치과교정과 전문의', '보건복지부 인증 통합치의학과 전문의',
        '부산대학교 치과대학 수석졸업', '부산대학교 치과교정학 석사', '부산대학교병원 치과교정과 인턴·레지던트 수료',
        '부산대학교병원 개원 50주년 기념 우수직원 표창', '대한치과교정학회 우수포스터 수상', '서울대학교 턱교정연수회 수료·우등상 수상',
        '대한치과교정학회 인정의·정회원', '미국치과교정학회(AAO) 국제회원', '세계교정치과의사연맹(WFO) 펠로우',
        '대한설측교정학회(KALO) 회원', '대한통합치과학회 정회원',
      ],
    },
    {
      name: '권진선', title: '원장', dept: '치과보철과', branches: ['changwon'], photo: 'doctor-kwon-jinseon.jpg', photoScale: 1.14, photoOffsetY: 12.1, photoBlend: true, photoBacker: true,
      career: [
        '보건복지부 인증 치과보철과 전문의', '부산대학교 치과병원 치과보철과 외래교수', '부산대학교 대학원 치과보철학 박사',
        '부산대학교 치의학전문대학원 졸업', '부산대학교 치과병원 인턴, 치과보철과 레지던트 수료', '대한치과보철학회 인정의·정회원',
      ],
    },
    {
      name: '이휘소', title: '원장', dept: '보철·보존', branches: ['changwon'], photo: 'doctor-lee-hwiso.jpg', photoScale: 1.21, photoOffsetY: 20.3, photoBlend: true, photoBacker: true,
      career: [
        '연세대학교 치과대학 졸업', '대한치과의사협회지 2021.06 논문 저자', '오스템 엔도 세미나, 김평식 엔도 세미나 수료',
        '대한치과보존학회·대한심미치과학회 정회원', '경남교통방송(tbn) 라디오 출연', '대한치과의사협회 표창장 (2021)', '전) 김제시보건소 역학조사관',
      ],
    },
    // 마산점
    {
      // TODO: 진료과 표기 병원 확인 — 현재 '통합치의학과', 기존 사이트 약력에는 '소아치과 전문의'로 표기됨
      name: '정호석', title: '대표원장', dept: '통합치의학과', branches: ['masan'], photo: 'doctor-jeong-hoseok.jpg', photoScale: 1.07, photoOffsetY: 7.1, photoBlend: true, photoBacker: true,
      career: [
        '보건복지부 인증 소아치과 전문의', '보건복지부 인증 통합치의학과 전문의', '원광대학교 치과대학 졸업', '원광대학교병원 소아치과 인턴·레지던트 수료', '원광대학교 치과대학원 수료',
        '화성시치과의사회 회장 역임, (현) 고문', '대한치과보철학회 인증 우수보철치과의사과정 수료', '미국 펜실베니아대학교 근관치료과정 수료',
        '대한소아치과학회 인정의·정회원', '대한치과보존학회·대한치과보철학회·대한치주과학회·대한통합치과학회 정회원',
      ],
    },
    {
      name: '송희태', title: '원장', dept: '치과교정과', branches: ['masan'], photo: 'doctor-song-heetae.jpg', photoScale: 0.99, photoOffsetY: -3.3, photoBlend: true, photoBacker: true,
      career: [
        '보건복지부 인증 치과교정과 전문의', '보건복지부 인증 통합치의학과 전문의', '대한치과교정학회 인정의',
        '서울대학교 학사, 경희대학교 치의학석사', '경희대학교 치과병원 인턴 수석 수료, 교정과 레지던트', '대한치과교정학회 정회원',
        '세계교정의사연맹 Fellow, 미국·유럽·일본 치과교정학회 국제회원', '인코그니토·인비절라인·MTA(Mini tube appliance) 인증의',
        '「Plus+ smile excellence」 2016 편저', '대한치과교정학회 우수증례상 (2020, 2022)',
      ],
    },
    {
      name: '조용정', title: '원장', dept: '치과보철과', branches: ['masan'], photo: 'doctor-cho-yongjeong.jpg', photoScale: 1.16, photoOffsetY: 16.5, photoOffsetX: 3, photoBlend: true, photoBacker: true,
      career: [
        '보건복지부 인증 치과보철과 전문의', '서울대학교 치과대학 졸업', '강남성모병원 인턴, 치과보철과 레지던트 수료',
        '대한치과보철학회 인정의·정회원', '국군수도병원 보철과장 역임', '전) 서울에스바른치과 대표원장',
      ],
    },
    {
      name: '조혜진', title: '원장', dept: '치과보존과', branches: ['masan'], photo: 'doctor-cho-hyejin.jpg', photoScale: 1.08, photoOffsetY: 7, photoBlend: true, photoBacker: true,
      career: [
        '보건복지부 인증 치과보존과 전문의', '보건복지부 인증 통합치의학과 전문의', '원광대학교 치과대학 졸업',
        '조선대학교 치과병원 인턴, 치과보존과 레지던트 수료', '대한치과보존학회 인정의·정회원',
        '대한통합치과학회·대한근관치료학회·대한현미경치과학회 정회원',
      ],
    },
    // 겸직
    {
      name: '김영우', title: '원장', dept: '구강악안면외과', branches: ['changwon', 'masan'], photo: 'doctor-kim-youngwoo.jpg', photoScale: 0.93, photoOffsetY: -4.3, photoBlend: true, photoBacker: true,
      career: [
        '보건복지부 인증 구강악안면외과 전문의', '보건복지부 인증 통합치의학과 전문의', '서울대학교치과병원 구강악안면외과 인턴·레지던트 수료',
        '서울대학교 치의학대학원 구강악안면외과학 석사 수료', '대한구강악안면성형재건외과학회 인정의',
        '구강악안면임플란트학회·국제임플란트학회·대한통합치의학회 정회원',
      ],
    },
  ],
};

/** 의료진 앵커 id 용 slug — 사진 파일명에서 (doctor-lee-eunju.jpg → lee-eunju)
    의료진 소개 페이지의 각 원장 위치 = about/doctors.html#{지점id}-{slug} */
window.SITE.doctorSlug = (d) => d.photo.replace(/^doctor-/, '').replace(/\.\w+$/, '');

/** 지점별 의료진 — 대표원장 → 원장 순서(배열 순서 유지), 겸직 의사는 양쪽에 모두 포함 */
window.SITE.getDoctorsByBranch = function (branchId) {
  return window.SITE.doctors.filter((d) => d.branches.includes(branchId));
};
