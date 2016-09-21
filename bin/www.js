/**
 * Created by Liuwei on 2016/7/28.
 */
var server = require('../server');
var config =  require('../config/config');
var net = require('net');
var io = require('socket.io')(server);  //socket.io

//监听端口创建服务器
server.listen(config.port, function() {
    console.log("server is listen on " + config.port);
});

//
////创建连接到数据连接池
//var HOST = '192.168.1.231';
//var PORT = 8904;
//
//var client = net.connect({
//    host: HOST,
//    port: PORT
//},function(){ // connect监听器
//    console.log("客户端已连接") ;
//});
//client.on("data", function(data) {
//    console.log(data.toString()) ;
//    client.end() ;
//});
//client.on("end", function(){
//    console.log("客户端断开连接") ;
//}) ;
//
//
//
////创建websocket，向客户端推送实时数据
//io.on('connection', function(socket){
//    setInterval(update, 250);
//    function update(){
//        socket.emit('random', randomNum()); //要反复执行的是emit
//    }
//});
//
//function randomNum(){
//    return Math.floor((Math.random() * 100) + 1);
//}