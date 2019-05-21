var Configurator = (function(Configurator){
    Configurator.setup = function(properties){
        var settings = {
            wrapper: {
                selector: '',
                get: function(){
                    return $(settings.wrapper.selector);
                },
                exist: function(){
                    return $(settings.wrapper.selector).length > 0;
                }
            },
            button: {
                id: 'direct-download',
                style: '',
                class: '',
                click: function(){
                    VideoGrabber.grabVideoData(settings, 0);
                }
            },
            grabber: {
                urlTemplates: [],
                idParser: function(){return null},
                formatParser: function(data){return {title: null, formats: new Array()}}
            }
        };

        return $.extend(true, settings, properties);
    };
    return Configurator;
}(Configurator || {}));
