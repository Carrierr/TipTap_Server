const crypto = require("crypto");
const _ = require('lodash');
const config = require('../config');

const Common = {
  /* EX) common.Encryption(description, 'aes-256-ctr') */
  encrypt: function (description, algorithm) {
    const cipher = crypto.createCipher(algorithm, config.server.auth_key);
    let encipherContent = cipher.update(description, 'utf8', 'hex');
    encipherContent += cipher.final('hex');
    return encipherContent;
  },
  /* EX) common.Decryption(description, 'aes-256-ctr') */
  decrypt: function (description, algorithm) {
    const decipher = crypto.createDecipher(algorithm, config.server.auth_key);
    let decipherContent = decipher.update(description, 'hex', 'utf8');
    decipherContent += decipher.final('utf8');
    return decipherContent;
  },
  /* EX) common.Hashing(description, 'ripemd160WithRSA') */
  hash: function (description, algorithm) {
    const hash = crypto.createHash(algorithm);
    let hashedContent = hash.update(config.server.auth_key + description);
    hashedContent = hash.digest('hex');
    return hashedContent;
  },
  imagesTypeCheck: function (images) {
    return go(images,
      every(v => ['JPG', 'JPEG', 'PNG', 'jpg', 'jpeg', 'png']
        .includes(
          last(v.name.split('.'))
        )
      )
    ) ? images : false
  },
  parameterFormCheck: (param, form) => Object.keys(form).length === 0 
    ? true
    : isMatch(Object.keys(param), Object.keys(form)),
  getUrl: (originalUrl) => originalUrl.split('?')[0]
};

module.exports = Common;
