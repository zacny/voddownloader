var Detector = (function(conf) {
    var configuration = conf;

    var logObservation = function(){
        var observer = configuration.observer;
        var existColor = observer.exist() ? 'color:green' : 'color:red';
        var anchor = observer.anchor ? observer.anchor + '->' : '';
        var params = [existColor, anchor + observer.selector, 'color:black'];
        Tool.formatConsoleMessage('[%c%s%c]', params);
    };

    this.observe = function(){
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
});
