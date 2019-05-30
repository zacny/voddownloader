var Configurator = (function(Configurator){
    Configurator.setup = function(properties){
        var service = {
            wrapper: {
                selector: '',
                get: function(){
                    return $(service.wrapper.selector);
                },
                exist: function(){
                    return $(service.wrapper.selector).length > 0;
                }
            },
            button: {
                id: 'direct-download',
                style: '',
                class: '',
                click: function(){
                    Executor.asyncChain(service, 0);
                }
            },
            asyncSteps: [],
            onDone: function(data, w) {
                DomTamper.createDocument(data, w);
            }
        };

        return $.extend(true, service, properties);
    };
    return Configurator;
}(Configurator || {}));
