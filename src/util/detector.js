var Detector = (function(conf) {
    var configuration = conf;

    var logMessage = function(attempt){
        var color = configuration.logStyle || 'color:black;font-weight:bold';
        var existColor = configuration.success() ? 'color:green' : 'color:red';
        if(configuration.unlimited){
            var params = [
                existColor, configuration.target, 'color:black'
            ];
            Tool.formatConsoleMessage('[%c%s%c]', params);
        }
        else {
            var params = [
                'color:black', color, configuration.target, 'color:black',
                existColor + ';font-weight:bold', attempt, 'color:black'
            ];
            Tool.formatConsoleMessage('%c[%c%s%c] [%c%s%c]', params);
        }
    };

    var check = function(attempt){
        logMessage(attempt);
        if (configuration.success()) {
            return Promise.resolve().then(
                configuration.successCallback()
            );
        } else if(configuration.unlimited || attempt > 0){
            attempt = attempt-1;
            return Promise.resolve().then(
                setTimeout(check, config.attemptTimeout, attempt)
            );
        }
    };

    this.detect = function() {
        check(config.attempts);
    };
});
