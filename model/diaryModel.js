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
    findDeleteTarget: async function(options) {
        options.attributes = ['imagePath'];
        return await diary.findOne(options);
    },
    findAll: async function(options) {
        return await diary.findAll(options);
    },
    delete: async function(options) {
        log(options)
        return await diary.destroy(options);
    }
  }
})();

module.exports = diaryModel;
