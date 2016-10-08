var express = require('./config/express');
var app = express();
var server = require('http').createServer(app);
var chokidar = require('./config/chokidar');

module .exports = server;