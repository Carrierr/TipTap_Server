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
    nickname: { type: sequelize.STRING(50), allowNull: true }, // 별칭
    phone: { type: sequelize.STRING(15), allowNull: false }, // 핸드폰번호
    mail: { type: sequelize.STRING(70), allowNull: false }, // 이메일
    star: { type: sequelize.SMALLINT.UNSIGNED, allowNull: true, defaultValue : 0 },
    follwing: { type: sequelize.SMALLINT.UNSIGNED, allowNull: true, defaultValue : 0 },
    follwed: { type: sequelize.SMALLINT.UNSIGNED, allowNull: true, defaultValue : 0 },
    notification: { type: sequelize.BOOLEAN, allowNull: true, defaultValue : 1 }, // 1. 푸시 알림 허용, 0. 푸시 알림 차단
    imagePath: { type: sequelize.STRING(300), allowNull: true }, // 이미지 경로
    imageNames: { type: sequelize.STRING(300), allowNull: true }, // 이미지 이름
    loginedAt: { type: sequelize.DATE, allowNull: false }
},
{
    charset: 'utf8',
    collate: 'utf8_unicode_ci'
});

const auth = sequelizeInstance.define('auth', {
    user_id: { type : sequelize.INTEGER(11), allowNull : false },
    type: { type: sequelize.STRING(30), allowNull: true }, // 인증 방법 (google, naver, kakao 등)
    authKey: { type: sequelize.STRING(255), allowNull: true }, // 클라이언트에 저장된 = 발급할 키
    version: { type: sequelize.CHAR(4), allowNull: false, defaultValue : '1' }, // 1. 정상, 0. 정지
    authentication: { type: sequelize.BOOLEAN, allowNull: true, defaultValue : 0 } // 1. 정상, 0. 정지
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
  auth,
  notification,
  blame,
  version
};
