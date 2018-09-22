const axios = require('axios');
const url = 'http://ec2-13-209-117-190.ap-northeast-2.compute.amazonaws.com:8080/diary/today';
require('../utils/functional');

axios.defaults.headers.common['tiptap-token'] = '83ac46da-31b1-4aaf-8a87-cf3b07928db8';
axios.get(url)
.then(result => each(val => log(val), result.data.data.list))
.catch(e => log(e));
