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
  go(
    req.body || req.params || req.query,
    parameterFormCheck,
    f => f(authRq[getUrl(req.originalUrl)]),
    result => result
    ? next()
    : respondOnError(res, resultCode.incorrectParamForm, {desc: "incorrect parameter form"})
  );
});

router.post('/login', async (req, res) => {
  const { type = 'kakao', account, name } = req.body;
  const data = {
    name: name,
    authType: type,
    thirdPartyAccount: account
  };

  try {
    const token = await go(
        data,
        options => userModel.findOne({ where: options }),
        result => !!result
        ? respondJson(res, resultCode.success, { token: result.token })
        : uuidv4()
    );

    data.token = token;

    go(
      data,
      userModel.create,
      insertResult => setFirstAuth(insertResult.token, insertResult.id),
      setAuthResult => respondJson(res, resultCode.success, { token: setAuthResult })
    );

  } catch (error) {
    respondOnError(res, resultCode.error, error.message);
  }
});

module.exports = router;
