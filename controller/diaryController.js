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
      const { content, location, latitude, longitude, city = '' } = req.body;
      const data = {
          content: content,
          location: location,
          city: city || location.split(" ")[0],
          latitude: latitude,
          longitude: longitude
      };
      let diaryToStampMapperIndex;

      const { key, stamp = [], todayIndex = 0, shareFlag = false } = await go(
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
      data.shared = shareFlag;

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
      respondJson(res, resultCode.success, { list : result })
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

      let { page = 1, limit = 1000, totalPage = 0 } = req.query;

      page = parseInt(page);
      limit = parseInt(limit);

      const tableRange = curry((result, key) => {
          const cnt = result.length;
          totalPage = Math.ceil(cnt / limit);
          const beginIndex = (page - 1) * limit;
          const endIndex = beginIndex + limit - 1;
          const options = {};
          options.order = [['id', 'DESC']];
          options.where = { createdAt: { lt: moment(result[beginIndex]).add(1, 'month'), gte: result[endIndex] || '2000-01-01' }, user_id: key };
          return options;
      });

      go(
          null,
          _ => diaryModel.findDataRangeResource(key),
          tableRange,
          f => f(key),
          options => diaryModel.findAll(options).catch(e => respondOnError(res, resultCode.error, e.message)),
          result => respondJson(res, resultCode.success, { list: go(
            result,
            monthlyConvert
          ), total: totalPage, stamp: stamp })
      );
    } catch (error) {
      respondOnError(res, resultCode.error, error.message);
    }
});

router.get('/list/by/date', async (req, res) => {
  try {
    const { key, stamp = [] } = await go(
      req.headers['tiptap-token'],
      getValue,
      obj => obj
      ? obj
      : respondOnError(res, resultCode.error, { desc: 'unknown token' })
    );

    let { startDate = '2000-01-01', endDate = moment().add(1, 'days').format('YYYY-MM-DD') } = req.query;

    const options = {
      where : {
        user_id: key,
        createdAt: {
          gte: startDate,
          lt: moment(endDate).add(1, 'days').format('YYYY-MM-DD')
        }
      }
    };

    go(
        null,
        _ => diaryModel.findAll(options).catch(e => respondOnError(res, resultCode.error, e.message)),
        result => respondJson(res, resultCode.success, { list: go(
          result,
          monthlyConvert
        ), stamp: stamp })
    );
  } catch (error) {
    respondOnError(res, resultCode.error, error.message);
  }
});

router.get('/random', async (req, res) => {
  /**
   * @description TODO 런칭 전 로직 제대로 확인 한번 할 것!
   */
    try {
      let { key, readed = [], block = [] } = await go(
        req.headers['tiptap-token'],
        getValue,
        obj => obj
        ? obj
        : respondOnError(res, resultCode.error, { desc: 'unknown token' })
      );

      block.push(key);

      const options = {
        where: {
          id: { notIn: readed },
          user_id: { notIn: block },
          shared: 1
        },
        limit: 1
      };

      go(
          options,
          diaryModel.getRandomDiaryOne,
          result => {
            if (result.length === 0) { return respondOnError(res, resultCode.error, 'no more data') };
            const { user_id, createdAt } = result[0].dataValues;
            const options = {
                where: {
                    user_id: user_id,
                    shared: 1,
                    createdAt: {
                        $between: [
                            `${moment(createdAt).format('YYYY-MM-DD')} 00:00:00`,
                            `${moment(createdAt).add(1, 'days').format('YYYY-MM-DD')} 00:00:00`
                        ]
                    }
                },
                limit: 10 // 런칭전 삭제?
            };
            return options;
          },
          diaryModel.findSomeOneDiary,
          data => {
              return go(
                  null,
                  _ => updateValue(req.headers['tiptap-token'], { key: 'readed' ,value: readed.concat(map(ele => ele.dataValues.id, data)) })
                  .catch(error => { throw error }),
                  _ => data,
                  result => go(
                    result,
                    /** @TODO
                     * 클라이언트 업데이트 후 location 초기화 로직 제거
                     */
                    data => map(item => (item.dataValues.location = '', item.dataValues), data),
                    arr => arr.reverse()
                  )
              );
          },
          result => respondJson(res, resultCode.success, { list: result })
      );
    } catch (error) {
      respondOnError(res, resultCode.error, error.message);
    }
});

router.post('/block', async (req, res) => {
    try {
      const { key = false, block = [] } = await go(
        req.headers['tiptap-token'],
        getValue
      );

      if (!key) throw { message: 'Unknown Token Error' };

      const { user_id } = req.body;
      block.push(user_id);

      go(
        block,
        block => updateValue(req.headers['tiptap-token'], { key: 'block' ,value: block }),
        result => result
        ? respondJson(res, resultCode.success, { desc: 'completed block user' })
        : respondOnError(res, resultCode.error, { desc: 'block fail' })
      );
    } catch (error) {
      return respondOnError(res, resultCode.error, error.message);
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
      const { key = false, shareFlag = false } = await go(
        req.headers['tiptap-token'],
        getValue,
        obj => obj
        ? obj
        : respondOnError(res, resultCode.error, { desc: 'unknown token' })
      );

      const fileName = req.files ? req.files.diaryFile.name : false;
      const { content, location, latitude, longitude, id } = req.body;
      const options = {
          data: {
              content: content,
              location: location,
              latitude: latitude,
              longitude: longitude,
              shared: shareFlag
          },
          where: {
              id: id,
              user_id : key
          }
      };

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
          null,
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
          result => result === 'invalid token' ?
          respondOnError(res, resultCode.error, { desc: result })
          : diaryModel.delete(options).catch(e => respondOnError(res, resultCode.error, e.message)),
          _ => respondJson(res, resultCode.success, { desc: 'completed delete diary' })
      );
    } catch (error) {
      respondOnError(res, resultCode.error, error.message);
    }
});

