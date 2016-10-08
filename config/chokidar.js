var fs = require('fs');
var util = require('util');
var config = require("./config");
var chokidar = require('chokidar');
var _ = require("underscore")._;

var mp3File = config.historicalAudioDataPath;

var fileJsonTemp = {
    "time": ""
};

/**
 * Created by Liuwei on 2016/9/26.
 * //监听历史音频文件的变化， 并生成相应的MP3文件列表以供页面使用
 */

// Initialize watcher.
var watcher = chokidar.watch(mp3File, {
    ignored: /[\/\\]\./,
    persistent: true
});

// Something to use when events are received.
var log = console.log.bind(console);

var setExplorer = null;

// Add event listeners.
watcher
    .on('ready', () => log('已经监听 historicalAudioData 目录下的文件变化！'))
    .on('add', function () {
        fileJsonTemp = {
            "time": ""
        };
        lazyRunout();
    })
    .on('unlink', function () {
        fileJsonTemp = {
            "time": ""
        };
        lazyRunout();
    });


var lazyRunout = _.debounce(function () {
    explorer(mp3File);

    var lazyWriteFile = _.debounce(function () {
        writeFile(fileJsonTemp);
    }, 2500);

    lazyWriteFile();
}, 100);


/**
 * Created by Liuwei on 2016/9/26.
 * //文件遍历读取并将文件路径写入json文件
 */

function explorer(path) {
    fs.readdir(path, function (err, files) {

        //err 为错误 , files 文件名列表包含文件夹与文件
        if (err) {
            console.log('error:\n' + err);
            return;
        }

        files.forEach(function (file) {

            try {
                fs.stat(path + '/' + file, function (err, stat) {
                    if (err) {
                        console.log(err);
                        console.log(fileJsonTemp);
                        return;
                    }
                    if (stat.isDirectory()) {
                        // 如果是文件夹遍历
                        explorer(path + '/' + file);
                    } else {
                        // 读出所有的文件
                        var allPath = path + '/' + file;

                        console.log(allPath)

                        var deviceID = allPath.match(/\w{35}/)[0];
                        var mp3Path = allPath.match(/\/\w{35}\/\d{8}\/\d{2}_\d{2}_\w{8}.mp3$/)[0];

                        if (!isArray(fileJsonTemp[deviceID])) {
                            fileJsonTemp[deviceID] = [];
                            fileJsonTemp[deviceID].push(mp3Path);
                            fileJsonTemp.time = +new Date();
                        } else {
                            fileJsonTemp[deviceID].push(mp3Path);
                            fileJsonTemp.time = +new Date();
                        }
                    }
                });
            } catch (err) {
                console.log(err)
            }
        });
    });
}

function writeFile(data) {

    var fileName = './config/historicalAudioMp3List.json';//历史音频目录下所有设备ID对应的音频播放列表

    fs.writeFile(fileName, JSON.stringify(data), {flag: 'w'}, function (err) {
        if (err) throw err;
        console.log("历史音频MP3文件播放列表json文件已生成!");
        fileJsonTemp = {
            "time": ""
        };
    });
}

//判断是否为数组， 是 返回true
function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}