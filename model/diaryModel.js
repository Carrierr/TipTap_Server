const { diary } = require('../entity');
const moment = require('moment');
const sequelize = require('sequelize');

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
        options.order = [['id', 'DESC']];
        return await diary.findAll(options);
    },
    findToday: async function(options) {
        options.where.createdAt = {
          $gte: `${moment().tz('Asia/Seoul').format('YYYY-MM-DD')} 00:00:00`
        }
        return await diary.findAll(options);
    },
    delete: async function(options) {
        return await diary.destroy(options);
    },
    count: async function(options) {
        return diary.count(options);
    },
    getRandomDiaryOne: async (options) => {
        options.order = [sequelize.fn('RAND')];
        options.attributes = ['user_id', 'createdAt'];
        return await diary.findAll(options);
    }
  }
})();

module.exports = diaryModel;