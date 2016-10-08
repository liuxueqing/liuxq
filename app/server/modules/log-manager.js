var MongoDB = require('mongodb').Db;
var ObjectId = require('mongodb').ObjectID;
var Server = require('mongodb').Server;
var moment = require('moment');
moment.locale('zh-cn');
var config = require("../../../config/config");

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
                    console.log('mongo :: authenticated and connected to database - LM :: "' + dbName + '"');
                }
            });
        } else {
            console.log('mongo :: connected to database  without authenticated  - LM :: "' + dbName + '"');
        }
    }
});

var Log = db.collection('log');

/* add a log */

exports.addLog = function (newData, callback) {
    newData.date = moment().format('YYYY MMMM Do, a h:mm:ss');
    Log.insert(newData, {safe: true}, callback);
};

/* get all log */
exports.getAllRecords = function (callback) {
    Log.find().toArray(function (e, res) {
        if (e) callback(e);
        else callback(null, res);
    });
};

/* get all log */
exports.getAllRecordsCount = function (callback) {
    Log.find().count(function (e, o) {
        if (e) callback(e);
        else callback(null, o);
    });
};

/* get all login log */
exports.getAllLoginLog = function (callback) {
    Log.find({"type": "login"}).toArray(function (e, res) {
        if (e) callback(e);
        else callback(null, res);
    });
};

/* get login log use pagination */
exports.getLoginLogByPagination = function (newData, callback) {
    var page = parseInt(newData.page);
    var rows = parseInt(newData.rows);
    var sidx = newData.sidx;
    var sord = parseInt(newData.sord);
    var sortStr = {};   //排序查询字符串！
    sortStr[sidx] = sord;
    Log.find({"type": "login"}).sort(sortStr).skip((page - 1) * rows).limit(rows).toArray(function (err, rs) {
        if (err) {
            callback(err)
        } else {
            //计算数据总数
            Log.find({"type": "login"}).count(function (e, count) {
                if (e) callback(e);
                else {
                    var totalPages = Math.ceil(count / rows);
                    var jsonArray = {rows: rs, total: totalPages};
                    callback(jsonArray)
                }
            });
        }
    });
};

/* get all operation log */
exports.getAllOperationLog = function (callback) {
    Log.find({"type": "operation"}).toArray(function (e, res) {
        if (e) callback(e);
        else callback(null, res);
    });
};

/* get operation log use pagination */
exports.getOperationLogByPagination = function (newData, callback) {
    var page = parseInt(newData.page);
    var rows = parseInt(newData.rows);
    var sidx = newData.sidx;
    var sord = parseInt(newData.sord);
    var sortStr = {};   //排序查询字符串！
    sortStr[sidx] = sord;
    Log.find({"type": "operation"}).sort(sortStr).skip((page - 1) * rows).limit(rows).toArray(function (err, rs) {
        if (err) {
            callback(err)
        } else {
            //计算数据总数
            Log.find({"type": "operation"}).count(function (e, count) {
                if (e) callback(e);
                else {
                    var totalPages = Math.ceil(count / rows);
                    var jsonArray = {rows: rs, total: totalPages};
                    callback(jsonArray)
                }
            });
        }
    });
};