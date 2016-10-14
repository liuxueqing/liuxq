/**
 * Created by Liuwei on 2016/9/21.
 */
require("./cache");

var name = "who",
    pass = "xxxx";
var timer = null;
var t = 30 * 1000;

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
                    console.log(deviceIDArry);
                    update();
                    clearInterval(timer);
                    timer = setInterval(update, t);//间隔5s 发送
                    function update() {
                        socket.emit('data', send(deviceIDArry.siteNumArry)); //要反复执行的是emit
                    }


                    function send(deviceIDArry) {
                        return (function () {
                            var len = deviceIDArry.length;
                            var dataTemp = {};
                            if (len > 0) {
                                for (var i = 0; i < len; i++) {
                                    dataTemp[deviceIDArry[i]] = JSON.parse(GLOBAL_CACHE.get(deviceIDArry[i]));
                                    if (i == len - 1) {
                                        return dataTemp
                                    }
                                }
                            }
                        })()
                    }
                });

            } else {
                console.log("验证失败");
                socket.disconnect();
            }
        });


        socket.on("set", function (newData) {
            var str = JSON.stringify(newData);
            var len = str.length;

            var dataStrLen = preZeroFill(len + 16, 4);
            console.log(dataStrLen);
            console.log('[START' + dataStrLen + ']' + str + '[END]');
            nodeServer.write('[START' + dataStrLen + ']' + str + '[END]');   // server login


            //补0模块
            function preZeroFill(num, size) {
                if (num >= Math.pow(10, size)) { //如果num本身位数不小于size位
                    return num.toString();
                } else {
                    var _str = Array(size + 1).join('0') + num;
                    return _str.slice(_str.length - size);
                }
            }
        });


        socket.on("levels", function (deviceID) {
            console.log(deviceID);
            socket.emit('levels', getData()); //要反复执行的是emit

            function getData() {
                var data = [];
                //取0-100的随机整数

                var randomNumL = 60 * Math.random(),
                    randomNumR = 60 * Math.random();
                data_L = Math.floor(60 - randomNumL);
                data_R = Math.floor(60 - randomNumR);

                data.push(data_L);
                data.push(data_R);

                return data;
            }
        });
    });

};