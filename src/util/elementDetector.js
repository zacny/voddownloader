var ElementDetector = (function(ElementDetector){
    ElementDetector.detect = function(observer, callback){
        var detector = new Detector({
            observer: observer,
            successCallback: callback,
            success: function(){
                return $(observer.selector).length > 0;
            }
        });
        detector.detect();
    };

    return ElementDetector;
}(ElementDetector || {}));
