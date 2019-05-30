var Executor = (function(Executor){
    var executeAsync = function(vod, stepIndex, w, input){
        var asyncStep = vod.asyncSteps[stepIndex];
        var url = asyncStep.resolveUrl(asyncStep.beforeStep(input));
        var requestParams = {
            method: 'GET',
            url: url,
            responseType: 'json',
            onload: function(data) {
                asyncCallback(vod, stepIndex, w, data.response);
            },
            onerror: function(){
                DomTamper.handleError(CONFIG.get('call_error'), w);
            },
            ontimeout: function(){
                DomTamper.handleError(CONFIG.get('timeout_error'), w);
            }
        };
        GM_xmlhttpRequest(requestParams);
    };

    var asyncCallback = function(vod, stepIndex, w, response){
        try {
            var currentStep = vod.asyncSteps[stepIndex];
            var nextStep = vod.asyncSteps[stepIndex+1];
            var output = currentStep.afterStep(response);
            if(nextStep !== undefined) {
                return Promise.resolve().then(
                    Executor.asyncChain(vod, stepIndex, output, w)
                );
            }
            else {
                return Promise.resolve().then(
                    vod.onDone(output, w)
                );
            }
        }
        catch(e){
            DomTamper.handleError(CONFIG.get('api_error'), w)
        }
    };

    Executor.asyncChain = function(vod, stepIndex, input, w){
        try {
            w = (w === undefined) ? window.open(): w;
            executeAsync(vod, stepIndex, w, input);
        }
        catch(e){
            DomTamper.handleError(e, w);
        }
    };
    return Executor;
}(Executor || {}));