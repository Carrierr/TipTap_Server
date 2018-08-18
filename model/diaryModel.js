const { diary } = require('../entity');
const moment = require('moment');

const diaryModel = (function () {
  return {
    create: async function(data) {
        return await diary.create(data);
    },
    update: async function(options) {
        const { data, where } = options;
        return await diary.update(data, {
            where: where
        });
    },
    findOne: async function(options) {
        options.attributes = ['token'];
        return await diary.findOne(options);
    },
    findDeleteTarget: async function(options) {
        options.attributes = ['imagePath'];
        return await diary.findOne(options);
    },
    findAll: async function(options) {
        return await diary.findAll(options);
    },
    findToday: async function(options) {
        options.where.createdAt = {
          $gte: `${moment().tz('Asia/Seoul').format('YYYY-MM-DD')} 00:00:00`
        }
        return await diary.findAll(options);
    },
    delete: async function(options) {
        log(options)
        return await diary.destroy(options);
    }
  }
})();

module.exports = diaryModel;
