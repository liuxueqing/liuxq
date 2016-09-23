///**
// * Created by Liuwei on 2016/9/19.
// */
//var net = require('net');
//var moment = require('moment');
//moment.locale('zh-cn');
//
//var HOST = '123.57.215.156';
//var PORT = 8904;
//
//
//var client = new net.Socket();
//client.connect(PORT, HOST, function () {
//
//    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
//    // 建立连接后立即向服务器发送数据，服务器将收到这些数据
//    client.write('0028{"login":"who","pwd":"xxxx"}');
//
//});
//
//// 为客户端添加“data”事件处理函数
//// data是服务器发回的数据
//client.on('data', function (data) {
//    console.log(data.toString());
//    //// 完全关闭连接
//    //client.destroy();
//});
//
//// 为客户端添加“close”事件处理函数
//client.on('close', function (had_error ) {
//    console.log('Connection closed' + had_error );
//});
//
//// 当 socket 另一端发送 FIN 包时，触发该事件。
//client.on('end', function() {
//    console.log('断开与服务器的连接');
//});
//
//// 捕捉客户端的异常
//client.on('error', function(e) {
//    console.log(e);
//});