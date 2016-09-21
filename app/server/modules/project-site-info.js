
var crypto 		= require('crypto');
var MongoDB 	= require('mongodb').Db;
var Server 		= require('mongodb').Server;
var config	 	= require("../../../config/config");


var dbName = config.mongodb.dbName;
var dbHost = config.mongodb.dbHost;
var dbPort = config.mongodb.dbPort;

var db = new MongoDB(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});
db.open(function(e, d){
    if (e) {
        console.log(e);
    } else {
        if (process.env.NODE_ENV == 'live') {
            db.authenticate(process.env.DB_USER, process.env.DB_PASS, function(e, res) {
                if (e) {
                    console.log('mongo :: error: not authenticated', e);
                }
                else {
                    console.log('mongo :: authenticated and connected to database :: "'+dbName+'"');
                }
            });
        }	else{
            //console.log('mongo :: connected to database :: "'+dbName+'"');
        }
    }
});

var majorDatas = db.collection('majorDatas');

exports.findLeftNavDatas = function(callback)
{
    majorDatas.find({},{_id:0 }).toArray(function(err, o) {
        if(o) {
            callback(o)
        } else {
            callback(null)
        }
    })
};

exports.findDataByProIdAndSiteId = function(proID, siteID, callback)
{
    majorDatas.find({"projID":proID ,"sites.siteID":siteID},{_id:0,"projName":1, "sites.$":1}).toArray(function(err, o) {
        if(o) {
            callback(o)
        } else {
            callback(null)
        }
    })
};