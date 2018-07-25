const express = require('express');
const util = require('util');
const uuidv4 = require('uuid/v4');
const moment = require('moment');
const _ = require('lodash');
const router = express.Router();

const { respondJson, respondOnError, respondHtml } = require('../utils/respond');
const { getValue, setValue, setDefaultKey } = require('../modules/redisModule');
const { authModel, userModel } = require('../model');
const resultCode = require('../utils/resultCode');
const { parameterFormCheck, getUrl } = require('../utils/common');
const { authRq } = require('../utils/requestForm');

const controllerName = 'Auth';

router.use((req, res, next) => {

  console.log(util.format('[Logger]::[Controller]::[%sController]::[Access Ip %s]::[Access Time %s]',
                              controllerName,
                              req.ip,
                              moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
                          ));
  parameterFormCheck(
    req.body || req.params || req.query,
    authRq[getUrl(req.originalUrl)]) ? next()
      : respondOnError(res, resultCode.incorrectParamForm, {desc: "incorrect parameter form"});
});

router.post('/check', (req, res) => {

  const { version, auth } = req.body;
  const options = {
    attributes: ['version'],
    order: [['id', 'DESC']]
  };

  authModel.versionCheck(options)
  .then(result => go(result,
    R => {
      const report = {};
      report.version = R.dataValues.version == version ? true : false;
      getValue(auth)
      .then(authR => {
        !!authR ? respondJson(res, resultCode.success,
          ((r, a) => {
            r.auth = (JSON.parse(a)).auth;
            return r;
          })(report, authR))
            : setDefaultKey(uuidv4())
              .then(setR => {
                report.auth = setR;
                respondJson(res, resultCode.generateKey, report);
              });
      });
    }
  ))
  .catch(e => respondOnError(res, resultCode.error, e.message));
});

router.post('/signup', (req, res) => {

  const { name, phone, mail, type } = req.body;
  const auth = req.headers['travel-auth'];
  const data = {
    name: name,
    phone: phone,
    mail: mail,
    type: type,
    loginedAt: moment().tz('Asia/Seoul').format('YYYY-MM-DD hh:mm:ss')
  };

  go(null,
    _ => userModel.create(data).catch(e => respondOnError(res, resultCode.error, e.message)),
    rdbR => setValue(auth, JSON.stringify({auth: true, userId: rdbR.id})),
    redisR => redisR == 'OK' ? respondJson(res, resultCode.success, redisR)
                              : respondOnError(res, resultCode.error, redisR)
  );
});

router.post('/signin', (req, res) => {
  console.log(req)
});

module.exports = router;
