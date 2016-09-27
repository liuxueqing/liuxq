/**
 * Created by Liuwei on 2016/9/19.
 */
var net = require('net');
var moment = require('moment');
var config = require("./config");
var cache = require("./cache");


var HOST = config.tcpSocket.HOST;
var PORT = config.tcpSocket.PORT;


var nodeServer = new net.Socket();

var splicingDataCacheObj = {}; //拼接数据缓存
var Cmoment = null;//用来给处理程序传递时间戳标记
var countNum = null;//处理完的可用数据计数器

nodeServer.connect(PORT, HOST, function () {

    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
    // 建立连接后立即向服务器发送数据，服务器将收到这些数据
    nodeServer.write('0028{"login":"who","pwd":"xxxx"}');   // server login

});

// 为客户端添加"data"事件处理函数
// dataPackage是服务器发回的数据 , 1包！
nodeServer.on('data', function (dataPackage) {

    //此处接受到一包包的字符串数据
    //console.log(dataPackage.toString());

    //这里对收到每一个片段包的数据进行处理
    try {
        splicingDataPackage(dataPackage.toString());
    } catch (err) {
        console.log("处理程序异常 ：");
        console.log(err);
        console.log(dataPackage);
    }

    //// 完全关闭连接
    //nodeServer.destroy();
});

// 一定时间没收到数据则断开连接!
var waitTime = 15; //min
var retry = null;//重试定时器
var timer = 5; //sec

//设置超时时间
nodeServer.setTimeout(1000 * 60 * waitTime, function () {
    console.log('客户端在' + waitTime + 'min内未通信，将断开连接...');
});
//监听到超时事件，断开连接
nodeServer.on('timeout', function () {
    nodeServer.destroy();
});

// 为客户端添加"close"事件处理函数
nodeServer.on('close', function (had_error) {
    console.log('Connection closed' + had_error);

    // 完全关闭连接
    nodeServer.destroy();

    if (!retry) {
        retry = setInterval(function () {
            reconnectToTcpSocketServer();
        }, timer * 1000)
    }

});

// 当 socket 另一端发送 FIN 包时，触发该事件。
nodeServer.on('end', function () {
    console.log('断开与服务器的连接');

    // 完全关闭连接
    nodeServer.destroy();

    if (!retry) {
        retry = setInterval(function () {
            reconnectToTcpSocketServer();
        }, timer * 1000)
    }
});

// 捕捉客户端的异常
nodeServer.on('error', function (e) {
    console.log(e);
});

/* ********************************************** function **************************************************** */

//tcp socket 断线重连
function reconnectToTcpSocketServer() {

    nodeServer.connect(PORT, HOST, function () {

        clearInterval(retry);

        console.log('RE-CONNECTED TO: ' + HOST + ':' + PORT);

        // 建立连接后立即向服务器发送数据，服务器将收到这些数据
        nodeServer.write('0028{"login":"who","pwd":"xxxx"}');   // server login

    });

}

