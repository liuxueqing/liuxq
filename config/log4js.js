var log4js = require('log4js');
log4js.configure({
    appenders: [
        {   //控制台输出debug
            type: 'console',
            category: "console"
        },
        {   //系统错误日志
            "type": "logLevelFilter",
            category: "errors",
            "level": "ERROR",
            "appender": {
                "type": "file",
                "filename": "logs/errors.log"
            }
        }
    ],
    replaceConsole: true
});

var console = log4js.getLogger('console');
var errors = log4js.getLogger('errors');


exports.use = function (app) {
    //页面请求日志,用auto的话,默认级别是WARN  
    //app.use(log4js.connectLogger(dateFileLog, {level:'auto', format:':method :url'}));
    app.use(log4js.connectLogger(console, {level: 'debug', format: ':method :url'}));
    app.use(log4js.connectLogger(errors, {level: 'auto', format: ':method :url'}));
};