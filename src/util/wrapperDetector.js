var WrapperDetector = (function(WrapperDetector){
    WrapperDetector.run = function(properties, videoChangeCallback) {
        var detector = new Detector({
            logStyle: 'color:orange',
            target: properties.wrapper.selector,
            success: properties.wrapper.exist,
            successCallback: function(){
                DomTamper.createButton(properties);
            }
        });
        detector.detect();

        if(typeof videoChangeCallback === "function"){
            ChangeVideoDetector.run(videoChangeCallback);
        }
    };
    return WrapperDetector;
}(WrapperDetector || {}));
