var WrapperDetector = (function(WrapperDetector){
    var onWrapperExist = function(properties){
        if(properties.wrapper.exist()) {
            DomTamper.createButton(properties);
        }
        else {
            console.info("Nie mam nic do zrobienia");
        }
    };

    var checkWrapperExist = function(attempt, properties){
        logWrapperMessage(properties.wrapper, attempt);
        if (properties.wrapper.exist() || attempt == 0) {
            return Promise.resolve().then(onWrapperExist(properties));
        } else {
            attempt = (attempt > 0) ? attempt-1 : attempt;
            return Promise.resolve().then(
                setTimeout(checkWrapperExist, config.attemptTimeout, attempt, properties)
            );
        }
    };

    var logWrapperMessage = function(wrapper, attempt){
        var existColor = wrapper.exist() ? 'color:green' : 'color:red';
        var params = [
                existColor, wrapper.selector, 'color:gray',
                'color:black;font-weight: bold', attempt, 'color:gray'
            ];
        Tool.formatConsoleMessage('check for: "%c%s%c" [%c%s%c]', params);
    };

    WrapperDetector.run = function(properties, videoChangeCallback) {
        checkWrapperExist(config.attempts, properties);
        if(typeof videoChangeCallback === "function"){
            ChangeVideoDetector.run(videoChangeCallback);
        }
    };
    return WrapperDetector;
}(WrapperDetector || {}));
