var ElementDetector = (function(ElementDetector){
    ElementDetector.detect = function(observer, callback){
        var detector = new Detector({
            observer: observer,
            successCallback: callback
        });
        detector.observe();
    };

    return ElementDetector;
}(ElementDetector || {}));
