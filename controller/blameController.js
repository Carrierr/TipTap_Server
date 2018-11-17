const express = require('express');
const util = require('util');
const moment = require('moment');
const router = express.Router();

const { respondJson, respondOnError } = require('../utils/respond');
const { blameModel } = require('../model');
const { getValue, setValue, updateValue } = require('../modules/redisModule');
const resultCode = require('../utils/resultCode');
const { parameterFormCheck, getUrl } = require('../utils/common');
const { blameRq } = require('../utils/requestForm');

const controllerName = 'Blame';

router.use((req, res, next) => {

    console.log(util.format('[Logger]::[Controller]::[%sController]::[Access Ip %s]::[Access Time %s]',
                                controllerName,
                                req.ip,
                                moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
                            ));

    go(
      req.body || req.params || req.query,
      parameterFormCheck,
      f => f(blameRq[getUrl(req.originalUrl)]),
      result => result
      ? next()
      : respondOnError(res, resultCode.incorrectParamForm, {desc: "incorrect parameter form"})
    );
});

router.post('/report', async (req, res) => {
    try {
        const { key = false, block = [] } = await go(
            req.headers['tiptap-token'],
            getValue
        );

        if (!key) throw { message: 'Unknown Token Error' };

        const { content_id, type, target_user_id } = req.body;
        const blameData = {
            content_id: content_id,
            type: type,
            user_id: key,
            target_user_id: target_user_id
        };
        block.push(target_user_id);

        if (!['porn', 'ad', 'other'].includes(type)) {
            return respondOnError(res, resultCode.error, { desc: 'Unknow Report Type' });
        }

        return go(
          block,
          block => updateValue(req.headers['tiptap-token'], { key: 'block', value: block }).catch(e => { throw e }),
          _ => blameModel.create(blameData).catch(e => { throw e }),
          result => !!result
          ? respondJson(res, resultCode.success, { desc: 'Completed Report' })
          : respondOnError(res, resultCode.error, { desc: 'Report Fail' })
        );
    } catch (error) {
        return respondOnError(res, resultCode.error, error.message);
    }
});

router.post('/write', async (req, res) => {
    try {
      const fileName = req.files ? req.files.diaryFile.name : false;
      const { content, location, latitude, longitude } = req.body;
      const data = {
          content: content,
          location: location,
          latitude: latitude,
          longitude: longitude
      };
      let diaryToStampMapperIndex;

      const { key, stamp = [], todayIndex = 0 } = await go(
        req.headers['tiptap-token'],
        getValue,
        obj => obj
        ? obj
        : respondOnError(res, resultCode.error, { desc: 'unknown token' })
      );

      if (todayIndex > 9) {
        return respondOnError(res, resultCode.error, { desc: `can't write greater than 10 diary for today` });
      }

      data.user_id = key;
      data.todayIndex = todayIndex + 1;

      fileName
      ? go(
          null,
          createDir,
          dir => createSaveFileData(fileName, dir, req.headers['tiptap-token']),
          result => {
              data.imagePath = result.path;
              data.imageUrl = `${baseUrl}/${moment().tz('Asia/Seoul').format('YYYYMMDD')}/${result.name}`;
              req.files.diaryFile.name = result.name;
              return req.files;
          },
          imagesTypeCheck,
          writeFile,
          fileWriteResult => fileWriteResult
          ? true
          : respondOnError(res, resultCode.error, {'desc' : 'file write fail'}),
          _ => diaryModel.create(data).catch(e => respondOnError(res, resultCode.error, e.message)),
          result => {
            diaryToStampMapperIndex = result.dataValues.id;
            return result;
          },
          _ => getRemainStamp(stamp),
          getRandomStamp,
          stamp => updateSession(req.headers['tiptap-token'], stamp, data.todayIndex, diaryToStampMapperIndex),
          _ => respondJson(res, resultCode.success, { desc: 'completed write diary' })
      )
      : go(
          null,
          _ => diaryModel.create(data).catch(e => respondOnError(res, resultCode.error, e.message)),
          result => {
            diaryToStampMapperIndex = result.dataValues.id;
            return result;
          },
          _ => getRemainStamp(stamp),
          getRandomStamp,
          stamp => updateSession(req.headers['tiptap-token'], stamp, data.todayIndex, diaryToStampMapperIndex),
          _ => respondJson(res, resultCode.success, { desc: 'completed write diary' })
      );
    } catch (error) {
      respondOnError(res, resultCode.error, error.message);
    }
});

module.exports = router;
