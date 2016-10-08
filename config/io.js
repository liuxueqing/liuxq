/**
 * Created by Liuwei on 2016/9/21.
 */
require("./cache");

var name = "who",
    pass = "xxxx";


module.exports = function (io) {
    //io.on('connection', function (socket) {
    //    setInterval(update, 5000);
    //    function update() {
    //        socket.emit('data', sendData()); //要反复执行的是emit
    //    }
    //});
    //
    //function sendData() {
    //    return GLOBAL_CACHE
    //}
    io.on('connection', function (socket) {
        //对请求连接进行登陆验证
        socket.emit("login");
        socket.on("userLogin", function (data) {
            //获得客户端发来的验证账号、密码
            if (data.name == name && data.pass == pass) {
                //console.log("验证通过");

                socket.on("getData", function (deviceIDArry) {
                    //客户端传的 设备 ID   数组
                    //console.log(deviceIDArry);
                    sendData(socket, deviceIDArry.siteNumArry);
                });

            } else {
                console.log("验证失败");
                socket.disconnect();
            }
        });
    });

};

function sendData(socket, deviceIDArry) {

    update();//连接成功即发送

    setInterval(update, 5000);//间隔5s 发送
    function update() {
        socket.emit('data', send(deviceIDArry)); //要反复执行的是emit
    }


    function send(deviceIDArry) {
        return (function () {
            var len = deviceIDArry.length;
            var dataTemp = {};
            if(len > 0) {
                for(var i = 0;i<len;i++) {
                    dataTemp[deviceIDArry[i]]= JSON.parse(GLOBAL_CACHE.get(deviceIDArry[i]));
                    if(i == len -1) {
                        return dataTemp
                    }
                }
            }
        })()
    }
}