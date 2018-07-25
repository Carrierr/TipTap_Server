module.exports = {
    authRq: {
      '/auth/check': {
        version: 0.1, // 클라이언트 로컬의 버전
        auth: null // 클라이언트 고유 키 값
      },
      '/auth/signup': {
        name: "giseoplee",
      	phone: "01045843552",
      	mail: "llgs901@naver.com",
      	type: "kakao"
      },
      '/auth/signin': {
        auth: "17cbb619-b4a8-4b57-b9ea-7572e97a7ea0"
      },
    }
}
