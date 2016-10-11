var log4js = require('log4js');
log4js.configure({
    appenders: [
        {   //控制台输出debug
            type: 'console',
            category: "console"
        },
        {
            type: 'file', //文件输出
            filename: 'logs/errors.log',
            maxLogSize: 1024,
            backups: 3,
            category: 'errors'
        }
    ],
    replaceConsole: true
});

var errors = log4js.getLogger('errors');


exports.use = function (app) {
    //页面请求日志,用auto的话,默认级别是WARN
    app.use(log4js.connectLogger(console, {level: 'debug', format: ':method :url'}));
    app.use(log4js.connectLogger(errors, {level: 'ERROR', format: ':method :url'}));
};