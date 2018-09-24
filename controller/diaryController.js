const express = require('express');
const util = require('util');
const moment = require('moment');
const _ = require('lodash');
const router = express.Router();

const { respondJson, respondOnError } = require('../utils/respond');
const { diaryModel } = require('../model');
const { getValue, setValue, updateSession, updateValue, deleteStampAndMapper } = require('../modules/redisModule');
const { writeFile, deleteFile, createDir, createSaveFileData } = require('../modules/fileModule');
const resultCode = require('../utils/resultCode');
const { parameterFormCheck, getUrl, imagesTypeCheck, getRemainStamp, getRandomStamp } = require('../utils/common');
const { diaryRq } = require('../utils/requestForm');

const controllerName = 'Diary';

router.use((req, res, next) => {

    console.log(util.format('[Logger]::[Controller]::[%sController]::[Access Ip %s]::[Access Time %s]',
                                controllerName,
                                req.ip,
                                moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
                            ));

    go(
      req.body || req.params || req.query,
      parameterFormCheck,
      f => f(diaryRq[getUrl(req.originalUrl)]),
      result => result
      ? next()
      : respondOnError(res, resultCode.incorrectParamForm, {desc: "incorrect parameter form"})
    );
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

router.get('/detail', async (req, res) => {
  try {
    const { key } = await go(
      req.headers['tiptap-token'],
      getValue,
      obj => obj
      ? obj
      : respondOnError(res, resultCode.error, { desc: 'unknown token' })
    );

    const { date } = req.query;
    const options = {
      where: {
        user_id: key,
        createdAt: { gte: moment(date).format('YYYY-MM-DD'), lt: moment(date).add(1, 'days').format('YYYY-MM-DD') }
      }
    };

    go(
      options,
      diaryModel.findAll,
      result => result.length > 0 ?
      respondJson(res, resultCode.success, { data: result })
      : respondJson(res, resultCode.error, { desc: 'not found diary matches date' })
    );
  } catch (error) {
    respondOnError(res, resultCode.error, error.message);
  }
});

router.get('/list', async (req, res) => {
    try {
      const { key, stamp = [] } = await go(
        req.headers['tiptap-token'],
        getValue,
        obj => obj
        ? obj
        : respondOnError(res, resultCode.error, { desc: 'unknown token' })
      );

      let { page = 1 } = req.query;
      const { startDate = '2000-01-01', endDate = '3000-12-31', limit = 1000 } = req.query;
      const formatedStartTime = Date.parse(moment(startDate).format());
      const formatedEndTime = Date.parse(moment(endDate).add(1, 'days').format());

      const countOptions = {
        where: {
          user_id: key,
          createdAt: { gte: formatedStartTime, lt: formatedEndTime }
        }
      };

      page = parseInt(page);

      const SIZE = parseInt(limit); // 한번에 보여줄 글의 수
      const BEGIN = (page - 1) * parseInt(limit); //시작 글
      let totalPage;

      const tableRange = curry((cnt, key) => {
          totalPage = Math.ceil(cnt / SIZE);
          const options = {};
          options.order = [['id', 'DESC']];
          options.where = { createdAt: { gte: formatedStartTime, lt: formatedEndTime }, user_id: key };
          options.offset = BEGIN;
          options.limit = SIZE;
          return options;
      });

      go(
          countOptions,
          options => diaryModel.count(options),
          tableRange,
          f => f(key),
          options => diaryModel.findAll(options).catch(e => respondOnError(res, resultCode.error, e.message)),
          result => respondJson(res, resultCode.success, { list: monthlyConvert(result), total: totalPage, stamp: stamp })
      );
    } catch (error) {
      respondOnError(res, resultCode.error, error.message);
    }
});

router.get('/random', async (req, res) => {
    try {
      let { key, readed = [] } = await go(
        req.headers['tiptap-token'],
        getValue,
        obj => obj
        ? obj
        : respondOnError(res, resultCode.error, { desc: 'unknown token' })
      );

      const options = {
        where: {
          id: { notIn: readed },
          user_id: { not: key },
          shared: 1
        },
        limit: 1
      };

      go(
          options,
          diaryModel.getRandomDiaryOne,
          result => {
            if (result.length === 0) respondOnError(res, resultCode.error, 'no more data');
            const { user_id, createdAt } = result[0].dataValues;
            const options = {
                where: {
                    user_id: user_id,
                    createdAt: {
                        $between: [
                            `${moment(createdAt).format('YYYY-MM-DD')} 00:00:00`,
                            `${moment(createdAt).add(1, 'days').format('YYYY-MM-DD')} 00:00:00`
                        ]
                    }
                }
            };
            return options;
          },
          diaryModel.findAll,
          data => {
              return go(
                  null,
                  _ => updateValue(req.headers['tiptap-token'], { key: 'readed' ,value: readed.concat(map(ele => ele.dataValues.id, data)) })
                  .catch(error => respondOnError(res, resultCode.error, error.message)),
                  _ => data
              );
          },
          result => respondJson(res, resultCode.success, { data: result })
      );
    } catch (error) {
      respondOnError(res, resultCode.error, error.message);
    }
});

router.get('/today', async (req, res) => {
    try {
      const options = {};
      const { key, stamp = [] } = await go(
        req.headers['tiptap-token'],
        getValue,
        obj => obj
        ? obj
        : respondOnError(res, resultCode.error, { desc: 'unknown token' })
      );

      options.where = { user_id: key };

      go(
        null,
        _ => diaryModel.findToday(options).catch(e => respondOnError(res, resultCode.error, e.message)),
        result => respondJson(res, resultCode.success, { list: result, stamp: stamp })
      );
    } catch (error) {
      respondOnError(res, resultCode.error, error.message);
    }
});

router.post('/update', async (req, res) => {
    try {
      const fileName = req.files ? req.files.diaryFile.name : false;
      const { content, location, latitude, longitude, id } = req.body;
      const options = {
          data: {
              content: content,
              location: location,
              latitude: latitude,
              longitude: longitude
          },
          where: {
              id: id
          }
      };

      const { key } = await go(
        req.headers['tiptap-token'],
        getValue,
        obj => obj
        ? obj
        : respondOnError(res, resultCode.error, { desc: 'unknown token' })
      );

      options.where.user_id = key;

      fileName
      ? go(
          id,
          target => diaryModel.findDeleteTarget({ where: { id: target } }).catch(e => respondOnError(res, resultCode.error, e.message)),
          deleteTarget => deleteFile(deleteTarget.imagePath),
          createDir,
          dir => createSaveFileData(fileName, dir, req.headers['tiptap-token']),
          result => {
              options.data.imagePath = result.path;
              options.data.imageUrl = `${baseUrl}/${moment().tz('Asia/Seoul').format('YYYYMMDD')}/${result.name}`;
              req.files.diaryFile.name = result.name;
              return req.files;
          },
          imagesTypeCheck,
          writeFile,
          fileWriteResult => fileWriteResult
          ? true
          : respondOnError(res, resultCode.error, {'desc' : 'file write fail'}),
          _ => diaryModel.update(options).catch(e => respondOnError(res, resultCode.error, e.message)),
          _ => respondJson(res, resultCode.success, { desc: 'completed update diary' })
      )
      : go(
          _ => diaryModel.update(options).catch(e => respondOnError(res, resultCode.error, e.message)),
          _ => respondJson(res, resultCode.success, { desc: 'completed update diary' })
      );
    } catch (error) {
      respondOnError(res, resultCode.error, error.message);
    }
});

router.post('/delete', async (req, res) => {
    try {
      const { key } = await go(
        req.headers['tiptap-token'],
        getValue,
        obj => obj
        ? obj
        : respondOnError(res, resultCode.error, { desc: 'unknown token' })
      );
      const { id } = req.body;
      const options = {
          where: {
              id: id,
              user_id: key
          }
      };

      go(
          req.headers['tiptap-token'],
          deleteStampAndMapper,
          f => f(id),
          _ => diaryModel.delete(options).catch(e => respondOnError(res, resultCode.error, e.message)),
          _ => respondJson(res, resultCode.success, { desc: 'completed delete diary' })
      );
    } catch (error) {
      respondOnError(res, resultCode.error, error.message);
    }
});

function monthlyConvert(arg) {
    const list = map(obj => obj.dataValues, arg);
    return reduce((acc, obj) => {
        return acc.length > 0 ?
        go(
            null,
            _ => find(val => val.year === moment(obj.createdAt).format('YYYY') && val.month === moment(obj.createdAt).format('MM'), acc),
            result => {
                !result ?
                acc.push({
                    year: moment(obj.createdAt).format('YYYY'),
                    month: moment(obj.createdAt).format('MM'),
                    datas: Array(obj)
                })
                : acc[acc.findIndex(item => item.year === result.year && item.month === result.month)].datas.push(obj);
                return acc;
            }
        )
        : (() => {
            acc.push({
                year: moment(obj.createdAt).format('YYYY'),
                month: moment(obj.createdAt).format('MM'),
                datas: Array(obj)
            });
            return acc;
        })();
    }, list, []);
}

module.exports = router;
