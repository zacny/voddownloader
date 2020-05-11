var Executor = (function(Executor){
    var execute = function(service, options, w){
        var setup = setupStep(service, options);
        logStepInfo(options, setup);
        if(setup.isRemote()){
             executeAsync(service, setup, options, w);
        }
        else {
            callback(service, options, w);
        }
    };

    var executeAsync = function(service, setup, options, w){
        var chain = options.chainNames[options.chainIndex];
        var chainStep = chain + '[' + options.stepIndex + ']';
        var exceptionParams = [chainStep, Tool.getRealUrl()];
        var requestParams = {
            method: setup.method,
            headers: setup.headers,
            url: setup.resolveUrl.url,
            data: JSON.stringify(setup.methodParam()),
            responseType: setup.responseType,
            onload: function(data) {
                var currentStep = getCurrentStep(service, options);
                if(retryPossible(currentStep, options, data.status)){
                    execute(service, options, w);
                }
                else {
                    if(setup.responseType === 'jsonp'){
                        var match = data.responseText.match(/callback\(([\s\S]*?)\);/);
                        if(match && match[1] && !match[1].startsWith('null')){
                            setStepResult(options, {async: JSON.parse(match[1])});
                        }
                    }
                    else {
                        setStepResult(options, {async: data.response || {}});
                    }
                    callback(service, options, w);
                }
            },
            onerror: function(data){
                DomTamper.handleError(new Exception(config.error.call, exceptionParams), w);
            },
            ontimeout: function(){
                DomTamper.handleError(new Exception(config.error.timeout, exceptionParams), w);
            }
        };
        GM_xmlhttpRequest(requestParams);
    };

    var retryPossible = function(step, options, status){
        return step.retryErrorCodes.indexOf(status) >= 0 && step.urlTemplateParts[options.retries++];
    };

    var logStepInfo = function(options, setup){
        var chain = options.chainNames[options.chainIndex];
        var step = chain + '[' + options.stepIndex + ']';
        var stepParams = $.isEmptyObject(setup.methodParam()) ? '' : JSON.stringify(setup.methodParam());
        var params = [
            'color:green', options.retries+1, 'color:black', ':',
            'color:blue', step,  'color:red', setup.isRemote() ? setup.method : '---',
            'color:black;font-weight: bold', setup.isRemote() ? setup.resolveUrl.url : '---', 'color:magenta', stepParams
        ];
        Tool.formatConsoleMessage('%c%s%c%s%c%s%c %s %c %s %c%s', params);
    };

    var setupStep = function(service, options){
        var currentStep = getCurrentStep(service, options);
        beforeStep(currentStep, options);
        var setup = $.extend(true, {}, currentStep);
        if(currentStep.isRemote()) {
            setup.resolveUrl = currentStep.resolveUrl(getStepResult(options).before, options.retries);
        }
        return setup;
    };

    var getCurrentStep = function(service, options){
        var chain = options.chainNames[options.chainIndex];
        var steps = service.chains[chain];
        return steps[options.stepIndex];
    };

    var beforeStep = function(currentStep, options){
        var stepOutput = currentStep.before(getStepResult(options, true).after || {});
        if(currentStep.isRemote()){
            if(typeof stepOutput === 'string' || typeof stepOutput == 'number'){
                var result = stepOutput;
                stepOutput = {};
                stepOutput[config.urlParamDefaultKey] = result;
            }
        }
        setStepResult(options, {before: stepOutput});
    };

    var getStepResult = function(options, previous){
        var chain = options.chainNames[options.chainIndex];
        if(!options.results){
            options.results = {};
        }
        if(!options.results[chain]){
            options.results[chain] = [];
        }
        if(!options.results[chain][options.stepIndex]){
            options.results[chain].push({});
        }
        var stepIndex = previous && options.stepIndex > 0 ? options.stepIndex - 1 : options.stepIndex;
        return options.results[chain][stepIndex];
    };

    var setStepResult = function(options, object){
        var chain = options.chainNames[options.chainIndex];
        options.results[chain][options.stepIndex] = $.extend(true, getStepResult(options), object);
    };

    var hasNextStep = function(service, options){
        var chain = options.chainNames[options.chainIndex];
        var steps = service.chains[chain];
        return steps.length - 1 > options.stepIndex;
    };

    var hasNextChain = function(service, options){
        return options.chainNames.length - 1 > options.chainIndex;
    };

    var pushChain = function(service, options){
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
        var previousResult = currentStep.isRemote() ? getStepResult(options).async : getStepResult(options).before;
        var output = currentStep.after(previousResult || {});
        options.retries = 0;
        setStepResult(options, {after: output});
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
                DomTamper.createLoader(w, service);
            }

            execute(service, options, w);
        }
        catch(e){
            DomTamper.handleError(e, w);
        }
    };

    return Executor;
}(Executor || {}));
