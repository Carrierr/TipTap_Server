const { diary } = require('../entity');
const moment = require('moment');
const sequelize = require('sequelize');
const { query } = require('../modules/dbModule');

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
        options.order = [['id', 'DESC']];
        options.where.createdAt = {
          $gte: moment().format('YYYY-MM-DD')
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
    },
    findDataRangeResource: function (key) {
      return go(
        null,
        _ => `select date_format(createdAt, '%Y-%m-01') as date from diaries where user_id = ${key} group by date_format(createdAt, '%M %Y') order by id desc`,
        queryString => query(queryString),
        rows => map(row => row.date, rows)
      )
    },
    deleteArray: function (arr, key) {
      return go(
        arr,
        dates => map(date =>`delete from diaries where user_id = ${key} and ${date}`, dates),
        queryArr => map(queryString => query(queryString), queryArr)
      )
    }
  }
})();

module.exports = diaryModel;
