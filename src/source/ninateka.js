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
        for(var i = 0; i < sources.length; i++){
            if(sources[i].type && sources[i].type.match(/mp4/g)){
                w.location.href = sources[i].src;
                return;
            }
        }

        throw new Exception(config.error.id, window.location.href);
    };

    var clickButton = function(){
        var w = window.open();
        try {
            var videoPlayer = $('#videoPlayer').data('player-setup');
            var sources = (videoPlayer || {}).sources || {};
            if(sources.length > 0){
                getMp4Source(w, sources);
            }
            else {
                var scripts = $('script[type="text/javascript"]').filter(':not([src])');
                for (var i = 0; i < scripts.length; i++) {
                    var match = $(scripts[i]).text().match(/fn_\S+\(playerOptionsWithMainSource,\s*\d+\)\.sources/g);
                    if(match && match[0]){
                        sources = eval(match[0]);
                        getMp4Source(w, sources);
                        break;
                    }
                }
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