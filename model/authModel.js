const config = require('../config');
const { version, auth } = require('../entity');

const authModel = (function () {
  return {
    versionCheck: async function (options) {
      return await version.findOne(options);
    }
  }
})();

module.exports = authModel;
