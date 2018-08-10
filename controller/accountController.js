const express = require('express');
const util = require('util');
const moment = require('moment');
const _ = require('lodash');
const router = express.Router();

const { respondJson, respondOnError } = require('../utils/respond');
const { diaryModel } = require('../model');
const { getValue } = require('../modules/redisModule');
const resultCode = require('../utils/resultCode');
const { parameterFormCheck, getUrl } = require('../utils/common');
const { accountRq } = require('../utils/requestForm');

const controllerName = 'Account';

router.use((req, res, next) => {

    console.log(util.format('[Logger]::[Controller]::[%sController]::[Access Ip %s]::[Access Time %s]',
                                controllerName,
                                req.ip,
                                moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
                            ));
    parameterFormCheck(
        req.body || req.params || req.query,
        accountRq[getUrl(req.originalUrl)])
        ? next()
        : respondOnError(res, resultCode.incorrectParamForm, {desc: "incorrect parameter form"});
});

router.post('/update', (req, res) => {
    const { name, notification, shareFlag, registrationKey, deviceType } = req.body;
    const options = {
        data: {
            name: name,
            notification: notification,
            shareFlag: shareFlag,
            registrationKey: registrationKey,
            deviceType: deviceType
        }
    };
    const findOptions = {};
    const data = {
        registrationKey: registrationKey,
        deviceType: deviceType
    };

    go(
        req.headers['tiptap-token'],
        getValue,
        result => result
        ? ((key) => {
            options.where = {id: key};
            findOptions.where  = {id: key};
            data.user_id = key;
            return options;
        })(result.key)
        : respondOnError(res, resultCode.error, { desc: 'unknown token' }),
        options => userModel.update(options).catch(e => respondOnError(res, resultCode.error, e.message)),
        _ => pushModel.findOne(findOptions),
        result => result
        ? pushModel.update({where: { user_id: result.id }, data: data}).catch(e => respondOnError(res, resultCode.error, e.message))
        : pushModel.create(data).catch(e => respondOnError(res, resultCode.error, e.message)),
        _ => respondJson(res, resultCode.success, { desc: 'completed update' })
    );
});

module.exports = router;
