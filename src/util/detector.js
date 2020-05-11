var Detector = (function(conf) {
    var configuration = conf;

    var logObservation = function(){
        var observer = configuration.properties.observer;
        var color = configuration.properties.ready() ? 'color:green' : 'color:red';
        var anchor = observer.anchor ? observer.anchor + '->' : '';
        var params = [color, anchor + observer.selector, 'color:black'];
        Tool.formatConsoleMessage('[%c%s%c]', params);
    };

    this.observe = function(){
        var observer = configuration.properties.observer;
        if(configuration.properties.ready()){
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
