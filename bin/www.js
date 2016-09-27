/**
 * Created by Liuwei on 2016/7/28.
 */
var server = require('../server');
var config = require('../config/config');
var io = require('../config/io')(require('socket.io')(server));
var cache = require("../config/cache");

//监听端口创建服务器
server.listen(config.port, function () {
    console.log("server is listen on " + config.port);
});