var ElementDetector = (function(ElementDetector){
    ElementDetector.detect = function(selector, callback){
        var detector = new Detector({
            logStyle: 'color:dodgerblue',
            target: selector,
            success: function(){
                return $(this.target).length > 0;
            },
            successCallback: callback
        });
        detector.detect();
    };

    return ElementDetector;
}(ElementDetector || {}));
