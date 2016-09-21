/**
 * Created by Liuwei on 2016/9/8.
 */

$(document).ready(function () {
    $("#map").height($(window).height() - 75 + 'px');
});
$(window).resize(function () {
    $("#map").height($(window).height() - 75 + 'px');
});

(function () {

    var map = new BMap.Map("map", {minZoom: 7, maxZoom: 13});    // 创建Map实例


    /* ********************************************** 百度地图初始化设置 **************************************** */
    /**
     * 地图数据设置
     * 参数说明: 无
     */
    var center = [112.569005, 37.880063];     // 设置中心点坐标
    var Zoom = 8;      // 和地图级别
    var CurrentProvincial = "山西省";     // 设置行政区域
    var enableScrollWheelZoom = true;       //开启鼠标滚轮缩放
    var crStr = "<span class='copyright'>shanxiMap | <a href='#''>© 智和云</a></span>";   //版权信息
    var fillColor = "rgba(226,239,238,0.75)";  // 地图遮罩层填充颜色
    var strokeColor = "#B0C4DE";            // 行政边界颜色
    var strokeWeight = 5;   // 行政边界线段粗细
    var sContent =
        "<h4 style='margin:0 0 5px 0;padding:0.2em 0'>天安门</h4>" +
        "<img style='float:right;margin:4px' id='imgDemo' src='http://app.baidu.com/map/images/tiananmen.jpg' width='139' height='104' title='天安门'/>" +
        "<p style='margin:0;line-height:1.5;font-size:13px;text-indent:2em'>天安门坐落在中国北京市中心,故宫的南侧,与天安门广场隔长安街相望,是清朝皇城的大门...</p>" +
        "</div>";
    var markerCache = new Array();
    /**
     * 后台接口设置
     * 参数说明: 无
     */
    var url = "/api/maps/getAllSiteInfo";

    /* ********************************************** 百度地图启动 ********************************************** */


    var wait = function(){

        var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象

        init(function() {
            return dtd.promise(); // 返回promise对象
        });

    };

    function init(callback) {
        map.clearOverlays();        //清除地图覆盖物
        mapSetting();//添加地图设置信息
        addCtrl();//添加版权信息
        addBoundary(); //添加行政边界和行政边界以外的遮罩层
        callback();
    }

    /* ********************************************** 加载数据 ****************************************************** */


    $.when(wait())

        .done(function(){ loadMapData();})

        .fail(function(){ console.log("地图初始化失败"); });

    /**
     * 功能说明： ajax请求后台数据
     * 参数说明: 无
     * method: POST
     */
    function loadMapData() {
        $.ajax({
            url: url,// 后台接口
            data: {},
            type: 'post',
            dataType: 'json',
            success: function (Data) {
                var len = Data.length;
                //console.log(len)
                for (var i = 0; i < len; i++) {
                    var _data = Data[i];
                    addCovering(_data);     // 根据数据添加地图覆盖物
                }
            },
            error: function () {

            }
        });
    }

    /* ********************************************** 百度地图代码封装 ****************************************** */


    /**
     * 功能说明： 添加地图初始化设置
     * 参数说明: 无
     */
    function mapSetting() {
        map.centerAndZoom(new BMap.Point(center[0], center[1]), Zoom);  // 初始化地图,设置中心点坐标和地图级别
        map.addControl(new BMap.MapTypeControl({
            mapTypes: [BMAP_NORMAL_MAP, BMAP_SATELLITE_MAP]
        }));    //添加右上角地图切换
        map.enableScrollWheelZoom(enableScrollWheelZoom);     //开启鼠标滚轮缩放
    }

    /**
     * 功能说明： 添加地图控件工具、版权信息。
     * 参数说明: 无
     */
    function addCtrl() {
        var cr = new BMap.CopyrightControl({anchor: BMAP_ANCHOR_BOTTOM_RIGHT});   //设置版权控件位置
        map.addControl(cr); //添加版权控件
        var top_left_control = new BMap.ScaleControl({anchor: BMAP_ANCHOR_TOP_LEFT});// 左上角，添加比例尺
        var top_left_navigation = new BMap.NavigationControl();  //左上角，添加默认缩放平移控件
        /*缩放控件type有四种类型:
         BMAP_NAVIGATION_CONTROL_SMALL：仅包含平移和缩放按钮；BMAP_NAVIGATION_CONTROL_PAN:仅包含平移按钮；BMAP_NAVIGATION_CONTROL_ZOOM：仅包含缩放按钮*/
        map.addControl(top_left_control);
        map.addControl(top_left_navigation);

    }

    /**
     * 功能说明： 添加行政边界和行政边界以外的遮罩层
     * 参数说明: 无
     */

    function addBoundary() {
        var bdary = new BMap.Boundary();
        bdary.get(CurrentProvincial, function (rs) {       //获取行政区域

            //添加遮罩层
            //思路：利用行政区划点的集合与外围自定义东南西北形成一个环形遮罩层
            //1.获取选中行政区划边框点的集合  rs.boundaries[0]
            var strs = new Array();
            strs = rs.boundaries[0].split(";");
            //定义点集合存储
            var EN = "";    //行政区划东北段点的集合
            var NW = ""; //行政区划西北段点的集合
            var WS = ""; //行政区划西南段点的集合
            var SE = ""; //行政区划东南段点的集合
            var pt_e = strs[0]; //行政区划最东边点的经纬度
            var pt_n = strs[0]; //行政区划最北边点的经纬度
            var pt_w = strs[0]; //行政区划最西边点的经纬度
            var pt_s = strs[0]; //行政区划最南边点的经纬度
            var n1 = ""; //行政区划最东边点在点集合中的索引位置
            var n2 = ""; //行政区划最北边点在点集合中的索引位置
            var n3 = ""; //行政区划最西边点在点集合中的索引位置
            var n4 = ""; //行政区划最南边点在点集合中的索引位置
            //2.循环行政区划边框点集合找出最东南西北四个点的经纬度以及索引位置
            for (var n = 0; n < strs.length; n++) {
                var pt_e_f = parseFloat(pt_e.split(",")[0]);
                var pt_n_f = parseFloat(pt_n.split(",")[1]);
                var pt_w_f = parseFloat(pt_w.split(",")[0]);
                var pt_s_f = parseFloat(pt_s.split(",")[1]);
                var sPt = new Array();
                try {
                    sPt = strs[n].split(",");
                    var spt_j = parseFloat(sPt[0]);
                    var spt_w = parseFloat(sPt[1]);
                    if (pt_e_f < spt_j) {   //东
                        pt_e = strs[n];
                        pt_e_f = spt_j;
                        n1 = n;
                    }
                    if (pt_n_f < spt_w) {  //北
                        pt_n_f = spt_w;
                        pt_n = strs[n];
                        n2 = n;
                    }
                    if (pt_w_f > spt_j) {   //西
                        pt_w_f = spt_j;
                        pt_w = strs[n];
                        n3 = n;
                    }
                    if (pt_s_f > spt_w) {   //南
                        pt_s_f = spt_w;
                        pt_s = strs[n];
                        n4 = n;
                    }
                }
                catch (err) {
                    alert(err);
                }
            }
            //3.得出东北、西北、西南、东南四段行政区划的边框点的集合
            if (n1 < n2) {     //第一种情况 最东边点在索引前面
                for (var o = n1; o <= n2; o++) {
                    EN += strs[o] + ";"
                }
                //判断西北
                if (n2 < n3) {
                    for (var o = n2; o <= n3; o++) {
                        NW += strs[o] + ";"
                    }
                } else {
                    for (var o = n2; o < strs.length; o++) {
                        NW += strs[o] + ";"
                    }
                    for (var o = 0; o <= n3; o++) {
                        NW += strs[o] + ";"
                    }
                }
                for (var o = n3; o <= n4; o++) {
                    WS += strs[o] + ";"
                }
                //判断东南
                if (n4 < n1) {
                    for (var o = n4; o <= n1; o++) {
                        SE += strs[o] + ";"
                    }
                } else {
                    for (var o = n4; o < strs.length; o++) {
                        SE += strs[o] + ";"
                    }
                    for (var o = 0; o <= n1; o++) {
                        SE += strs[o] + ";"
                    }
                }
            }
            else {   //第二种情况 最东边点在索引后面
                for (var o = n1; o < strs.length; o++) {
                    EN += strs[o] + ";"
                }
                for (var o = 0; o <= n2; o++) {
                    EN += strs[o] + ";"
                }
                for (var o = n2; o <= n3; o++) {
                    NW += strs[o] + ";"
                }
                for (var o = n3; o <= n4; o++) {
                    WS += strs[o] + ";"
                }
                for (var o = n4; o <= n1; o++) {
                    SE += strs[o] + ";"
                }
            }
            //4.自定义外围边框点的集合
            var E_JW = "170.672126, 39.623555;";            //东
            var EN_JW = "170.672126, 81.291804;";       //东北角
            var N_JW = "105.913641, 81.291804;";        //北
            var NW_JW = "-169.604276,  81.291804;";     //西北角
            var W_JW = "-169.604276, 38.244136;";       //西
            var WS_JW = "-169.604276, -68.045308;";     //西南角
            var S_JW = "114.15563, -68.045308;";            //南
            var SE_JW = "170.672126, -68.045308 ;";         //东南角
            //4.添加环形遮罩层
            var ply1 = new BMap.Polygon(EN + NW + WS + SE + E_JW + SE_JW + S_JW + WS_JW + W_JW + NW_JW + EN_JW + E_JW, {
                strokeColor: "none",
                fillColor: fillColor,
                strokeOpacity: 1,
                fillOpacity: 1
            }); //建立多边形覆盖物
            map.addOverlay(ply1);  //遮罩物是半透明的，如果需要纯色可以多添加几层
            //5. 给目标行政区划添加边框，其实就是给目标行政区划添加一个没有填充物的遮罩层
            var count = rs.boundaries.length; //行政区域的点有多少个
            var pointArray = [];
            for (var i = 0; i < count; i++) {
                var ply = new BMap.Polygon(rs.boundaries[i], {
                    strokeWeight: strokeWeight,
                    strokeColor: strokeColor,
                    fillColor: ""
                }); //建立多边形覆盖物

                ply1.addEventListener("click", function () {
                    map.closeInfoWindow();
                });

                map.addOverlay(ply);  //添加覆盖物
                pointArray = pointArray.concat(ply.getPath());
            }
            //            map.setViewport(pointArray, { zoomFactor: 1 });    //调整视野，偏移1个单位
        });
    }

    /**
     * 功能说明： 创建标注点
     * 参数说明: [_data: 某个站点的全部数据]
     */
    function addCovering(_data) {
        addMarker(_data);   // 添加站点图标
        addLabel(_data);    // 添加站点文字标签
        addPolygon(_data);       // 添加覆盖范围
    }


    /**
     * 功能说明： 创建标注点
     * 参数说明: [_data: 某个站点的全部数据]
     */
    function addMarker(_data) {
        // 添加站点
        var OHLongitude = _data.OHLongitude;
        var OHLatitude = _data.OHLatitude;
        if (isNull(OHLongitude) && isNull(OHLatitude)) {
            var point = new BMap.Point(OHLongitude, OHLatitude);
            // 添加文字标签
            //自定义图标
            //var myIcon = new BMap.Icon("/images/customs/application/site.png", new BMap.Size(50, 50));
            //var marker = new BMap.Marker(point, {icon: myIcon});  // 创建标注
            var marker = new BMap.Marker(point);  // 创建标注
            map.addOverlay(marker);              // 将标注添加到地图中
        }
    }

    /**
     * 功能说明： 场强覆盖范围
     * 参数说明: [_data: 某个站点的全部数据]
     */
    function addPolygon(_data) {
        if (isNull(_data.OHDetail)) {
            var OHDetail = _data.OHDetail.split("&");
            for (var j = 0; j < OHDetail.length; j++) {
                var point = OHDetail[j].split(",");
                OHDetail[j] = new BMap.Point(parseFloat(point[0]), parseFloat(point[1]))
            }
            var polygon = new BMap.Polygon(OHDetail, {
                strokeColor: "#FFCC33",
                strokeWeight: 2,
                fillColor: "#FFCC33",
                fillOpacity: 0.2
            });  //创建多边形
            map.addOverlay(polygon);   //增加多边形到地图
        }
    }

    /**
     * 功能说明： 创建标label标签
     * 参数说明: [_data: 某个站点的全部数据]
     */
    function addLabel(_data) {
        var OHLongitude = _data.OHLongitude;
        var OHLatitude = _data.OHLatitude;
        if (isNull(OHLongitude) && isNull(OHLatitude)) {
            var SiteName = _data.SiteName;
            var point = new BMap.Point(OHLongitude, OHLatitude);
            var opts = {
                position: point,    // 指定文本标注所在的地理位置
                offset: new BMap.Size(15, -30)    //设置文本偏移量
            };
            var label = new BMap.Label(SiteName, opts);  // 创建文本标注对象
            label.setStyle({
                color: "#1291a9",
                fontSize: "16px",
                height: "20px",
                lineHeight: "20px",
                backgroundColor: "transparent",
                border: "none",
                fontFamily: "微软雅黑"
            });
            map.addOverlay(label);
        }
    }

    /**
     * 功能说明： 清除地图所有覆盖物
     * 参数说明: 无
     */
    function remove_overlay_markers() {
        map.removeOverlay(markerCache);
    }

    /**
     * 功能说明： 单击获取点击的经纬度
     * 参数说明: [ppArr: 存储所选坐标点]
     */
    var ppArr = "";
    map.addEventListener("click", function (e) {
        ppArr = ppArr + e.point.lng + "," + e.point.lat + "&";
        console.log(ppArr)
    });


    /* ********************************************** 基础javascript工具 ****************************************** */
    function isNull(data){
        return (data == "" || data == undefined || data == null) ? false : data;
    }
    //阻止事件冒泡
    function stopBubble(e) {

        // 如果提供了事件对象，则这是一个非IE浏览器

        if (e && e.stopPropagation) {

            // 因此它支持W3C的stopPropagation()方法

            e.stopPropagation();

        } else {

            // 否则，我们需要使用IE的方式来取消事件冒泡

            window.event.cancelBubble = true;

        }

    }
})();