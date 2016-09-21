/**
 * Created by Liuwei on 2016/8/15.
 */
var http = require('http');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var MongoStore = require('connect-mongo')(session);
var config = require("./config");
var path = require('path');
var favicon = require('serve-favicon');
var flash = require('express-flash');
var crypto = require('crypto');


module.exports = function() {
    console.log('init express...');
    var app = express();

    // set views engine setup
    app.set('views', './app/server/views');
    app.set('view engine', 'html');
    app.engine('.html', require('ejs').__express);


    // use middleware
    app.locals.pretty = true;
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(express.static('./app/public'));
    app.use('/GISMap', express.static('./app/public/GISMap'));
    // mongoDB database
    var dbURL = 'mongodb://'+config.mongodb.dbHost+':'+config.mongodb.dbPort+'/'+config.mongodb.dbName;
    app.use(session({
            secret: 'faeb4453e5d14fe6f6d04637f78077c76c73d1b4',
            proxy: true,
            resave: true,
            saveUninitialized: true,
            store: new MongoStore({ url: dbURL })
        })
    );
    require('./log4js');
    app.use(flash());

    require('../app/server/routes')(app);



    return app
};