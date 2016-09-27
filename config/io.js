/**
 * Created by Liuwei on 2016/9/21.
 */
module.exports = function (io) {
    io.on('connection', function (socket) {
        setInterval(update, 5000);
        function update() {
            socket.emit('data', sendData()); //要反复执行的是emit
        }
    });

    function sendData() {
        return JSON.stringify(GLOBAL_CACHE)
    }
};