const path = require('path');
const moment = require('moment');
const shell = require('shelljs');
const _ = require('lodash');
const defaultPath = path.join(__dirname, '../image/')

const FileModule = (function () {
	const saveDir = `${defaultPath}${moment().tz('Asia/Seoul').format('YYYYMMDD')}/`;
	const rollback = async function (files) {
		return await go(files,
			map(f => `${saveDir}${f}`),
			arr => shell.rm(arr)
		)
	};
	return {
		createDir: async function () {
	    return await shell.cat(saveDir).stdout.length > 0 ? saveDir
				: (dir => {
						shell.mkdir('-p', dir); return dir
					})(saveDir);
	  },
	  write: async function (files) {
			const fileNames = _.map(files, v => v.name)
			return await go(
				files,
				each(f => f.mv(`${saveDir}${f.name}`,
						err => !!err ? rollback(fileNames) : false)
				),
				_ => (_ === files && !!files) ? true : false
			)
	  }
	}
})();

module.exports = FileModule;
