var WrapperDetector = (function(WrapperDetector){
    WrapperDetector.run = function(properties) {
        var detector = new Detector({
            observer: properties.observer,
            successCallback: function () {
                DomTamper.createButton(properties);
            }
        });
        detector.observeChanges();
    };
    return WrapperDetector;
}(WrapperDetector || {}));
