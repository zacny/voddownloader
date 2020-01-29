var Detector = (function(conf) {
    var configuration = conf;

    var logMessage = function(){
        var existColor = configuration.success() ? 'color:green' : 'color:red';
        var params = [existColor, configuration.observer.selector, 'color:black'];
        Tool.formatConsoleMessage('[%c%s%c]', params);
    };

    var logObservation = function(){
        var observer = configuration.observer;
        var existColor = observer.exist() ? 'color:green' : 'color:red';
        var anchor = observer.anchor ? observer.anchor + '->' : '';
        var params = [existColor, anchor + observer.selector, 'color:black'];
        Tool.formatConsoleMessage('[%c%s%c]', params);
    };

    this.observeChanges = function(){
        var observer = configuration.observer;
        if(observer.exist()){
            logObservation();
            configuration.successCallback();
        }
        else {
            $(observer.anchor).observe(observer.mode, observer.selector, function(record) {
                logObservation();
                configuration.successCallback();
            });
        }
    };

    this.detect = function() {
        if(configuration.success()){
            console.log('Detection immediately');
            configuration.successCallback()
        }
        var observer = configuration.observer;
        // console.log($(observer.anchor).get(0));
        logMessage();
        $(observer.anchor).observe(observer.mode, observer.selector, function(record) {
            console.log('Detection with success');
            logMessage();
            configuration.successCallback();
        });
    };

    this.observe = function(){
        logMessage();
        var observer = configuration.prop.observer;
        if(observer.init){
            console.log($(observer.anchor).get(0));
            $(observer.anchor).observe(observer.mode, observer.selector, function(record) {
                logMessage();
                DomTamper.createButton(configuration.prop);
            });
        }
        else {
            DomTamper.createButton(configuration.prop);
        }
    }
});
