var fs = require('fs');
var MongoDB = require('mongodb').Db;
var ObjectId = require('mongodb').ObjectID;
var Server = require('mongodb').Server;
var config = require("../../../config/config");
var chokidar = require("../../../config/chokidar");
var _ = require("underscore")._;

/*
 ESTABLISH DATABASE CONNECTION
 */

var dbName = config.mongodb.dbName;
var dbHost = config.mongodb.dbHost;
var dbPort = config.mongodb.dbPort;
var DB_USER = config.mongodb.DB_USER;
var DB_PASS = config.mongodb.DB_PASS;
var NODE_ENV = config.NODE_ENV;

var db = new MongoDB(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});
db.open(function (e, d) {
    if (e) {
        console.log(e);
    } else {
        if (NODE_ENV == 'live') {
            db.authenticate(DB_USER, DB_PASS, function (e, res) {
                if (e) {
                    console.log('mongo :: error: not authenticated', e);
                }
                else {
                    console.log('mongo :: authenticated and connected to database - SM :: "' + dbName + '"');
                }
            });
        } else {
            console.log('mongo :: connected to database  without authenticated - SM :: "' + dbName + '"');
        }
    }
});

var NsOHBasicProject = db.collection('NsOHBasicProject');
var NsOHBasicSite = db.collection('NsOHBasicSite');
var NsOHBasicDevice = db.collection('NsOHBasicDevice');
var majorDatas = db.collection('majorDatas');

/* site info for map methods */

exports.splicingMajorData = function (callback) {
    NsOHBasicProject.find({}, {_id: 0}).toArray(function (err, o) {
        if (err) {
            callback(err, null);
        } else {
            callback(err, o);
        }
    });
};

exports.getAllSiteInfoByProjNum = function (proNum, callback) {
    NsOHBasicSite.find({"ProjectID": "" + proNum}, {_id: 0}).toArray(function (err, o) {
        if (err) {
            callback(err, null);
        } else {
            callback(err, o);
        }
    });
};

exports.getAllDeviceInfoBySiteID = function (SiteID, callback) {
    NsOHBasicDevice.find({"SiteID": "" + SiteID}, {_id: 0}).toArray(function (err, o) {
        if (err) {
            callback(err, null);
        } else {
            callback(err, o);
        }
    });
};

exports.updateMajorDatas = function (newData, callback) {
    majorDatas.remove({}, function (err, o) {
        if (err) {
            callback(e, false);
        } else {
            majorDatas.insert(newData, function (err, result) {
                if (err) {
                    callback(e, false);
                } else {
                    callback(null, true)
                }
            });
        }
    })
};

exports.getAllProjInfoName = function (callback) {
    NsOHBasicProject.find({}, {"_id": 0, ProjName: 1, ProjNum: 1}).toArray(function (err, o) {
        if (err) {
            callback(err, null);
        } else {
            callback(err, o);
        }
    })
};

exports.getSiteInfoByProjNumArr = function (NumArr, callback) {

    var orQuery = [];

    if (typeof NumArr === 'undefined') {
        orQuery.push({
            "ProjectID": "none"
        })
    } else {
        for (var i = 0; i < NumArr.length; i++) {
            orQuery.push({
                "ProjectID": NumArr[i]
            })
        }
    }

    NsOHBasicSite.find({
        "$or": orQuery
    }, {_id: 0}).toArray(function (err, o) {
        if (err) {
            callback(err, null);
        } else {
            callback(err, o);
        }
    })
};

exports.getAllSiteInfo = function (callback) {
    NsOHBasicSite.find({}, {_id: 0}).toArray(function (err, o) {
        if (err) {
            callback(err, null);
        } else {
            callback(err, o);
        }
    })
};

exports.getSiteInfoBySiteID = function (siteID, callback) {
    NsOHBasicSite.find({"ID": siteID}, {_id: 0}).toArray(function (err, o) {
        if (err) {
            callback(err, null);
        } else {
            callback(err, o);
        }
    })
};

exports.getAllDevicesInfoBySiteID = function (siteID, callback) {
    NsOHBasicDevice.find({"SiteID": siteID}, {_id: 0}).toArray(function (err, o) {
        if (err) {
            callback(err, null);
        } else {
            callback(err, o);
        }
    })
};

exports.findLeftNavDatas = function (callback) {
    majorDatas.find({}, {_id: 0}).toArray(function (err, o) {
        if (o) {
            callback(o)
        } else {
            callback(null)
        }
    })
};

exports.findDataByProId = function (ProjNum, callback) {
    majorDatas.find({"ProjNum": ProjNum}).toArray(function (err, o) {
        if (o) {
            callback(o)
        } else {
            callback(null)
        }
    })
};

exports.findDataByProIdAndSiteId = function (ProjNum, siteID, callback) {
    if (siteID != "all") {
        majorDatas.find({"ProjNum": ProjNum, "sites.ID": siteID}, {
            _id: 0,
            "ProjNum": 1,
            "ProjName": 1,
            "sites.$": 1
        }).toArray(function (err, o) {
            if (o) {
                callback(o)
            } else {
                callback(null)
            }
        })
    } else {
        majorDatas.find({"ProjNum": ProjNum}, {
            _id: 0,
            "ProjNum": 1,
            "ProjName": 1
        }).toArray(function (err, o) {
            if (o) {
                var sites = o[0].sites = [];
                sites.push({
                    "SiteName": "显示全部"
                });
                callback(o)
            } else {
                callback(null)
            }
        })
    }
};

