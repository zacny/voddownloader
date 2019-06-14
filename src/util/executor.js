var Executor = (function(Executor){
    var executeAsync = function(service, options, w){
        var exceptionParams = [options.stepIndex, window.location.href];
        var resolveUrl = beforeStep(service, options);
        console.log('step ' + options.chainName + '[' + options.stepIndex + ']: ' + resolveUrl.url);
        var requestParams = {
            method: 'GET',
            url: resolveUrl.url,
            responseType: 'json',
            onload: function(data) {
                options.data = data.response;
                asyncCallback(service, options, w);
            },
            onerror: function(){
                DomTamper.handleError(new Exception(config.error.call, exceptionParams), w);
            },
            ontimeout: function(){
                DomTamper.handleError(new Exception(config.error.timeout, exceptionParams), w);
            }
        };
        GM_xmlhttpRequest(requestParams);
    };

    var beforeStep = function(service, options){
        var steps = service.asyncChains[options.chainName];
        var currentStep = steps[options.stepIndex];
        var result = currentStep.beforeStep(options.data);
        if(typeof result === 'string' || typeof result == 'number'){
            result = {
                videoId: result
            }
        }
        if(options.urlParams){
            $.extend(true, options.urlParams, result);
        }
        else {
            options.urlParams = result;
        }
        return currentStep.resolveUrl(options.urlParams);
    };

    var afterStep = function(service, options) {
        var steps = service.asyncChains[options.chainName];
        var currentStep = steps[options.stepIndex];
        var output = currentStep.afterStep(options.data);
        options.data = output;
        options.stepIndex += 1;
        return steps[options.stepIndex];
    };

    var asyncCallback = function(service, options, w){
        try {
            var nextStep = afterStep(service, options);
            if(nextStep !== undefined) {
                return Promise.resolve().then(
                    Executor.asyncChain(service, options, w)
                );
            }
            else {
                return Promise.resolve().then(
                    service.onDone(options.data, w)
                );
            }
        }
        catch(e){
            var exceptionParams = [options.stepIndex, window.location.href];
            DomTamper.handleError(new Exception(config.error.api, exceptionParams), w);
        }
    };

    Executor.asyncChain = function(service, options, w){
        try {
            if(w === undefined){
                w = window.open();
                DomTamper.createLoader(w);
            }

            executeAsync(service, options, w);
        }
        catch(e){
            DomTamper.handleError(e, w);
        }
    };

    return Executor;
}(Executor || {}));
