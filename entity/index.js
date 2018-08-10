const sequelize = require('sequelize');
const sequelizeInstance = require('./instance');

const version = sequelizeInstance.define('version', {
    version: { type: sequelize.CHAR(20), allowNull: false },
},
{
    charset: 'utf8',
    collate: 'utf8_unicode_ci'
});

const user = sequelizeInstance.define('user', {
    name: { type: sequelize.STRING(30), allowNull: false }, // 이름
    phone: { type: sequelize.STRING(15), allowNull: true }, // 핸드폰번호
    authType: { type: sequelize.CHAR(10), allowNull: false }, // 서드파티 인증 타입 (ex. kakao, naver, facebook))
    thirdPartyAccount: { type: sequelize.STRING(100), allowNull: false }, // 서드파티 (ex. 카카오) 계정
    shareFlag: { type: sequelize.BOOLEAN, allowNull: true, defaultValue : 1 }, // 공유 가능 여부
    star: { type: sequelize.SMALLINT.UNSIGNED, allowNull: true, defaultValue : 0 },
    follwing: { type: sequelize.SMALLINT.UNSIGNED, allowNull: true, defaultValue : 0 },
    follwed: { type: sequelize.SMALLINT.UNSIGNED, allowNull: true, defaultValue : 0 },
    notification: { type: sequelize.BOOLEAN, allowNull: true, defaultValue : 1 }, // 1. 푸시 알림 허용, 0. 푸시 알림 차단
    token: { type: sequelize.STRING(40), allowNull: true },
    loginedAt: { type: sequelize.DATE, allowNull: true }
},
{
    charset: 'utf8',
    collate: 'utf8_unicode_ci'
});

const push = sequelizeInstance.define('push', {
    user_id: { type: sequelize.INTEGER(11), allowNull : false },
    registrationKey: { type: sequelize.STRING(255), allowNull: true }, // registration_key
    deviceType: { type: sequelize.CHAR(7), allowNull: false, defaultValue : 'android' }, // 안드로이드, ios 구분
},
{
    charset: 'utf8',
    collate: 'utf8_unicode_ci'
});

const diary = sequelizeInstance.define('diary', {
    user_id: { type : sequelize.INTEGER(11), allowNull : false }, // 작성자
    content: { type: sequelize.STRING(1500), allowNull: true }, // 일기 내용
    location: { type: sequelize.STRING(255), allowNull: false }, // 일기 작성 주소
    imagePath: { type: sequelize.STRING(300), allowNull: true }, // 이미지 저장 경로
    imageUrl: { type: sequelize.STRING(200), allowNull: true }, // 이미지 Url
    latitude: { type : sequelize.STRING(30), allowNull : false }, // 경도
    longitude: { type : sequelize.STRING(30), allowNull : false }, // 위도
    star: { type: sequelize.SMALLINT.UNSIGNED, allowNull: true, defaultValue : 0 },
},
{
    charset: 'utf8',
    collate: 'utf8_unicode_ci'
});

const notification = sequelizeInstance.define('notification', {
    user_id: { type : sequelize.INTEGER(11), allowNull : false }, // 수신 사용자
    send_user_id: { type : sequelize.INTEGER(11), allowNull : true }, // 송신 사용자, 관리자가 보낼 수도 있으니 allowNull = true
    reservation: { type: sequelize.BOOLEAN, allowNull: false, defaultValue : 0 }, // 예약 발송 여부
    type: { type: sequelize.CHAR(10), allowNull: false, defaultValue : 'normal' },
    content_id: { type: sequelize.INTEGER(11), allowNull: true },
    message: { type: sequelize.STRING(500), allowNull: true },
    link: { type: sequelize.STRING(500), allowNull: true },
    sendTime: { type: sequelize.DATE, allowNull: true },
    readedAt: { type: sequelize.DATE, allowNull: true }
},
{
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
    indexes : [
      {
          unique : false,
          fields : [ 'reservation' ]
      }
    ]
});

const blame = sequelizeInstance.define('blame', {
    content_id: { type: sequelize.INTEGER(11), allowNull: false }, // 신고 컨텐츠 pk
    type: { type: sequelize.CHAR(20), allowNull: false },
    user_id: { type : sequelize.INTEGER(11), allowNull : false },
    target_user_id: { type : sequelize.INTEGER(11), allowNull : false }
},
{
    charset: 'utf8',
    collate: 'utf8_unicode_ci'
});

module.exports = {
  user,
  diary,
  notification,
  blame,
  version,
  push
};
