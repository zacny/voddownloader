var TV_TRWAM = (function() {
    var properties = new Configurator({
        observer: {
            anchor: '#ipott',
            mode: 'removed',
            selector: 'div[data-name="playerWindowPlace"]'
        },
        injection: {
            class: 'white'
        },
        chains: {
            videos: [
                new Step({
                    urlTemplate: 'https://api-trwam.app.insysgo.pl/v1/Tile/GetTiles',
                    headers: {'Content-Type': 'application/json'},
                    method: 'POST',
                    methodParam: function(){
                        return getParamsForVideo();
                    },
                    after: function(json) {
                        return getCodename(json);
                    }
                }),
                new Step({
                    urlTemplate: 'https://api-trwam.app.insysgo.pl/v1/Player/AcquireContent?platformCodename=www&' +
                        'codename=#codename',
                    after: function(output) {
                        return grabVideoData(output);
                    }
                })
            ]
        }
    });

    var grabVideoIdFromUrl = function(input){
        var match = input.match(/\/(vod\.[\d]+)$/);
        if(match && match[1]) {
            return match[1];
        }

        throw new Exception(config.error.id, Tool.getRealUrl());
    };

    var getParamsForVideo = function(){
        var mediaId = grabVideoIdFromUrl(window.location.href);
        return {
            platformCodename: "www",
            tilesIds:[mediaId]
        }
    };

    var getCodename = function(json){
        var tile = (json.Tiles || [])[0] || {};
        return {
            title: tile.Title || {},
            codename: tile.Codename || {}
        };
    };

    var resolveKey = function(value){
        var match = value.Url.match(/\/[\w]+_([\d]+p)\.mp4$/);
        if(match && match[1]) {
            return match[1];
        }

        return value.VideoBitrate;
    };

    var grabVideoData = function(data){
        var items = [];
        var streams = (((data || {}).MediaFiles || [])[0] || {}).Formats || [];
        if(streams){
            $.each(streams, function( index, value ) {
                if(value.Type === 3){
                    var key = resolveKey(value);
                    items.push(Tool.mapDescription({
                        source: 'TRWAM',
                        key: key,
                        video: key,
                        url: value.Url
                    }));
                }
            });
            return {
                cards: {videos: {items: items}}
            }
        }
        throw new Exception(config.error.noSource, window.location.href);
    };

    this.setup = function(){
        Common.run(properties);
    };

});
