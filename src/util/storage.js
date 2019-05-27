var StorageUtil = (function(StorageUtil) {
    var checkStorage = function(key, w, callback) {
        var value = w.localStorage.getItem(key);
        if(value !== undefined && value !== null){
            console.log('SessionStorage hit: [' + key + '=' + value + ']');
            w.localStorage.removeItem(key);
            return Promise.resolve().then(callback);
        }
        else {
            return Promise.resolve().then(
                setTimeout(checkStorage, 250, key, w, callback)
            );
        }
    };

    StorageUtil.put = function(key, value, w) {
        w.localStorage.setItem(key, value);
    };

    StorageUtil.waitUntil = function(key, w, callback){
        console.log('SesstionStorage init: [' + key + ']');
        checkStorage(key, w, callback);
    };

    return StorageUtil;
}(StorageUtil || {}));