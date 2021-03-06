const ioRedis = require('ioredis');
const _ = require('lodash');
const util = require('util');
const moment = require('moment-timezone');

const config = require('../config');

const RedisModule = (function () {
  const redis = new ioRedis(
  {
      port: config.redis.redisPort,
      host: config.redis.redisHost,
      password: config.redis.redisPassword,
      db: 0,
      retryStrategy: function (times) {
          const delay = Math.min(times * 2, 2000);
          console.log(util.format('[Logger]::[Redis(tokenDB)]::[Service]::[%s]::[Retried...]',
                                    moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')));
          return delay;
      }
  });
  const authorization = new ioRedis(
    {
        port: config.redis.redisPort,
        host: config.redis.redisHost,
        password: config.redis.redisPassword,
        db: 2,
        retryStrategy: function (times) {
            const delay = Math.min(times * 2, 2000);
            console.log(util.format('[Logger]::[Redis(AuthorizationDB)]::[Service]::[%s]::[Retried...]',
                                      moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')));
            return delay;
        }
    });
  return {
    getAuth: async key => await authorization.get(key).then(v => JSON.parse(v)).catch(e => e.message),
    setAuth: async (key, value) => await authorization.set(key, JSON.stringify(value), 'ex', 3600).catch(e => e.message),
    delAuth: async key => await authorization.del(key).then(v => JSON.parse(v)).catch(e => e.message),
    getValue: async (key) => await redis.get(key).then(v => JSON.parse(v)).catch(e => e.message),
    setValue: async (key, value) => await redis.set(key, JSON.stringify(value)).catch(e => e.message),
    updateValue: async (key, valueObj = { key: shared, value: 1 }) => {
      try {
        return go(
          key,
          RedisModule.getValue,
          originObj => {
            originObj[valueObj.key] = valueObj.value;
            return originObj;
          },
          updateObj => RedisModule.setValue(key, updateObj),
          result => result
        );
      } catch (error) {
        throw error;
      }
    },
    setFirstAuth: async (key, value) => {
      const auth = {
        auth: true,
        status: true,
        shareFlag: true,
        key: value
      }
      return await redis.set(key, JSON.stringify(auth)).then(_ => key).catch(e => e.message);
    },
    setDefaultKey: async function (key) {
      const value = {
        auth: false
      };
      return await redis.set(key, JSON.stringify(value)).then(_ => key);
    },
    getStampPosition: function (key) {
      return go(
        key,
        key => RedisModule.getValue(key),
        result => result.stamp
      );
    },
    updateSession: curry(function (key, stamp, todayIndex, mapper) {
      return go(
          key,
          key => RedisModule.getValue(key),
          result => {
            result.stamp
            ? result.stamp.push(stamp)
            : (() => {
              result.stamp = [];
              result.stamp.push(stamp);
            })();

            result.diaryToStampMapper
            ? (() => {
              result.diaryToStampMapper[mapper] = stamp;
            })()
            : (() => {
              result.diaryToStampMapper = {};
              result.diaryToStampMapper[mapper] = stamp;
            })();

            result.todayIndex = todayIndex;
            return result;
          },
          obj => RedisModule.setValue(key, obj)
        );
      }
    ),
    deleteStampAndMapper: curry(function (key, target) {
      try {
        return go(
          key,
          RedisModule.getValue,
          obj => {
            target instanceof Array
            ? (() => {
              each(targetItem => {
                if (!obj.stamp && !obj.diaryToStampMapper) {
                  obj = false;
                  return;
                }
                obj.stamp.splice(obj.stamp.findIndex(item => item === obj.diaryToStampMapper[targetItem]), 1);
                delete obj.diaryToStampMapper[targetItem];
                obj.todayIndex = obj.todayIndex - 1;
              }, target)
            })()
            : (() => {
              if (!obj.stamp && !obj.diaryToStampMapper) {
                obj = false;
                return;
              }
              obj.stamp.splice(obj.stamp.findIndex(item => item === obj.diaryToStampMapper[target]), 1);
              delete obj.diaryToStampMapper[target];
              obj.todayIndex = obj.todayIndex - 1;
            })();
            return obj;
          },
          result => !result ? 'invalid token' : RedisModule.setValue(key, result)
        );
      } catch (error) {
        throw error;
      }
    }),
    stream: redis.scanStream({ count: 10 })
  }
})();

module.exports = RedisModule;
