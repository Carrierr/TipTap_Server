const express = require('express');
const sequelize = require('sequelize');
const util = require('util');
const moment = require('moment');
const path = require('path');
const _ = require('lodash');
const router = express.Router();

const resultCode = require('../utils/resultCode');
const { respondJson, respondOnError, respondHtml } = require('../utils/respond');
const { write, createDir } = require('../modules/fileModule');
const { imagesTypeCheck } = require('../utils/common');

const controllerName = 'File';

router.use((req, res, next) => {

  console.log(util.format('[Logger]::[Controller]::[%sController]::[Access Ip %s]::[Access Time %s]',
                              controllerName,
                              req.ip,
                              moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
                          ));
  next();
});

router.post('/write', (req, res) => {
  log(req.files)
  createDir()
  .then(async () => {
    return await go(req.files,
      imagesTypeCheck,
      write
    )
  })
  .then(result =>
    result
    ? respondJson(res, resultCode.success, {'desc' : 'file write success'})
    : respondJson(res, resultCode.error, {'desc' : 'file write fail'})
  )
  .catch(e => respondOnError(res, resultCode.error, e.message))
});

module.exports = router;
