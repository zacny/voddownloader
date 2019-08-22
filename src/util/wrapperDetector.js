var WrapperDetector = (function(WrapperDetector){
    var checkWrapperExist = function(attempt, properties){
        logWrapperMessage(properties.wrapper, attempt);
        if (properties.wrapper.exist()) {
            return Promise.resolve().then(
                DomTamper.createButton(properties)
            );
        } else if(attempt > 0){
            attempt = attempt-1;
            return Promise.resolve().then(
                setTimeout(checkWrapperExist, config.attemptTimeout, attempt, properties)
            );
        } else {
            console.info("Nie mam nic do zrobienia");
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
