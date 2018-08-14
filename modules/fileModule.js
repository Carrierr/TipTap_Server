const path = require('path');
const moment = require('moment');
const shell = require('shelljs');
const _ = require('lodash');
const defaultPath = path.join(__dirname, '../image/');
const saveDir = () => `${defaultPath}${moment().tz('Asia/Seoul').format('YYYYMMDD')}/`;

const FileModule = (function () {
	const rollback = async function (files) {
		return await go(files,
			map(file => `${saveDir()}${file}`),
			arr => shell.rm(arr)
		)
	};
	return {
		createDir: async function () {
			return await shell.cat(saveDir()).stdout.length > 0 ? saveDir()
					: (dir => {
							shell.mkdir('-p', dir);
							return dir;
						})(saveDir());
		},
		writeFile: async function (files) {
			const fileNames = _.map(files, v => v.name);
			return await go(
				files,
				each(f => f.mv(`${saveDir()}${f.name}`,
						err => !!err ? rollback(fileNames) : false)
				),
				_ => (_ === files && !!files) ? true : false
			)
		},
		createSaveFileData: function (original, path, token) {
			return go(
				path,
				a => `${a}${moment().tz('Asia/Seoul').format('YYYYMMDDHHmmssmmm')}`,
				b => `${b}_${last(token.split('-'))}`,
				c => `${c}_${original}`,
				d => {
					return {
						name: last(d.split('/')),
						path: d
					}
				}
			);
		},
		deleteFile: async function (target) {
			return await shell.rm(target);
		}
	}
})();

module.exports = FileModule;
