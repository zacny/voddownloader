var NINATEKA = (function(NINATEKA) {
    var properties = Configurator.setup({
        wrapper: {
            selector: '#videoPlayer, #player'
        },
        button: {
            class: 'ninateka_download_button',
            click: function(){
                clickButton();
            }
        }
    });

    var getMp4Source = function(w, sources){
        var notFound = true;
        $.each(sources, function(key, value){
            if(value.type && value.type.match(/mp4/g)){
                notFound = false;
                w.location.href = value.src;
                return false;
            }
        });

        return notFound;
    };

    var clickButton = function(){
        var w = window.open();
        var notFound = true;
        try {
            var videoPlayer = $('#videoPlayer').data('player-setup');
            var sources = (videoPlayer || {}).sources || {};
            if(sources.length > 0){
                notFound = getMp4Source(w, sources);
            }
            else {
                $.each($('script[type="text/javascript"]').filter(':not([src])'), function(key, value){
                    var match = $(value).text().match(/fn_\S+\(playerOptionsWithMainSource,?\s\d+\)\.sources/g);
                    if(match && match[0]){
                        sources = eval(match[0]);
                        notFound = getMp4Source(w, sources);
                        return false;
                    }
                });
            }
            if(notFound){
                throw new Exception(config.error.id, window.location.href);
            }
        }catch(e){
            DomTamper.handleError(e, w);
        }
    };

    NINATEKA.waitOnWrapper = function(){
        WrapperDetector.run(properties);
    };

    return NINATEKA;
}(NINATEKA || {}));
