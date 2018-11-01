module.exports = {
    authRq: {
      '/auth/login': {
        type: 'kakao',
        account: 'llgs901@naver.com',
        name: '이기섭'
      }
    },
    accountRq: {
      '/account/update': {
        name: '이기섭',
        notification: 1,
        shareFlag: 1,
        registrationKey: 'registration_key', // 푸시 사용자 토큰
        deviceType: 'android' // android or ios 소문자
      },
      '/account/readed/diary/reset': {}
    },
    diaryRq: {
      '/diary/list/by/date': {},
      '/diary/list': {},
      '/diary/random': {},
      '/diary/today': {},
      '/diary/detail': {},
      '/diary/block': {
        user_id: 1
      },
      '/diary/write': {
        	content: "tiptap diary content",
        	location: "서울시 금천구 가산동 533-22",
        	latitude: "36.806702",
        	longitude: "126.979874"
      },
      '/diary/update': {
          id: 1,
          content: "tiptap diary content",
        	location: "서울시 금천구 가산동 533-22",
        	latitude: "36.806702",
        	longitude: "126.979874"
      },
      '/diary/delete': {
        id: '1'
      },
      '/diary/delete/day': {
        date: '2018-09-26'
      }
    },
    fileRq: {
      '/file/write': {}
    }
}
