require('../utils/functional');
const { stream, getValue, setValue } = require('../modules/redisModule');

stream.on('data', (keys, err) => {
  stream.pause();
  go(
    null,
    _ => map(key => go(
          key,
          getValue,
          obj => obj.stamp
            ? (() => { delete obj.stamp; return obj; })()
            : obj,
          resetObj => setValue(key, resetObj)
        ), keys),
    _ => stream.resume()
  );
});

stream.on('end', () => setTimeout(() => process.exit(1), 10000));
