var MongoDB = require('mongodb').Db;
var ObjectId = require('mongodb').ObjectID;
var Server = require('mongodb').Server;
var config = require("../../../config/config");

/*
 ESTABLISH DATABASE CONNECTION
 */

var dbName = config.mongodb.dbName;
var dbHost = config.mongodb.dbHost;
var dbPort = config.mongodb.dbPort;

var db = new MongoDB(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});
db.open(function (e, d) {
    if (e) {
        console.log(e);
    } else {
        if (process.env.NODE_ENV == 'live') {
            db.authenticate(process.env.DB_USER, process.env.DB_PASS, function (e, res) {
                if (e) {
                    console.log('mongo :: error: not authenticated', e);
                }
                else {
                    console.log('mongo :: authenticated and connected to database :: "' + dbName + '"');
                }
            });
        } else {
            //console.log('mongo :: connected to database :: "'+dbName+'"');
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

exports.getAllSiteInfo = function (callback) {
    NsOHBasicSite.find({}, {_id: 0}).toArray(function (err, o) {
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
            "ProjName": 1,
        }).toArray(function (err, o) {
            if (o) {
                callback(o)
            } else {
                callback(null)
            }
        })
    }
};
