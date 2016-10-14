/**
 * Created by Liuwei on 2016/4/11.
 */

runMeter("#meter", "EKNKFYTbIh7GDkF6UKnbqxA460Bchz5HHSw");




function runMeter(id, deviceID) {

    socket.emit("levels", deviceID);
    socket.on("levels", function (data) {
        console.log(data);

    });

//    var getDataInterval = setInterval(getData, 200);    //每200ms取一次数据
//
//    var data_L = 0;//初始默认设置数据-左声道
//
//    var data_R = 0;//初始默认设置数据-右声道
//
//    var Dots = [];//保存cap位置信息
//
//    var isPlay = "off";
//
//
////meter动画
//    var meter = $(id)[0];
//    var width, height;
//    var canvas = document.createElement("canvas");
//    var ctx = canvas.getContext("2d");
//    meter.appendChild(canvas);
//
////窗口改变重新计算宽度高度
//    function resize() {
//        width = meter.clientWidth;
//        height = meter.clientHeight;
//        canvas.width = width;
//        canvas.height = height;
//        //渐变色
//        var line = ctx.createLinearGradient(0, 0, 0, height);
//        line.addColorStop(0, "#FF0000");
//        line.addColorStop(0.05, "#FFFF00");
//        line.addColorStop(0.3, "#09FD00");
//        line.addColorStop(1, "#09FD00");
//        ctx.fillStyle = line;
//
//    }
//
//    resize();
//    window.onresize = function () {
//        resize();
//    };
//
//
//    function getDots() {
//        for (var i = 0; i < 2; i++) {
//            Dots.push({
//                cap: 0
//            });
//        }
//    }
//
//
//    function draw(arr) {
//        getDots();
//        ctx.clearRect(0, 0, width, height);
//        var w = 50;
//        var cw = 45;
//        var capH = 9;
//
//
//        for (var i = 0; i < arr.length; i++) {
//            var o = Dots[i];
//            var h = arr[i] * 9;
//            if (o.cap < 0) {
//                o.cap = 0;
//            }
//            if (h > 0 && o.cap < h + 9) {
//
//                o.cap = h + 9;
//
//            }
//            if (h > 535) {
//                o.cap = 545;
//            }
//            ctx.fillRect(w * i, height - h, cw, h);//rect
//            ctx.fillRect(w * i, height - (o.cap + capH), cw, capH);//dots
//            o.cap = o.cap - 9;
//
//        }
//
//    }
//
//    $("#meter_pause_1").click(function () {
//        clearInterval(getDataInterval);
//        ctx.clearRect(0, 0, width, height);
//        isPlay = "off";
//    });
//    $("#meter_play_1").click(function () {
//        if (isPlay == "off") {
//            getDataInterval = setInterval(getData, 200);
//        }
//    });
}