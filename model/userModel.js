const config = require('../config');
const { user } = require('../entity');

const userModel = (function () {
  return {
    create: async function(data) {
      return await user.create(data);
    }
  }
})();

module.exports = userModel;