//传入当前选中站点的项目ID 和 站点 ID 用来查出对应的所有设备数据
exports.getAllDeviceInfoByProjIDandSiteID = function (ProjID, siteID, callback) {

    var devicesInfo = [];   //用于存储找到的设备信息

    if (siteID === "all") {
        NsOHBasicSite.find({"ProjectID": ProjID}, {"_id": 0, "SiteNum": 1}).toArray(function (err, sitesNumArry) {
            if (err) {
                callback(err)
            } else {

                var lastSiteNum = _.last(sitesNumArry);
                var sitesNumArryIndex = sitesNumArry.length - 1;

                //该项目下有n个站点， 循环查询
                sitesNumArry.forEach(function (item, index, self) {

                    NsOHBasicDevice.find({"SiteID": item.SiteNum}, {"_id": 0}).toArray(function (err, deviceInfo) {

                        if (err) {
                            callback(err)
                        } else {
                            if (deviceInfo.length > 0) {
                                //如果查询到设备信息
                                devicesInfo.push(deviceInfo);

                                //传入第一个循环 最后一个站点，  传入当前站点, 传入第二个循环的下标
                                if (breakOutTest(lastSiteNum, item, index, sitesNumArryIndex)) {
                                    devicesInfo = _.flatten(devicesInfo);
                                    callback(devicesInfo);
                                }
                            } else {
                                //查询的设备数为空 不做处理;
                                //传入第一个循环 最后一个站点，  传入当前站点, 传入第二个循环的下标
                                if (breakOutTest(lastSiteNum, item, index, sitesNumArryIndex)) {
                                    devicesInfo = _.flatten(devicesInfo);
                                    callback(devicesInfo);
                                }
                            }
                        }
                    });
                });
            }
        })
    } else {
        NsOHBasicDevice.find({"SiteID": siteID}, {"_id": 0}).toArray(function (err, deviceInfo) {
            if (err) {
                callback(err)
            }
            callback(deviceInfo);
        });
    }
};


//使用underscore 作为比较

function breakOutTest(lastSiteNum, item, index, sitesNumArryIndex) {
    return _.isEqual(lastSiteNum, item) && (index == sitesNumArryIndex)
}


//传入当前选中站点的项目ID 和 站点 ID 用来查出对应的所有设备数据
exports.getAllHistoricalAudioDataByDeviceID = function (deviceID, currentPage, pageSize, callback) {

    var filePath = './config/historicalAudioMp3List.json';//历史音频目录下所有设备ID对应的音频播放列表文件;

    var resultObj = {};

    resultObj.deviceID = deviceID;

    fs.readFile(filePath, function (err, data) {
        if (err) {
            resultObj.deviceID = deviceID;
            resultObj.currentPage = currentPage;
            resultObj.pageTotal = 0;
            resultObj.Mp3ListArry = [];
            callback(err, resultObj);
        } else {
            var jsonObj = JSON.parse(data);

            try {

                if (jsonObj[deviceID]) {

                    resultObj.deviceID = deviceID;
                    resultObj.currentPage = currentPage;

                    var pageTotal = jsonObj[deviceID].length;
                    resultObj.pageTotal = pageTotal;

                    var DeviceMp3ListAll = jsonObj[deviceID];

                    if (pageTotal <= pageSize) {
                        resultObj.Mp3ListArry = DeviceMp3ListAll;
                        callback(null, resultObj);
                    } else {
                        var startIndex = (currentPage - 1) * pageSize;

                        if (currentPage == (Math.floor(pageTotal / pageSize) + 1)) {
                            resultObj.Mp3ListArry = DeviceMp3ListAll.slice(startIndex);
                            callback(null, resultObj);
                        } else {
                            resultObj.Mp3ListArry = DeviceMp3ListAll.slice(startIndex, startIndex + pageSize);
                            callback(null, resultObj);
                        }
                    }

                }

            } catch (err) {
                console.log('该设备ID对应的历史音频数据不存在！');
                callback(err, []);
            }
        }

    });


};

exports.getAllProjectsRecords = function (callback) {
    NsOHBasicProject.find().toArray(
        function (e, res) {
            if (e) callback(e);
            else callback(null, res);
        });
};

exports.getAllSitesRecords = function (callback) {
    NsOHBasicSite.find().toArray(
        function (e, res) {
            if (e) callback(e);
            else callback(null, res);
        });
};

exports.getAllDevicesRecords = function (callback) {
    NsOHBasicDevice.find().toArray(
        function (e, res) {
            if (e) callback(e);
            else callback(null, res);
        });
};

exports.getProjectByProjNum = function (ProjNum, callback) {
    NsOHBasicProject.findOne({ProjNum: ProjNum}, function (e, o) {
        callback(o);
    });
}

exports.addNewProject = function (newData, callback) {
    NsOHBasicProject.findOne({user: newData.user}, function (e, o) {
        if (o) {
            callback('username-taken');
        } else {
            NsOHBasicProject.findOne({email: newData.email}, function (e, o) {
                if (o) {
                    callback('email-taken');
                } else {
                    saltAndHash(newData.pass, function (hash) {
                        newData.pass = hash;
                        // append date stamp when record was created //
                        newData.date = moment().format('YYYY MMMM Do, a h:mm:ss');
                        NsOHBasicProject.insert(newData, {safe: true}, callback);
                    });
                }
            });
        }
    });
}