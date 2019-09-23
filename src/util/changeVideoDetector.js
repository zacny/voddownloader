var ChangeVideoDetector = (function(ChangeVideoDetector){
    ChangeVideoDetector.run = function(videoChangeCallback) {
        var detector = new Detector({
            unlimited: true,
            previousLocation: window.location.href,
            target: 'video-change',
            success: function(){
                return this.previousLocation !== window.location.href
            },
            successCallback: videoChangeCallback
        });
        detector.detect();
    };
    return ChangeVideoDetector;
}(ChangeVideoDetector || {}));
