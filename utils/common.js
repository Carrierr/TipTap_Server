const ripemd160 = require("crypto-js/ripemd160");
const crypto = require("crypto-js");
const _ = require('lodash');
const config = require('../config');
const iv = crypto.enc.Base64.parse('tiptap-iv');
const auth_key = crypto.enc.Base64.parse(config.server.auth_key);

const Common = (function (){

  const stamps = [
    'stamp1',
    'stamp2',
    'stamp3',
    'stamp4',
    'stamp5',
    'stamp6',
    'stamp7',
    'stamp8',
    'stamp9',
    'stamp10',
    'stamp11',
    'stamp12',
    'stamp13'
  ];

  return {
    encrypt: function (content) {
      return crypto.AES.encrypt(content, auth_key, {iv: iv}).toString();
    },
    decrypt: function (content) {
      return go(
        content,
        content => crypto.AES.decrypt(content.toString(), auth_key, {iv: iv}),
        bytes => bytes.toString(crypto.enc.Utf8)
      );
    },
    hash: function (content) {
      return ripemd160(content).toString();
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
    parameterFormCheck: curry((param, form) => (Object.keys(form).length === 0) ? true : isMatch(Object.keys(param), Object.keys(form))),
    getUrl: (originalUrl) => first(originalUrl.split('?')),
    getRemainStamp: (current) => go(
      stamps,
      reject(a => current.includes(a) ? a : undefined)
    ),
    getRandomStamp: (arr) => go(
      arr.length - 1,
      len => Math.floor(Math.random() * (len + 1)),
      index => arr[index]
    )
  }
})();

module.exports = Common;
