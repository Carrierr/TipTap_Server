const { blame } = require('../entity');

const blameModel = (function () {
  return {
    create: async function(data) {
        return await blame.create(data);
    },
    update: async function(options) {
        const { data, where } = options;
        return await blame.update(data, {
            where: where
        });
    },
    findOne: async function(options) {
        return await blame.findOne(options);
    },
    find: async function(options) {
        return await blame.findAll(options);
    }
  }
})();

module.exports = blameModel;
