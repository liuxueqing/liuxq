/**
 * Created by Liuwei on 2016/4/11.
 */

var getDataInterval = setInterval(getData, 200);    //每200ms取一次数据

var data_L = 0;//初始默认设置数据-左声道

var data_R = 0;//初始默认设置数据-右声道

var Dots = [];//保存cap位置信息

var isPlay = "off";

function  getData() {
    var data = [];
    //取0-100的随机整数
    var randomNumL = 100 * Math.random(),
        randomNumR = 100 * Math.random();
    data_L = Math.floor(randomNumL);
    data_R = Math.floor(randomNumR);
    
    data.push(data_L);
    data.push(data_R);

    draw(data);
    isPlay = "on";
}


//meter动画
var meter = $("#meter")[0];
var width,height;
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
meter.appendChild(canvas);

//窗口改变重新计算宽度高度
function resize () {
    width = meter.clientWidth;
    height = meter.clientHeight;
    canvas.width = width;
    canvas.height = height;
    console.log(height);
    //渐变色
    var line = ctx.createLinearGradient(0, 0, 0, height);
    line.addColorStop(0, "red");
    line.addColorStop(0.5, "yellow");
    line.addColorStop(1, "green");
    ctx.fillStyle = line;

}
resize();
window.onresize = function() {
    resize();
};


function getDots(){
    for(var i = 0;i < 2; i++){
        Dots.push({
            cap: 0
        });
    }
}


function draw(arr) {
    getDots();
    ctx.clearRect(0,0, width, height);
    var w = 30;
    var cw = w * 0.6;
    var capH = cw / 2;


    for(var i=0; i < arr.length; i++){
        var o = Dots[i];
        var h = arr[i] * 6;
        if (o.cap < 0){
            o.cap = 0;
        }
        if(h > 0 && o.cap < h + 40) {

            o.cap = h + 40;

        }
        if(h > 540){
            o.cap = 589;
        }
        ctx.fillRect(w * i, height - h, cw, h);//rect
        ctx.fillRect(w * i, height-(o.cap + capH), cw, capH);//dots
        --o.cap;

    }

}

$("#pause").click(function() {
    clearInterval(getDataInterval);
    isPlay = "off";
});
$("#play").click(function() {
    if(isPlay == "off") {
        getDataInterval = setInterval(getData, 200);
    }
});