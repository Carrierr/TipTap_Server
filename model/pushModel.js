const { push } = require('../entity');

const pushModel = (function () {
  return {
    create: async function(data) {
        return await push.create(data);
    },
    update: async function(options) {
        const { data, where } = options;
        return await push.update(data, {
            where: where
        });
    },
    findOne: async function(options) {
        return await push.findOne(options);
    },
    findAll: async function(options) {
        return await push.findAll(options);
    }
  }
})();

module.exports = pushModel;
