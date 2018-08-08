const { diary } = require('../entity');

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
        return await diary.findOne(options);
    },
    findAll: async function(options) {
        return await diary.findAll(options);
    }
  }
})();

module.exports = diaryModel;