//数据拼接程序
function splicingDataPackage(dataPackageStr) {


//一包数据，包含起始符与结束符， 那可以确定这是一包完整数据!

//探测到起始位， 那可以确定这是第一包数据!
    if (isStartPackage(dataPackageStr)) {

        //探测到结束位, 判断是否为一包完整数据
        if (isEndPackage(dataPackageStr)) {

            //console.log("这是一包完整数据!");

            Cmoment = +new Date(); //每一包完整数据， 重置时间戳标记!
            splicingDataCacheObj[Cmoment] = {}; //设置为对象
            splicingDataCacheObj[Cmoment].value = dataPackageStr;

            var result1 = splicingDataCacheObj[Cmoment].value;  //合并后的最终数据！

            //这里对拼接的数据做长度检测， 验证通过， 送入缓存模块， 验证失败抛弃数据
            testDataLength(result1);

        } else {

            //console.log("这是第一包数据!");

            Cmoment = +new Date(); //每一包新数据， 重置时间戳标记!
            splicingDataCacheObj[Cmoment] = {}; //设置为对象
            splicingDataCacheObj[Cmoment]._length = dataPackageStr.match(/^\[(START)\d{4}\]/)[0].match(/\d{4}/)[0];     //设置数字长度
            splicingDataCacheObj[Cmoment].value = dataPackageStr;
        }
    }
    //一包数据只包含结束位， 那可以确定这是最后一包数据
    else if (isEndPackage(dataPackageStr)) {

        //console.log("这是最后一包数据!");

        splicingDataCacheObj[Cmoment].value += dataPackageStr;

        var result2 = splicingDataCacheObj[Cmoment].value;  //合并后的最终数据！
        //删除该处理程序分支 - 释放内存空间
        delete splicingDataCacheObj[Cmoment];

        //这里对拼接的数据做长度检测， 验证通过， 送入缓存模块， 验证失败抛弃数据
        testDataLength(result2);

    } else {
        //console.log("这是中间的数据包!!");

        try {
//判断该时间戳下的初始处理程序是否存在， 如果存在说明处理正常， 将中间数据包拼接进处理程序， 如不存在， 则代表丢失带[STARTxxxx]的起始包， 则丢弃该数据包!

            if (splicingDataCacheObj[Cmoment]) {
                splicingDataCacheObj[Cmoment].value += dataPackageStr;
            }
        } catch (err) {
            //丢弃该包数据， 即对该数据包不做任何处理
            console.log("在一包完整数据化， 未收到带[STARTxxxx]起始位的数据包！ 该包数据丢弃：");
            console.log(dataPackageStr)
        }
    }


    //正则判断一个数据包是否为第一包
    function isStartPackage(dataPackage) {
        var Reg = /^\[(START)\d{4}\]/;
        return Reg.test(dataPackage);
    }

    //正则判断一个数据包是否为最后一包
    function isEndPackage(dataPackage) {
        var Reg = /\[END\]$/;
        return Reg.test(dataPackage);
    }

    //校验数据长度， 验证通过送入缓存模块， 验证失败丢弃数据

    function testDataLength(result) {

        if (result._length = result.length) {
            //console.log("数据长度与预设长度相同， 保留数据， next!")


            //判断是否为心跳包
            if (isKeeyAlive(result)) {
                //console.log("这是心跳包!");

                //收到心跳包， 就立即回送一包心跳包;
                sendAResponsePackage();

            } else {
                //console.log("共计收到： " + countNum + " 条完整的socket数据");

                addToCache(result);
            }

        } else {
            console.log("数据设置长度 " + result._length + " 与拼接后的实际长度 " + result.length + " 不符， 该条数据丢弃！");
            console.log(result);
        }

        //接收到心跳包， 则回送响应包
        function sendAResponsePackage() {
            //nodeServer.write('[START0020]{"keepAlive":"true"}[END]');   // server login
        }

        //判断拼接后的数据是否为心跳包！
        function isKeeyAlive(result) {
            var Reg = /^\[START0020\]\{"keepAlive":"\w*"}\[END\]/;
            return Reg.test(result);
        }

        //将模块处理后的最终数据 送入缓存模块！
        function addToCache(result) {
            //去掉标识位置， 获得最终数据！
            var _finalResult = result.replace(/^\[(START)\d{4}\]/, "").replace(/\[END\]$/, "");
            var deviceID = _finalResult.match(/"deviceID" : \"(\w{35})\"/)[0].replace(/^"deviceID" : \"/, "").replace('"', "");   //设备ID 35位
            var expire = 1000 * 60 * 5; //5分钟没数据 即清空缓存， 页面可以直观得到显示！

            //此处为写入缓存模块代码
            cache.set(deviceID, _finalResult, expire);
            countNum++; //接收计数器+1
            //console.log(countNum);
        }
    }
}