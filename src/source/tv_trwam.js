var TV_TRWAM = (function() {
    var properties = new Configurator({
        observer: {
            anchor: '#ipott',
            mode: 'removed',
            selector: 'div[data-name="playerWindowPlace"]'
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
                        return grabData(output);
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

    var grabData = function(data){
        var streams = (((data || {}).MediaFiles || [])[0] || {}).Formats || [];
        var videoItems = grabVideoData(streams);
        var streamItems = grabStreamData(streams);
        if(videoItems.length > 0 || streamItems.length > 0){
            return {
                cards: {
                    videos: {items: videoItems},
                    streams: {items: streamItems}
                }
            }
        }
        throw new Exception(config.error.noSource, window.location.href);
    };

    var grabVideoData = function(streams){
        var items = [];
        $.each(streams, function( index, value ) {
            if(value.Type === 3){
                items.push(Tool.mapDescription({
                    source: 'TRWAM',
                    key: value.Type,
                    url: value.Url
                }));
            }
        });
        return items;
    };

    var grabStreamData = function(streams){
        var items = [];
        var types = [2, 9];
        $.each(streams, function( index, value ) {
            if($.inArray(value.Type, types) > -1){
                items.push(Tool.mapDescription({
                    source: 'TRWAM',
                    key: value.Type,
                    url: value.Url
                }));
            }
        });
        return items;
    }

    this.setup = function(){
        Common.run(properties);
    };

});
