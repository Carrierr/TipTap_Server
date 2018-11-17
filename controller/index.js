const authController = require('../controller/authController');
const fileController = require('../controller/fileController');
const accountController = require('../controller/accountController');
const diaryController = require('../controller/diaryController');
const blameController = require('../controller/blameController');

module.exports = {
  authCtrl: authController,
  fileCtrl: fileController,
  accountCtrl: accountController,
  diaryCtrl: diaryController,
  blameCtrl: blameController
}
