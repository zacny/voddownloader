var ChangeVideoDetector = (function(ChangeVideoDetector){
    var checkVideoChange = function(oldSrc, videoChangeCallback) {
        var src = window.location.href;
        if(src !== undefined && oldSrc !== src){
            console.log("checkVideoChange: " + oldSrc + " -> " + src);
            return Promise.resolve().then(videoChangeCallback);
        }
        else {
            return Promise.resolve().then(
                setTimeout(checkVideoChange, CONST.attempt_timeout, oldSrc, videoChangeCallback)
            );
        }
    };

    ChangeVideoDetector.run = function(videoChangeCallback){
        console.log('ChanageVideoDetector start');
        var src = window.location.href;
        checkVideoChange(src, videoChangeCallback);
    };
    return ChangeVideoDetector;
}(ChangeVideoDetector || {}));
