var MongoDB = require('mongodb').Db;
var ObjectId = require('mongodb').ObjectID;
var Server = require('mongodb').Server;
var config = require("../../../config/config");
var moment = require('moment');
moment.locale('zh-cn');

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
                    console.log('mongo :: authenticated and connected to database - ARM :: "' + dbName + '"');
                }
            });
        } else {
            console.log('mongo :: connected to database  without authenticated - ARM :: "' + dbName + '"');
        }
    }
});

var alertRules = db.collection('alertRules');
var historicalData = db.collection('historicalData');


exports.getAlertRulesByDeviceID = function (deviceID, callback) {
    alertRules.find({"deviceID": "" + deviceID}, {_id: 0, deviceID: 0}).toArray(function (err, o) {
        if (err) {
            callback(err, null);
        } else {
            callback(err, o);
        }
    });
};

exports.addDataToHistoricalDatabase = function (data) {
    data.insertDate = moment().format('YYYY-MM-DD HH:mm:ss'); //2014-09-24 23:36:09
    historicalData.insert(data);
};

exports.updateAlertRulesByDeviceID = function (newData, callback) {
    alertRules.findOne({deviceID: newData.deviceID}, function (e, o) {
        o.FMReceiveFQY.value = newData.FMReceiveFQY;
        o.FMReviceSNR.value = newData.FMReviceSNR;
        o.FMReviceRSSI.value = newData.FMReviceRSSI;
        o.RoomHum.value = newData.RoomHum;
        o.RoomTemp.value = newData.RoomTemp;
        alertRules.save(o, {safe: true}, function (e) {
            if (e) callback(e);
            else callback(null, o);
        });
    });
};

exports.getChartDataByDeviceIDAndDate = function (deviceID, date, callback) {
    //console.log(deviceID);
    //console.log(date);
    var selectedStartDay = moment(date).format('YYYY-MM-DD');
    var selectedEndDay = moment(date).add(1, 'days').format('YYYY-MM-DD'); //2014年10月01日

    historicalData.aggregate([
        {
            $match: {
                "deviceID": deviceID,
                "insertDate": {"$gt": selectedStartDay, "$lt": selectedEndDay}
            }
        },
        {
            $group: {
                _id: "$deviceID",
                FMReviceSNR: {$push: "$deviceData.FMReviceSNR.value"},
                FMReviceRSSI: {$push: "$deviceData.FMReviceRSSI.value"},
                RoomHum: {$push: "$deviceData.RoomHum.value"},
                RoomTemp: {$push: "$deviceData.RoomTemp.value"},
                date: {$push: "$insertDate"}
            }
        },
        {
            $sort: {
                "insertDate": 1
            }
        }
    ]).toArray(function (err, o) {
        if (err) {
            callback(err, null);
        } else {
            callback(err, o);
        }
    });
};
