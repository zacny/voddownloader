//TODO wyeliminować pokazywanie metody przy krokach nieasynchronicznych
//TODO wyeliminować odpytywanie drugiego iframe jak któryś już odpowiedział
var Executor = (function(Executor){
    var execute = function(service, options, w){
        var setup = setupStep(service, options);
        logStepInfo(options, setup);
        if(setup.isRemote){
             executeAsync(service, setup, options, w);
        }
        else {
            options.temporaryData = {};
            callback(service, options, w);
        }
    };

    var executeAsync = function(service, setup, options, w){
        var chain = options.chainNames[options.chainIndex];
        var chainStep = chain + '[' + options.stepIndex + ']';
        var exceptionParams = [chainStep, Tool.getRealUrl()];
        var requestParams = {
            method: setup.method,
            url: setup.resolveUrl.url,
            data: JSON.stringify(setup.methodParam),
            responseType: 'json',
            onload: function(data) {
                options.temporaryData = data.response || {};
                callback(service, options, w);
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

    var logStepInfo = function(options, setup){
        var chain = options.chainNames[options.chainIndex];
        var step = chain + '[' + options.stepIndex + ']';
        var stepParams = $.isEmptyObject(setup.methodParam) ? '' : JSON.stringify(setup.methodParam);
        var params = [
            'color:blue', step,  'color:red', setup.isRemote ? setup.method : '---',
            'color:black;font-weight: bold', setup.resolveUrl.url, 'color:magenta', stepParams
        ];
        Tool.formatConsoleMessage('%c%s%c %s %c %s %c%s', params);
    };

    var setupStep = function(service, options){
        var currentStep = getCurrentStep(service, options);
        var result = currentStep.beforeStep(options.temporaryData);
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

        return {
            resolveUrl: currentStep.resolveUrl(options.urlParams),
            method: currentStep.method,
            methodParam: currentStep.methodParam(),
            isRemote: currentStep.isRemote()
        };
    };

    var getCurrentStep = function(service, options){
        var chain = options.chainNames[options.chainIndex];
        var steps = service.asyncChains[chain];
        return steps[options.stepIndex];
    };

    var hasNextStep = function(service, options){
        var chain = options.chainNames[options.chainIndex];
        var steps = service.asyncChains[chain];
        return steps.length - 1 > options.stepIndex;
    };

    var hasNextChain = function(service, options){
        return options.chainNames.length - 1 > options.chainIndex;
    };

    var setChainResult = function(options){
        var chain = options.chainNames[options.chainIndex];
        if(!options.hasOwnProperty('results')){
            options.results = {};
        }
        var chainResult = options.results;
        chainResult[chain] = options.temporaryData;
        options.temporaryData = {};
    };

    var pushChain = function(service, options){
        setChainResult(options);
        if(hasNextChain(service, options)){
            options.chainIndex += 1;
            options.stepIndex = 0;
            return true;
        }
        return false;
    };

    var pushStep = function(service, options) {
        if(hasNextStep(service, options)){
            options.stepIndex += 1;
            return true;
        }
        return false;
    };

    var afterStep = function(service, options) {
        var currentStep = getCurrentStep(service, options);
        var output = currentStep.afterStep(options.temporaryData);
        options.temporaryData = output;
    };

    var callback = function(service, options, w){
        try {
            afterStep(service, options);
            if(pushStep(service, options) || pushChain(service, options)) {
                return Promise.resolve().then(
                    Executor.chain(service, options, w)
                );
            }
            else {
                return Promise.resolve().then(
                    service.onDone(options.results, w)
                );
            }
        }
        catch(e){
            DomTamper.handleError(e, w);
        }
    };

    Executor.chain = function(service, options, w){
        try {
            if(w === undefined){
                w = window.open();
                DomTamper.createLoader(w);
            }

            execute(service, options, w);
        }
        catch(e){
            DomTamper.handleError(e, w);
        }
    };

    return Executor;
}(Executor || {}));
