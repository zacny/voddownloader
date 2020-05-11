var ElementDetector = (function(ElementDetector){
    ElementDetector.detect = function(properties, callback){
        var detector = new Detector({
            properties: properties,
            successCallback: callback
        });
        detector.observe();
    };

    return ElementDetector;
}(ElementDetector || {}));
