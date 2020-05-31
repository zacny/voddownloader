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

    var grabVideoData = function(sources){
        var videoItems = [];
        var streamItems = [];
        var title = $('meta[name="title"]').attr('content').trim();
        if(sources && sources.length > 0){
            $.each(sources, function(i, v ) {
                if(sources[i].type && sources[i].type.match(/mp4/g)){
                    videoItems.push(Tool.mapDescription({
                        source: 'NINATEKA',
                        key: v.type,
                        url: v.src
                    }));
                }
                else if(sources[i].type && (sources[i].type.match(/dash\+xml/g) || sources[i].type.match(/mpegURL/g))){
                    streamItems.push(Tool.mapDescription({
                        source: 'NINATEKA',
                        key: v.type,
                        url: v.src
                    }));
                }
            });
            return {
                title: title.length > 0 ? title : 'brak danych',
                cards: {
                    videos: {items: videoItems},
                    streams: {items: streamItems}
                }
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
        return sources;
    };

    this.setup = function(){
        Common.run(properties);
    };
});
