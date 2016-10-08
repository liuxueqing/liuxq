/**
 * Created by Liuwei on 2016/9/8.
 */

(function () {


    $("#baiduMap").height($(window).height() - 75);

    $(window).resize(function () {
        $("#baiduMap").height($(window).height() - 75);
    });


    var map = new BMap.Map("baiduMap", {minZoom: 6, maxZoom: 13});    // 创建Map实例


    /* ********************************************** 百度地图初始化设置 **************************************** */
    /**
     * 地图数据设置
     * 参数说明: 无
     */
    var center = [112.458621, 37.609298];     // 设置中心点坐标
    var Zoom = 8;      // 和地图级别
    var CurrentProvincial = "山西省";     // 设置行政区域
    var enableScrollWheelZoom = true;       //开启鼠标滚轮缩放
    var fillColor = "rgba(226,239,238,0.75)";  // 地图遮罩层填充颜色
    var strokeColor = "#B0C4DE";            // 行政边界颜色
    var strokeWeight = 5;   // 行政边界线段粗细
    var polygonFillOpacity = .15;   // 行政边界线段粗细
    var polygonFillOpacityAfterSelected = .75;   // 行政边界线段粗细


    //地图数据缓存
    var markerCache = [];
    var markerPointCache = [];
    var labelCache = [];
    var polygonCache = [];

    var allSiteDataCache = [];
    var currentSiteDataCache = "";
    var currentPolygonCache = "";
    var currentMarkerCache = "";

    var Crtindex = "";    //当前点击的marker、polygon、label 的下标

    /* ********************************************** 百度地图启动 ********************************************** */


    var wait = function () {

        var dfd = $.Deferred(); //在函数内部，新建一个Deferred对象
        init();
        var task = function () {
            // 发布内容
            dfd.resolve("loadBoundary");
        };

        setTimeout(task, 1000);

        return dfd.promise();


    };

    function init(callback) {
        map.clearOverlays();        //清除地图覆盖物
        mapSetting();//添加地图设置信息
        addCtrl();//添加版权信息
        addBoundary(); //添加行政边界和行政边界以外的遮罩层
    }

    /* ********************************************** 加载数据 ****************************************************** */


    $.when(wait())

        .done(function () {
            loadMapData();
        })

        .fail(function () {
            console.log("地图初始化失败");
        });

    /**
     * 功能说明： 初始化ajax请求加载数据
     * 参数说明: 无
     */
    function loadMapData() {

        //第一次打开地图页面, 初始化加载数据

        ajax_load_mapMarker(function () {
            ajax_load_ctrlBox();
            ajax_load_siteInfoWindow(allSiteDataCache[0]);
            //ajax_load_deviceInfoBox(allSiteDataCache[0]);
            addSiteSelected(polygonCache[0], polygonCache);
            //map.setViewport(markerPointCache);
            //panTo_currentMarkerPoint(allSiteDataCache[0]);
        });


        //地图切换按钮控制加载数据
        setTimeout(function () {
            ctrlBox();
        }, 100)

    }


    /**
     * 功能说明： 地图切换按钮控制加载数据
     * 参数说明: 无
     */
    function ctrlBox() {

        var mapSwitchBox = $("#mapSwitchBox");

        $('input[name="siteSwitch').change(function () {
            jqchk();
        });

        function jqchk() { //jquery获取复选框值
            var chk_value = [];
            $('input[name="siteSwitch"]:checked').each(function () {
                chk_value.push($(this).data("projnum"));
            });

            console.log(chk_value);

            $.ajax({
                url: "/api/maps/getSiteInfoByProjNumArr",// 后台接口
                data: {
                    "selectProjNumArr": chk_value
                },
                type: 'post',
                dataType: 'json',
                success: function (Data) {
                    // 清除所有地图覆盖物（不包括行政区域）

                    remove_overlay_markers();
                    var len = Data.length;
                    //console.log(len)
                    clearCache();
                    for (var i = 0; i < len; i++) {
                        allSiteDataCache.push(Data[i]);
                        addCovering(Data[i], i);     // 根据数据添加地图覆盖物
                    }
                    ajax_load_siteInfoWindow(allSiteDataCache[0]);
                    //ajax_load_deviceInfoBox(allSiteDataCache[0]);
                    addSiteSelected(polygonCache[0], polygonCache);
                    panTo_currentMarkerPoint(allSiteDataCache[0]);
                },
                error: function (e) {
                    console.log(e)
                }
            });
        }
    }

    /**
     * 功能说明： 清除所有地图缓存!
     * 参数说明: 无
     */
    function clearCache() {
        markerCache = [];
        markerPointCache = [];
        labelCache = [];
        polygonCache = [];
        allSiteDataCache = [];
    }

    /**
     * 功能说明： ajax请求后台数据,加载所有站点信息
     * 参数说明: 无
     * method: POST
     */
    function ajax_load_mapMarker(callback) {
        //初始化加载地图数据
        $.ajax({
            url: "/api/maps/getAllSiteInfo",// 后台接口
            data: {},
            type: 'post',
            dataType: 'json',
            success: function (Data) {
                var len = Data.length;
                //console.log(len)
                allSiteDataCache = [];
                for (var i = 0; i < len; i++) {
                    allSiteDataCache.push(Data[i]);
                    addCovering(Data[i], i);     // 根据数据添加地图覆盖物
                }
                callback();
            },
            error: function (e) {
                console.log(e)
            }
        });
    }

    /**
     * 功能说明： ajax请求后台数据, 加载地图控制面板数据
     * 参数说明: 无
     * method: POST
     */
    function ajax_load_ctrlBox(callback) {
        //初始化加载控制面板数据
        var mapSwitchBox = $("#mapSwitchBox");
        var controlGroup = mapSwitchBox.find(".control-group");
        var widgetMain = mapSwitchBox.find(".widget-main");
        $.ajax({

            url: "/api/maps/getAllProjInfo",// 后台接口
            data: {},
            type: 'post',
            dataType: 'json',
            success: function (Data) {
                remove_load_animal(widgetMain);
                controlGroup.html("");
                var len = Data.length;
                //console.log(len)
                for (var i = 0; i < len; i++) {
                    controlGroup.append('<div class="checkbox"><label class="block"><input name="siteSwitch" type="checkbox" class="ace input-lg" data-ProjNum=' + Data[i].ProjNum + ' checked><span class="lbl bigger-120"> ' + Data[i].ProjName + '</span> </label></div>')
                }

            },
            error: function (e) {
                console.log(e)
            }
        });
    }

    /**
     * 功能说明： ajax请求后台数据，加载站点详细数据
     * 参数说明: 无
     * method: POST
     */
    function ajax_load_siteInfoWindow(_Data, callback) {

        var siteInfoWindow = $("#siteInfoWindow");
        var siteID = _Data.ID;
        var beforeTime = 0;  //获取ajax传输前的秒数
        var successTime = 0; //获取ajax传输成功的秒数
        //初始化加载站点详细信息窗口数据
        $.ajax({
            url: "/api/maps/getSiteInfoBySiteID",// 后台接口
            data: {
                "siteID": siteID
            },
            type: 'post',
            dataType: 'json',
            beforeSend: function(){
                remove_load_animal(siteInfoWindow);//移除加载动画
                add_load_animal(siteInfoWindow);//添加加载动画
                beforeTime=+new Date();//获取当前秒数
                console.log(beforeTime);
            },
            success: function (Data) {
               var minute = 0; //计算时间差
                successTime=+new Date();//获取当前秒数
                if(successTime>=beforeTime){
                    minute=successTime-beforeTime;
                }else{
                    minute=beforeTime-successTime;
                }
                if(minute >= 500) {
                    siteInfoWindow.html(Data[0].SiteName);
                }
                else{
                    setTimeout(function(){
                        siteInfoWindow.html(Data[0].SiteName);
                    },500)
                }
                //已经获得了所有数据， 暂时不知道要怎么展示， 先显示一条站点名称；
            },
            error: function (e) {
                console.log(e);

            }
        });
    }

    /**
     * 功能说明： 添加加载动画
     * 参数说明: e为要添加加载动画的元素
     * method: POST
     */
    function add_load_animal(e){
        e.append('<div class="widget-box-overlay"><i class="fa fa-spinner fa-spin fa-3x fa-fw white"></i></div>');
    }

    /**
     * 功能说明： 删除加载动画
     * 参数说明: e为所需删除加载动画的元素
     * method: POST
     */
    function remove_load_animal(e){
        var echild=e.children(".widget-box-overlay");
        echild.remove();
    }


    /**
     * 功能说明： ajax请求后台数据， 获取选中站点的所有设备数据
     * 参数说明: 无
     * method: POST
     */
    //function ajax_load_deviceInfoBox(_Data, callback) {
    //
    //    var deviceInfoBox = $("#deviceInfoBox");
    //    var siteID = _Data.ID;
    //    var siteName = _Data.SiteName;
    //    var beforeTime = 0;  //获取ajax传输前的分钟数
    //    var successTime = 0; //获取ajax传输成功的数据
    //
    //    //初始化加载站点详细信息窗口数据
    //    $.ajax({
    //        url: "/api/maps/getAllDevicesInfoBySiteID",// 后台接口
    //        data: {
    //            "siteID": siteID
    //        },
    //        type: 'post',
    //        dataType: 'json',
    //        beforeSend: function(){
    //            remove_load_animal(deviceInfoBox);//移除加载动画
    //            add_load_animal(deviceInfoBox);//添加加载动画
    //            beforeTime=+new Date();//获取当前秒数
    //        },
    //        success: function (Data) {
    //
    //            var _h3_HTML = deviceInfoBox.find("h3");
    //            var _ul_HTML = deviceInfoBox.find("ul");
    //            var minute = 0; //计算时间差
    //            //清除加载动画
    //            successTime=+new Date();//获取当前秒数
    //            if(successTime>=beforeTime){
    //                minute=successTime-beforeTime;
    //            }else{
    //                minute=beforeTime-successTime;
    //            }
    //            if(minute >= 500) {
    //                remove_load_animal(deviceInfoBox);
    //                _h3_HTML.html("");
    //                _ul_HTML.html("");
    //
    //                var len = Data.length;
    //                _h3_HTML.append('<strong>' + siteName + '</strong> 站点设备列表');
    //
    //                for (var i = 0; i < len; i++) {
    //                    _ul_HTML.append('<li class="col-sm-2"><div class="widget-box" ><div class="widget-header"><h5 class="widget-title smaller">设备: ' + Data[i].RegisterDeviceID + '</h5><div class="widget-toolbar"> <span class="badge badge-danger">设备异常</span></div></div><div class="widget-body"><div class="widget-main padding-6"><div class="alert alert-info">  ' + Data[i].RegisterTagID + ' </div></div></div></div></li>')
    //                }
    //            }
    //            else{
    //                setTimeout(function(){
    //                    remove_load_animal(deviceInfoBox);
    //                    _h3_HTML.html("");
    //                    _ul_HTML.html("");
    //
    //                    var len = Data.length;
    //                    _h3_HTML.append('<strong>' + siteName + '</strong> 站点设备列表');
    //
    //                    for (var i = 0; i < len; i++) {
    //                        _ul_HTML.append('<li class="col-sm-2"><div class="widget-box" ><div class="widget-header"><h5 class="widget-title smaller">设备: ' + Data[i].RegisterDeviceID + '</h5><div class="widget-toolbar"> <span class="badge badge-danger">设备异常</span></div></div><div class="widget-body"><div class="widget-main padding-6"><div class="alert alert-info">  ' + Data[i].RegisterTagID + ' </div></div></div></div></li>')
    //                    }
    //                },500)
    //            }
    //
    //        },
    //        error: function (e) {
    //            console.log(e)
    //        }
    //    });
    //}


    /**
     * 功能说明： 加载该站点的数据， 包括详细站点面板和设备列表面板
     * 参数说明: 无
     */
    function loadSiteData(_data) {
        ajax_load_siteInfoWindow(_data);
        //ajax_load_deviceInfoBox(_data);
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
                    StrokeStyle: "dashed",
                    fillColor: ""
                }); //建立多边形覆盖物

                map.addOverlay(ply);  //添加覆盖物
            }
            //            map.setViewport(pointArray, { zoomFactor: 1 });    //调整视野，偏移1个单位
        });
    }

    /**
     * 功能说明： 创建标注点
     * 参数说明: [_data: 某个站点的全部数据]
     */
    function addCovering(_data, Cindex) {
        addMarker(_data, Cindex);   // 添加站点图标
        addLabel(_data, Cindex);    // 添加站点文字标签
        addPolygon(_data, Cindex);       // 添加覆盖范围
    }

    /**
     * 功能说明： 创建标注点
     * 参数说明: [_data: 某个站点的全部数据]
     */
    function addMarker(_data, Cindex) {
        // 添加站点
        var OHLongitude = _data.OHLongitude;
        var OHLatitude = _data.OHLatitude;
        if (notNull(OHLongitude) && notNull(OHLatitude)) {
            var point = new BMap.Point(OHLongitude, OHLatitude);
            // 添加文字标签
            //自定义图标
            var myIcon = new BMap.Icon("/images/customs/application/site.png", new BMap.Size(40, 40));
            var marker = new BMap.Marker(point, {icon: myIcon});  // 创建标注
            //var marker = new BMap.Marker(point);  // 创建标注


            marker.addEventListener('click', function (e) {
                stopBubble(e);
                Crtindex = Cindex;
                currentSiteDataCache = allSiteDataCache[Crtindex];
                currentPolygonCache = polygonCache[Crtindex];
                currentMarkerCache = markerCache[Crtindex];
                reloadCurrentSiteInfo(currentSiteDataCache);
                addSiteSelected(currentPolygonCache, polygonCache);
                panTo_currentMarkerPoint(currentSiteDataCache);
            });


            markerPointCache.push(point);
            markerCache.push(marker);
            map.addOverlay(marker);              // 将标注添加到地图中
        }
    }


    /**
     * 功能说明： 场强覆盖范围
     * 参数说明: [_data: 某个站点的全部数据]
     */
    function addPolygon(_data, Cindex) {

        if (notNull(_data.OHDetail)) {
            var OHDetail = _data.OHDetail.split("&");
            for (var j = 0; j < OHDetail.length; j++) {
                var OHDetailPoint = OHDetail[j].split(",");
                OHDetail[j] = new BMap.Point(parseFloat(OHDetailPoint[0]), parseFloat(OHDetailPoint[1]))
            }
            var polygon = new BMap.Polygon(OHDetail, {
                strokeColor: "#4299de",
                strokeWeight: 2,
                fillColor: "#80f9f5",
                fillOpacity: polygonFillOpacity
            });  //创建多边形

            polygonCache.push(polygon);

            polygon.addEventListener('click', function (e) {
                stopBubble(e);
                Crtindex = Cindex;
                currentSiteDataCache = allSiteDataCache[Crtindex];
                currentPolygonCache = this;
                currentMarkerCache = markerCache[Crtindex];
                reloadCurrentSiteInfo(currentSiteDataCache);
                addSiteSelected(currentPolygonCache, polygonCache);
                panTo_currentMarkerPoint(currentSiteDataCache);
            });
            map.addOverlay(polygon);   //增加多边形到地图
        }
    }

    /**
     * 功能说明： 创建标label标签
     * 参数说明: [_data: 某个站点的全部数据]
     */
    function addLabel(_data, Cindex) {
        var OHLongitude = _data.OHLongitude;
        var OHLatitude = _data.OHLatitude;
        if (notNull(OHLongitude) && notNull(OHLatitude)) {
            var SiteName = _data.SiteName;
            var point = new BMap.Point(OHLongitude, OHLatitude);
            var opts = {
                position: point,    // 指定文本标注所在的地理位置
                offset: new BMap.Size(15, -30)    //设置文本偏移量
            };
            var label = new BMap.Label('<a class="m-mapLabel" data-alert="1">' + SiteName + '</a>', opts);  // 创建文本标注对象
            label.setStyle({
                color: "#1291a9",
                fontSize: "16px",
                height: "20px",
                lineHeight: "20px",
                backgroundColor: "transparent",
                border: "none",
                fontFamily: "微软雅黑"
            });

            label.addEventListener('click', function (e) {
                stopBubble(e);
                Crtindex = Cindex;
                currentSiteDataCache = allSiteDataCache[Crtindex];
                currentPolygonCache = polygonCache[Crtindex];
                currentMarkerCache = markerCache[Crtindex];
                reloadCurrentSiteInfo(currentSiteDataCache);
                addSiteSelected(currentPolygonCache, polygonCache);
                panTo_currentMarkerPoint(currentSiteDataCache);
            });

            labelCache.push(label);
            map.addOverlay(label);
        }
    }


    /**
     * 功能说明： 重新加载选中的站点数据
     * 参数说明: [currentSiteDataCache: 当前选中站点的全部数据]
     */
    function reloadCurrentSiteInfo(currentSiteDataCache) {
        loadSiteData(currentSiteDataCache);
    }


    /**
     * 功能说明： 添加站点选中效果
     * 参数说明: [CP: currentPolygonCache, 当前选中多边形缓存]
     * 参数说明: [PC: polygonCache, 全部多边形缓存]
     */
    function addSiteSelected(CP, PC) {
        var len = PC.length;
        for (var i = 0; i < len; i++) {
            try {
                PC[i].setFillOpacity(polygonFillOpacity);
            }
            catch (err) {
                //跳过没有设置场强的站点, 以防止错误
            }
        }
        if (CP) {
            try {
                CP.setFillOpacity(polygonFillOpacityAfterSelected);
            }
            catch (err) {
                console.log("该站点没有配置场强覆盖！")
            }
        }
    }

    /**
     * 功能说明： 清除地图所有覆盖物
     * 参数说明: 无
     */
    function remove_overlay_markers() {
        for (var i = 0; i < markerCache.length; i++) {
            try {
                markerCache[i].remove();
                labelCache[i].remove();
                polygonCache[i].remove();
            } catch (err) {
                // 跳过可能的错误
            }
        }
    }

    function panTo_currentMarkerPoint(_Data) {
        var OHLongitude = _Data.OHLongitude;
        var OHLatitude = _Data.OHLatitude;
        var point = new BMap.Point(OHLongitude, OHLatitude);
        map.panTo(point);
    }

    /**
     * 功能说明： 单击获取点击的经纬度
     * 参数说明: [ppArr: 存储所选坐标点]
     */
    //var ppArr = "";
    //map.addEventListener("click", function (e) {
    //    ppArr = ppArr + e.point.lng + "," + e.point.lat + "&";
    //    console.log(ppArr)
    //});


    /* ********************************************** 基础javascript工具 ****************************************** */
    function notNull(data) {
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