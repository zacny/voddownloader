var ElementDetector = (function(ElementDetector) {
    var elementSelector;

    ElementDetector.detect = function(selector, callback){
        elementSelector = selector;
        checkElementExist(config.attempts, callback);
    };

    var checkElementExist = function(attempt, callback){
        if ($(elementSelector).length > 0) {
            return Promise.resolve().then(callback());
        } else if(attempt > 0){
            attempt = attempt-1;
            return Promise.resolve().then(
                setTimeout(checkElementExist, config.attemptTimeout, attempt, callback)
            );
        }
    };

    return ElementDetector;
}(ElementDetector || {}));
