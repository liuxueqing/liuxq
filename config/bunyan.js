/* ********************************************** 日志模块 **************************************************** */

/**
 * 加载模块，并初始化模块
 */

var bunyan= require('bunyan');

//登陆日志
var loginLog = bunyan.createLogger({
    name: '登陆日志',
    streams: [{
        path: 'logs/login.log'
        // `type: 'file'` is implied
    }]
});

//操作日志
var operationLog = bunyan.createLogger({
    name: '操作日志',
    streams: [{
        path: 'logs/operation.log'
        // `type: 'file'` is implied
    }]
});


exports.loginLog = loginLog;
exports.operationLog = operationLog;