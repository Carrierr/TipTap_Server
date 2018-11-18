const csurf = require('csurf');
const util = require('util');
const moment = require('moment');
const csrfProtection = new csurf({ cookie: true });
const config = require('../config');
const { authCtrl, fileCtrl, diaryCtrl, accountCtrl, blameCtrl } = require('../controller');
const { respondOnError } = require('../utils/respond');
const resultCode = require('../utils/resultCode');
const { getValue } = require('./redisModule');
const { getUrl } = require('../utils/common');

const RoutesModule = (function (){
  return {
    Init: function () {
      app.disable('x-powered-by');
      // app.use(csrfProtection); 차후 고려
      app.use(async (req, res, next) => {
          const status = await go(
              req.headers['tiptap-token'],
              getValue,
              result => !!result ? result.status : true,
              // TODO 런칭 직전에 바꿔야 함 false로
          );

          if (!status && getUrl(req.originalUrl) !== '/auth/login') {
              return respondOnError(res, resultCode.error, { desc: 'Access Denine' });
          };

          res.header('Access-Control-Allow-Origin', config.server.accept_domain);
          res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          console.log(util.format('[Logger]::[Route]::[Access URL %s]::[Access Ip %s]::[Access Time %s]',
                                      req.originalUrl,
                                      req.ip,
                                      moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
                                  ));
          next();
      });

      app.use('/blame', blameCtrl);
      app.use('/auth', authCtrl);
      app.use('/diary', diaryCtrl);
      app.use('/account', accountCtrl);
      app.use('/file', fileCtrl);
      console.log(util.format('[Logger]::[Route]::[Service]::[%s]::[Started]',
                                moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')));
    }
  }
})();

module.exports = RoutesModule;
