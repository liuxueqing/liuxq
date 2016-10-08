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
                    console.log('mongo :: authenticated and connected to database - RP :: "' + dbName + '"');
                }
            });
        } else {
            console.log('mongo :: connected to database without authenticated - RP :: "'+dbName+'"');
        }
    }
});

var accounts = db.collection('accounts');
var Role = db.collection('Role');
var accessAndResource = db.collection('accessAndResource');

exports.getIdByUser = function (user, callback) {
    accounts.find({"user": user}, {_id: 1}).toArray(function (err, o) {
        if (err) callback(err);
        if (o) {
            callback(o)
        }
    })
};


exports.getPemissionByUser = function (user, callback) {
    accounts.find({"user": user}, {_id: 1}).toArray(function (err, o) {
        if (o) {
            console.log(user.pid)
            Role.find({"_id": user.pid}, {_id: 0, users: 0}).toArray(function (err, o) {
                if (o) {
                    callback(o)
                } else {
                    callback(null)
                }
            });


        } else {
            callback(null)
        }
    })
};

exports.getRoleResourceByRoleName = function (name, callback) {
    Role.findOne({"name": name}, function (err, o) {
        if (err) {
            callback(null);
        }
        if (!o) {
            callback(null)
        } else {
            callback(o)
        }
    })
};

exports.getRoleResourceByRoleNameAndInitialRoleName = function (name, initialRoleName, callback) {

    //比对数据库中、除原账号以外是否存在其他相同账号！
    if (name == initialRoleName) {
        callback(null);
    } else {
        Role.findOne({"name": name}, function (err, o) {
            if (err) {
                callback(null);
            }
            if (!o) {
                callback(null)
            } else {
                callback(o)
            }
        })
    }
};

exports.getRoleResourceByRoleId = function (_id, callback) {
    Role.findOne({"_id": ObjectId(_id)}, function (err, o) {
        if (err) {
            callback(null);
        }
        if (!o) {
            callback(null)
        } else {
            callback(o)
        }
    })
};

exports.getAllRecords = function (callback) {
    Role.find().toArray(function (e, res) {
        if (e) callback(e);
        else callback(null, res);
    });
};

exports.getAllRecordsCount = function (callback) {
    Role.find().count(function (e, res) {
        if (e) callback(e);
        else callback(null, res);
    });
};


exports.getAllRecordsName = function (callback) {
    Role.find({}, {name: 1}).toArray(function (e, res) {
        if (e) callback(e);
        else callback(null, res);
    });
};

exports.getAllRecordsNameWithoutId = function (callback) {
    Role.find({}, {name: 1, _id: 0}).toArray(function (e, res) {
        if (e) callback(e);
        else callback(null, res);
    });
};

exports.addRole = function (newData, callback) {
    Role.findOne({name: newData.name}, function (e, o) {
        if (o) {
            callback('角色名已存在!');
        } else {
            newData.date = moment().format('YYYY MMMM Do, a h:mm:ss');
            Role.insert(newData, {safe: true}, callback);
        }
    });
};

exports.updateRole = function (newData, callback) {

    Role.findOne({_id: ObjectId(newData._id)}, function (e, o) {
        o.name = newData.name;
        o.creator = newData.creator;
        o.description = newData.description;
        o.permissions = newData.permissions;
        Role.save(o, {safe: true}, function (e) {
            if (e) callback(e);
            else callback(null, o);
        });
    });
};

exports.deleteRole = function (id, callback) {
    Role.remove({_id: ObjectId(id)}, callback);
};

exports.getAllAccessAndResource = function (callback) {
    accessAndResource.find().sort({"belongTo": 1}).toArray(function (e, res) {
        if (e) callback(e);
        else callback(null, res);
    });
};

exports.getAccessAndResourceById = function (id, callback) {
    Role.find({_id: ObjectId(id)}).toArray(function (e, res) {
        if (e) callback(e);
        else callback(null, res);
    });
};

exports.getSellectedAccessAndResource = function (IdArry, callback) {

    if (IdArry instanceof Array) {
        var len = IdArry.length;
        var queryList = [];
        for (var i = 0; i < len; i++) {
            var o = {};
            o._id = ObjectId(IdArry[i]);
            queryList.push(o)
        }
        accessAndResource.find({
            "$or": queryList
        }).toArray(function (e, res) {
            if (e) callback(e);
            else callback(null, res);
        });
    }
};