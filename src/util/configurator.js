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
                    var chainName = service.chainSelector();
                    Executor.asyncChain(service, {
                        stepIndex: 0,
                        chainName: chainName
                    });
                }
            },
            asyncChains: {
                default: []
            },
            chainSelector: function(){
                return "default";
            },
            formatter: function(data){
                Tool.numberModeSort(data.formats);
            },
            onDone: function(data, w) {
                DomTamper.createDocument(service, data, w);
            }
        };

        return $.extend(true, service, properties);
    };
    return Configurator;
}(Configurator || {}));
