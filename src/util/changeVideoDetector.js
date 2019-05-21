var ChangeVideoDetector = (function(ChangeVideoDetector){
    var checkVideoChange = function(oldSrc, videoChangeCallback) {
        var src = window.location.href;
        if(src !== undefined && oldSrc !== src){
            return Promise.resolve().then(videoChangeCallback);
        }
        else {
            return Promise.resolve().then(
                setTimeout(checkVideoChange, Const.attempt_timeout, oldSrc, videoChangeCallback)
            );
        }
    };

    ChangeVideoDetector.run = function(videoChangeCallback){
        var src = window.location.href;
        checkVideoChange(src, videoChangeCallback);
    };
    return ChangeVideoDetector;
}(ChangeVideoDetector || {}));