router.post('/delete/day', async (req, res) => {
    try {
      const { key } = await go(
        req.headers['tiptap-token'],
        getValue,
        obj => obj
        ? obj
        : respondOnError(res, resultCode.error, { desc: 'unknown token' })
      );
      let { date } = req.body;
      const options = {
          where: {
              user_id: key
          }
      };

      date instanceof Array ? (() => {
          options.where.createdAt = map(val => `createdAt >= '${moment(val).format('YYYY-MM-DD')}' and createdAt < '${moment(val).add(1, 'days').format('YYYY-MM-DD')}'`, date)
      })() : (() => {
          options.where.createdAt = { gte: moment(date).format('YYYY-MM-DD'), lt: moment(date).add(1, 'days').format('YYYY-MM-DD') };
          date = moment(date).format('YYYY-MM-DD');
      })();

      date instanceof Array ?
      go(
        options.where.createdAt,
        arr => diaryModel.deleteArray(arr, key),
        result => result ? go(
              date,
              dates => find(date => moment(date).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD'), dates),
              result => result ? go(
                req.headers['tiptap-token'],
                getValue,
                obj => {
                  delete obj.diaryToStampMapper;
                  delete obj.stamp;
                  delete obj.todayIndex;
                  return obj;
                },
                resetObj => setValue(req.headers['tiptap-token'], resetObj)
              ) : undefined
            ) : respondOnError(res, resultCode.error, { desc: result }),
        _ => respondJson(res, resultCode.success, { desc: 'completed delete diary' })
      )
      : go(
        moment().format('YYYY-MM-DD') === moment(date).format('YYYY-MM-DD'),
        result => result ? go(
          req.headers['tiptap-token'],
          getValue,
          obj => {
            delete obj.diaryToStampMapper;
            delete obj.stamp;
            delete obj.todayIndex;
            return obj;
          },
          resetObj => setValue(req.headers['tiptap-token'], resetObj)
        ) : undefined,
        _ => diaryModel.delete(options).catch(e => respondOnError(res, resultCode.error, e.message)),
        _ => respondJson(res, resultCode.success, { desc: 'completed delete diary' })
      );
    } catch (error) {
      respondOnError(res, resultCode.error, error.message);
    }
});

/**
 * @desc monthlyConvert 함수 초기 버전
 * @return year, month 객체 내 해당 월에 대한 데이터를 모두 응답

function monthlyConvert (arg) {
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
*/

function monthlyConvert (arg) {
    const list = map(obj => obj.dataValues, arg);
    return reduce((acc, obj) => {
        return acc.length > 0 ?
        go(
            null,
            _ => find(val => val.year === moment(obj.createdAt).format('YYYY') && val.month === moment(obj.createdAt).format('MM'), acc),
            result => {
                !result ? acc.push({
                      year: moment(obj.createdAt).format('YYYY'),
                      month: moment(obj.createdAt).format('MM'),
                      datas: Array(Object.assign(((obj) => {
                          const dayObj = {
                            day: moment(obj.createdAt).format('DD'),
                            dataCount: 1,
                            diaryDatas: {
                              lastDiary: obj
                            }
                          };
                          return dayObj;
                      })(obj), {}))
                  })
                : (() => {
                  const idx = acc.findIndex(item => item.year === result.year && item.month === result.month);
                  const dayIndex = acc[idx].datas.findIndex(item => item.day === moment(obj.createdAt).format('DD'));
                  dayIndex > -1 ? (() => {
                      acc[idx].datas[dayIndex].diaryDatas.firstDiary = obj;
                      acc[idx].datas[dayIndex].dataCount = acc[idx].datas[dayIndex].dataCount + 1;
                  })()
                  : ((obj) => {
                    const dayObj = {
                      day: moment(obj.createdAt).format('DD'),
                      dataCount: 1,
                      diaryDatas: {
                        lastDiary: obj
                      }
                    };
                    acc[idx].datas.push(dayObj);
                  })(obj)
                })();
                return acc;
            }
        )
        : (() => {
            acc.push({
                year: moment(obj.createdAt).format('YYYY'),
                month: moment(obj.createdAt).format('MM'),
                datas: Array(Object.assign(((obj) => {
                    const dayObj = {
                      day: moment(obj.createdAt).format('DD'),
                      dataCount: 1,
                      diaryDatas: {
                        lastDiary: obj
                      }
                    };
                    return dayObj;
                })(obj), {}))
            });
            return acc;
        })();
    }, list, []);
}

module.exports = router;
