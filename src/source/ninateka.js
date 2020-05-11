var NINATEKA = (function() {
    var properties = new Configurator({
        observer: {
            selector: '#videoPlayer, #player'
        },
        injection: {
            class: 'small_padding'
        },
        chains: {
            videos: [
                new Step({
                    before: function(input){
                        return getVideoUrls();
                    },
                    after: function (input) {
                        return grabVideoData(input);
                    }
                })
            ]
        }
    });

    var grabVideoData = function(results){
        var items = [];
        var title = $('meta[name="title"]').attr('content').trim();
        if(results && results.length > 0){
            $.each(results, function(index, value ) {
                items.push(Tool.mapDescription({
                    source: 'NINATEKA',
                    key: 'def',
                    url: value
                }));
            });
            return {
                title: title.length > 0 ? title : 'brak danych',
                cards: {videos: {items: items}}
            }
        }
        throw new Exception(config.error.noSource, window.location.href);
    };

    var getVideoUrls = function(){
        var videoPlayer = $('#videoPlayer').data('player-setup');
        var sources = (videoPlayer || {}).sources || [];
        if(sources.length == 0){
            var scripts = $('script[type="text/javascript"]').filter(':not([src])');
            for (var i = 0; i < scripts.length; i++) {
                var match = $(scripts[i]).text().match(/fn_\S+\(playerOptionsWithMainSource,\s*\d+\)\.sources/g);
                if(match && match[0]){
                    sources = eval(match[0]);
                    break;
                }
            }
        }
        return getMp4Source(sources);
    };

    var getMp4Source = function(sources){
        var results = [];
        for(var i = 0; i < sources.length; i++){
            if(sources[i].type && sources[i].type.match(/mp4/g)){
                results.push(sources[i].src);
            }
        }
        if(results.length > 0){
            return results
        }

        throw new Exception(config.error.noSource, window.location.href);
    };

    this.setup = function(){
        Common.run(properties);
    };
});
