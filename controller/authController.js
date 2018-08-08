const express = require('express');
const util = require('util');
const uuidv4 = require('uuid/v4');
const moment = require('moment');
const _ = require('lodash');
const router = express.Router();

const { respondJson, respondOnError } = require('../utils/respond');
const { getValue, setValue, setDefaultKey, setFirstAuth } = require('../modules/redisModule');
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

router.post('/token/create', (req, res) => {
  const { type, account, name } = req.body;
  const data = {
    name: name,
    authType: type,
    thirdPartyAccount: account,
    token: uuidv4()
  };

  go(
    data,
    v => userModel.create(v).catch(e => respondOnError(res, resultCode.error, e.message)),
    insertResult => setFirstAuth(insertResult.token, insertResult.id),
    setAuthResult => respondJson(res, resultCode.success, { token: setAuthResult })
  );
});

router.post('/sign/in', (req, res) => {
  const { type, account, name } = req.body;
  const options = {
    where: {
      authType: type,
      thirdPartyAccount: account,
      name: name
    },
    attributes: ['token']
  };

  go(
      options,
      v => userModel.findOne(v).catch(e => respondOnError(res, resultCode.error, e.message)),
      result => result
      ? respondJson(res, resultCode.success, { token: result.token })
      : respondOnError(res, resultCode.error, { desc: 'not found user' })
  );
});

module.exports = router;
