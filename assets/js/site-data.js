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
      addressNote: '상남동 롯데리아 3층',
      ceo: '이은주',
      bizNo: '566-95-00700',
      tel: '055-716-2884',
      email: 'whitee2018@naver.com',
      hours: [
        { label: '평일', time: '10:00–21:00' },
        { label: '토요일', time: '10:00–16:00' },
        { label: '일요일', time: '휴진' },
      ],
      hoursShort: '평일 10:00–21:00 / 토 10:00–16:00',
      naverMap: 'https://naver.me/FY3f3LdP',
      landmark: '상남동 롯데리아 3층 · 상남동 다이소 앞 건물',
      parking: '건물 지하주차장 무료 · 상남동 공영주차빌딩 1시간 무료',
      amenities: ['예약', '주차', '무선인터넷', '남/녀 화장실 구분'],
      transit: [], // TODO: 창원점 대중교통 안내 병원 확인
    },
    {
      id: 'masan',
      name: '마산점',
      fullName: '화이트e치과의원 마산점',
      address: '경상남도 창원시 마산회원구 3·15대로 686, 9~10층',
      addressNote: '석전동 365병원',
      ceo: '정호석',
      bizNo: '577-91-01943',
      tel: '055-255-2000',
      email: 'whitee2024@naver.com',
      hours: [
        { label: '평일', time: '10:00–21:00' },
        { label: '토요일', time: '10:00–16:00' },
        { label: '일요일', time: '휴진' },
      ],
      hoursShort: '평일 10:00–21:00 / 토 10:00–16:00',
      naverMap: 'https://naver.me/xWTYEspr',
      landmark: '마산역 도보 3분 · 석전동 365병원 9~10층', // TODO: 호수 표기(1001·1002호) 통일 여부 병원 확인
      parking: '', // TODO: 마산점 주차 안내 병원 확인
      amenities: ['예약', '주차', '무선인터넷', '남/녀 화장실 구분'],
      transit: [
        { type: '자가용', lines: ['경남 창원시 마산회원구 3·15대로 686'] },
        { type: '시내버스', lines: ['마산역 365병원 정류장 하차 (마산시외버스터미널 방향)', '간선 100, 101, 103, 110, 111, 113, 115, 122, 162 · 지선 24, 27, 46, 50, 71, 262, 263 · 급행 800 · 좌석 707, 710, 762'] },
        { type: '시외버스', lines: ['마산시외버스터미널 하차 → 간선 101 → 마산역 하차 → 도보 250m', '또는 터미널에서 도보 10분 (700m)'] },
        { type: '기차', lines: ['경전선 마산역 하차, 도보 5분 (350m)'] },
      ],
    },
  ],

  /* 병원 둘러보기 — TODO: 실제 원내 사진·공간별 캡션 받으면 교체 (지금은 temp/ 임시 이미지) */
  tour: {
    changwon: [1, 2, 3, 4, 5, 6].map((n) => ({ file: `tour-changwon-0${n}.jpg`, caption: `창원점 원내 0${n}` })),
    masan: [1, 2, 3, 4, 5, 6].map((n) => ({ file: `tour-masan-0${n}.jpg`, caption: `마산점 원내 0${n}` })),
  },

  /* 지점별 SNS — TODO: 병원에서 실제 URL 받으면 입력 (비어 있으면 링크가 비활성 처리됨) */
  social: {
    changwonInstagram: '', // TODO
    changwonBlog: '',      // TODO
    masanInstagram: '',    // TODO
    masanBlog: '',         // TODO
  },

  /* 의료진 — 지점별, 대표원장 먼저. branches 가 2개면 '창원·마산' 겸직 태그 */
  doctors: [
    // 창원점
    { name: '이은주', title: '대표원장', dept: '치과교정과', branches: ['changwon'], photo: 'doctor-lee-eunju.jpg' },
    { name: '권진선', title: '원장', dept: '치과보철과', branches: ['changwon'], photo: 'doctor-kwon-jinseon.jpg' },
    { name: '정정원', title: '원장', dept: '치주과', branches: ['changwon'], photo: 'doctor-jeong-jeongwon.jpg' },
    { name: '이휘소', title: '원장', dept: '보철·보존', branches: ['changwon'], photo: 'doctor-lee-hwiso.jpg' },
    // 마산점
    // TODO: 정호석 대표원장 진료과 표기(통합치의학과) 병원 확인 필요
    { name: '정호석', title: '대표원장', dept: '통합치의학과', branches: ['masan'], photo: 'doctor-jeong-hoseok.jpg' },
    { name: '송희태', title: '원장', dept: '치과교정과', branches: ['masan'], photo: 'doctor-song-heetae.jpg' },
    { name: '김현탁', title: '원장', dept: '치과보철과', branches: ['masan'], photo: 'doctor-kim-hyeontak.jpg' },
    { name: '조용정', title: '원장', dept: '치과보철과', branches: ['masan'], photo: 'doctor-cho-yongjeong.jpg' },
    { name: '조혜진', title: '원장', dept: '치과보존과', branches: ['masan'], photo: 'doctor-cho-hyejin.jpg' },
    // 겸직
    { name: '김영우', title: '원장', dept: '구강악안면외과', branches: ['changwon', 'masan'], photo: 'doctor-kim-youngwoo.jpg' },
  ],
};

/** 지점별 의료진 — 대표원장 → 원장 순서(배열 순서 유지), 겸직 의사는 양쪽에 모두 포함 */
window.SITE.getDoctorsByBranch = function (branchId) {
  return window.SITE.doctors.filter((d) => d.branches.includes(branchId));
};
