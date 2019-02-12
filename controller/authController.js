const express = require('express');
const util = require('util');
const uuidv4 = require('uuid/v4');
const moment = require('moment');
const _ = require('lodash');
const router = express.Router();

const { respondJson, respondOnError } = require('../utils/respond');
const { setFirstAuth, getAuth, setAuth, delAuth } = require('../modules/redisModule');
const { sendMail } = require('../modules/mailSenderModule');
const { userModel } = require('../model');
const resultCode = require('../utils/resultCode');
const { generateCertification, hash } = require('../utils/common');

const controllerName = 'Auth';

router.use((req, res, next) => {

  console.log(util.format('[Logger]::[Controller]::[%sController]::[Access Ip %s]::[Access Time %s]',
                              controllerName,
                              req.ip,
                              moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
                          ));
  next();
});

router.post('/mail', async (req, res) => {
  try {
    const { auth, mail } = req.body;
    let result = await getAuth(mail);
    if (!!result) auth == result ? result = true : result = false;
    
    switch (result) {
      case null : return respondJson(res, resultCode.authorizationError, { message: '알 수 없는 메일 주소입니다!' })
      case false : return respondJson(res, resultCode.authorizationError, { message: '잘못된 인증번호 입니다! 메일로 발송된 인증번호를 다시 확인해주세요!' })
      case true :  {
        await setAuth(mail, 'authSuccess');
        return respondJson(res, resultCode.success, { message: '인증 완료' });
      }
      default : {
        return respondJson(res, resultCode.authorizationError, { message: 'Unknown Error' });
      }
    }
  } catch (error) {
    return respondOnError(res, resultCode.error, error.message);
  }
});

router.post('/send/mail', async (req, res) => {
  try {
    const { mail } = req.body;
    const duplicate = await go(
      mail,
      email => userModel.findOne({ where: { thirdPartyAccount: email } }),
      result => !result ? false : true
    );

    if (duplicate) {
      return respondJson(res, resultCode.authorizationError, { message: '이미 가입된 이메일입니다! 다시 한번 확인해주세요!' });
    }

    const cert = generateCertification();
    await setAuth(mail, cert);
    
    return await go(
      mail,
      (mailTo, contents = {}) => (contents = {
        template: 'authorization',
        message: {
          subject: '[TipTap] 회원가입 인증코드',
          to: mailTo
        },
        locals: {
          code: cert
        }
      }, contents),
      sendMail,
      result => respondJson(res, resultCode.success, { to : result.accepted, messageId: result.messageId })
    );
  } catch (error) {
    return respondOnError(res, resultCode.error, error.message);
  }
});

router.post('/sign/up/mail', async (req, res) => {
  try {
    const { account, name, password } = req.body;
    const duplicate = await go(
      account,
      email => userModel.findOne({ where: { thirdPartyAccount: email } }),
      result => !result ? false : true
    );

    if (duplicate) return respondJson(res, resultCode.authorizationError, { message: '이미 가입된 이메일입니다! 다시 한번 확인해주세요!' });
    
    const auth = await go(
      account,
      getAuth,
      result => result === 'authSuccess' ? true : false
    );

    if (!auth) return respondJson(res, resultCode.authorizationError, { message: '인증이 완료되지 않은 이메일 주소입니다! 인증을 먼저 완료해주세요!' });

    await delAuth(account);
    const data = {
      name: name,
      authType: 'email',
      thirdPartyAccount: account,
      password: hash(password),
      token: uuidv4()
    };

    return go(
      data,
      userModel.create,
      ({ id, token }) => setFirstAuth(token, id),
      token => respondJson(res, resultCode.success, { token: token, existed: false })
    );
  } catch (error) {
    return respondOnError(res, resultCode.error, error.message);
  }
});

router.post('/login', async (req, res) => {
  try {
    const { type = 'kakao', account, name = '', password = false } = req.body;
    const data = {
      name: name,
      authType: type,
      thirdPartyAccount: account
    };

    if (type == 'email') (data.password = hash(password), delete data.name)

    const user = await go(
      data,
      options => userModel.findOne({ where: options })
    );

    if (user) return respondJson(res, resultCode.success, { token: user.token, existed: true });
    if (type == 'email' && !user) return respondJson(res, resultCode.error, { message: '로그인에 실패하였습니다! 이메일 또는 비밀번호를 다시 확인해주세요!' });

    return go(
      (data.token = uuidv4(), data),
      userModel.create,
      ({ token, id }) => setFirstAuth(token, id),
      token => respondJson(res, resultCode.success, { token: token, existed: false })
    );
  } catch (error) {
    return respondOnError(res, resultCode.error, error.message);
  }
});

module.exports = router;
