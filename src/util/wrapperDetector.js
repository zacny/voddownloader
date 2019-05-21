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
        //console.log('check: ' + properties.wrapper.exist() + ', [' + attempt + ']');
        if (properties.wrapper.exist() || attempt == 0) {
            return Promise.resolve().then(onWrapperExist(properties));
        } else {
            attempt = (attempt > 0) ? attempt-1 : attempt;
            return Promise.resolve().then(
                setTimeout(checkWrapperExist, CONST.attempt_timeout, attempt, properties)
            );
        }
    };

    WrapperDetector.run = function(properties, videoChangeCallback) {
        checkWrapperExist(CONST.attempts, properties);
        if(typeof videoChangeCallback === "function"){
            ChangeVideoDetector.run(videoChangeCallback);
        }
    };
    return WrapperDetector;
}(WrapperDetector || {}));
