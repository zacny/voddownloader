var VOD_IPLA = (function() {
    var properties = new Configurator({
        observer: {
            anchor: 'body',
            selector: '#player-wrapper, #playerContainer'
        },
        chainSelector: function(){
            return ['videos', 'subtitles'];
        },
        chains: {
            videos: [
                new Step({
                    urlTemplate: 'https://distro.redefine.pl/partner_api/v1/2yRS5K/media/#media_id/vod/player_data?' +
                        'dev=pc&os=linux&player=html&app=firefox&build=12345',
                    before: function (input) {
                        return {media_id: idParser()};
                    },
                    after: function(data){
                        return grabVideoData(data);
                    }
                })
            ],
            subtitles: [
                new Step({
                    after: function (input) {
                        return Common.grabIplaSubtitlesData(getJson());
                    }
                })
            ]
        }
    });

    var grabVideoData = function(data){
        var items = [];
        var displayInfo = (data.mediaItem || {}).displayInfo || {};
        var mediaSources = ((data.mediaItem || {}).playback || {}).mediaSources || {};
        var videos = $.grep(mediaSources, function(source) {
            return source.accessMethod === 'direct';
        });
        if(videos && videos.length > 0){
            $.each(videos, function( index, value ) {
                items.push(Tool.mapDescription({
                    source: 'IPLA',
                    key: value.quality,
                    video: value.quality,
                    url: value.url
                }));
            });
            return {
                title: displayInfo.title,
                cards: {videos: {items: items}}
            }
        }
        throw new Exception(config.error.noSource, Tool.getRealUrl());
    };

    var getJson = function(){
        var match = $('script:not(:empty)').text().match(/(window\.CP\.embedSetup\()(.*)\);/);
        if(match) {
            var jsonObject = JSON.parse(match[2]);
            return JSON.parse(jsonObject[0].media);
        }

        return {};
    };

    var idParser = function(){
        try {
            if($('#player-wrapper').length > 0) {
                return (((getJson() || {}).result || {}).mediaItem || {}).id;
            }
            else if($('#playerContainer').length > 0){
                return getMediaId();
            }
        }
        catch(e){
            throw new Exception(config.error.id, Tool.getRealUrl());
        }
    };

    var getMediaId = function(){
        var match = $('script:not(:empty)').text().match(/mediaId: "(\w+)",/);
        return match[1];
    };

    this.setup = function(){
        var callback = function(data) {
            window.sessionStorage.setItem(config.storage.topWindowLocation, data.location);
            Common.run(properties);
        };
        MessageReceiver.awaitMessage({
            origin: 'https://pulsembed.eu',
            windowReference: window.parent
        }, callback);
    };
});
