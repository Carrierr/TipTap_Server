module.exports = {
    /* 1000 대역 : 범용 사용 코드 */
    success: '1000', /* 정상 응답 */
    /* 4000 대역 : api access 관련 코드 */
    accessDenine: '4000', /* 차단 등으로 api access 접근 불가 */
    authorizationError: '5000', /* 회원 가입 시 인증 에러 */
    /* 9000 대역 : 에러 코드 */
    error: '9000', /* 일반 실패 */
    incorrectParamForm: '9001' /* 파라메터 규격이 맞지 않음 */
}