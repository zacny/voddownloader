var Executor = (function(Executor){
    var executeAsync = function(service, stepIndex, w, input){
        var asyncStep = service.asyncSteps[stepIndex];
        var url = asyncStep.resolveUrl(asyncStep.beforeStep(input));
        console.log('async step [' + stepIndex + ']: ' + url);
        var requestParams = {
            method: 'GET',
            url: url,
            responseType: 'json',
            onload: function(data) {
                asyncCallback(service, stepIndex, w, data.response);
            },
            onerror: function(){
                DomTamper.handleError(new Exception(CONFIG.get('call_error')), w);
            },
            ontimeout: function(){
                DomTamper.handleError(new Exception(CONFIG.get('timeout_error')), w);
            }
        };
        GM_xmlhttpRequest(requestParams);
    };

    var asyncCallback = function(service, stepIndex, w, response){
        try {
            var currentStep = service.asyncSteps[stepIndex];
            var nextStep = service.asyncSteps[stepIndex+1];
            var output = currentStep.afterStep(response);
            if(nextStep !== undefined) {
                return Promise.resolve().then(
                    Executor.asyncChain(service, stepIndex+1, output, w)
                );
            }
            else {
                return Promise.resolve().then(
                    service.onDone(output, w)
                );
            }
        }
        catch(e){
            DomTamper.handleError(new Exception(CONFIG.get('api_error'),
                'Błąd przetwarzania odpowiedzi asynchronicznej.'), w);
        }
    };

    Executor.asyncChain = function(service, stepIndex, input, w){
        try {
            if(w === undefined){
                w = window.open();
                DomTamper.createLoader(w);
            }

            executeAsync(service, stepIndex, w, input);
        }
        catch(e){
            DomTamper.handleError(e, w);
        }
    };

    return Executor;
}(Executor || {}));
