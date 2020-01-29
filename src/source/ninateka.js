var NINATEKA = (function() {
    var properties = new Configurator({
        observer: {
            selector: '#videoPlayer, #player'
        },
        button: {
            class: 'ninateka_download_button',
            click: function(){
                clickButton();
            }
        }
    });

    var prepareResult = function(url, w) {
        var title = $('meta[name="title"]');
        var cardsData = properties.cardsData;
        cardsData.title = title.length > 0 ? title.attr('content').trim() : 'brak danych';
        cardsData.cards['videos'].items = [
            Tool.mapDescription({
                source: 'NINATEKA',
                key: 'def',
                url: url
            })
        ];
        DomTamper.createDocument(cardsData, w);
    };

    var getMp4Source = function(w, sources){
        for(var i = 0; i < sources.length; i++){
            if(sources[i].type && sources[i].type.match(/mp4/g)){
                prepareResult(sources[i].src, w);
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

    this.setup = function(){
        WrapperDetector.run(properties);
    };
});
