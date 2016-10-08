/**
 * Created by Liuwei on 2016/9/20.
 */

//全局缓存容器

global.GLOBAL_CACHE = {};


// Get 方法, 获得缓存数据
GLOBAL_CACHE.get = function (deviceID) {
    var _cache = GLOBAL_CACHE;

    // 如果存在该值
    if (_cache[deviceID]) {
        var insertTime = _cache[deviceID].insertTime;
        var expire = _cache[deviceID].expire;
        var curTime = +new Date();

        // 如果不存在过期时间 或者 存在过期时间但尚未过期
        if (!expire || (expire && curTime - insertTime < expire)) {

            return _cache[deviceID].value;

            // 如果已经过期
        } else if (expire && curTime - insertTime > expire) {
            console.log("deviceID: " + deviceID +" 数据已过期");
            //返回空数据
            return null
        }

    } else {
        return null;
    }

};


// Set 方法, 插入数据到缓存（2种情况： ①新插入、 ②已存在）
GLOBAL_CACHE.set = function (deviceID, value, expire) {
    // 缓存对象
    var _cache = GLOBAL_CACHE;

    // 如果已经存在该值，则重新赋值;
    if (_cache[deviceID]) {

        // 重新赋值
        _cache[deviceID].value = value;
        _cache[deviceID].expire = expire;
        _cache[deviceID].insertTime = +new Date();

        // 如果新插入缓存
    } else {

        _cache[deviceID] = {
            value: value,
            expire: expire,
            /*
             除了value和过期时间外
             还要存储多余的信息
             比如插入缓存的时间，以便对比是否过期
             */
            insertTime: +new Date()
        };
    }
};

exports.GLOBAL_CACHE = GLOBAL_CACHE;
//test get
//cache.get("IWZpJL5WagCwsPs3v4vlHsQXjC4w6UUBYlb")

//test set
//cache.get("IWZpJL5WagCwsPs3v4vlHsQXjC4w6UUBYlb")