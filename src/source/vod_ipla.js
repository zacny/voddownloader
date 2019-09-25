var VOD_IPLA = (function() {
    var properties = new Configurator({
        wrapper: {
            selector: '#player-wrapper'
        },
        button: {
            class: 'vod_ipla_downlaod_button'
        },
        chainSelector: function(){
            return ['videos', 'subtitles'];
        },
        asyncChains: {
            videos: [
                new Step({
                    urlTemplate: 'https://getmedia.redefine.pl/vods/get_vod/?cpid=1&ua=www_iplatv_html5/12345' +
                        '&media_id=#videoId',
                    beforeStep: function (input) {
                        return idParser();
                    },
                    afterStep: function (output) {
                        return COMMON_SOURCE.grabIplaVideoData(output);
                    }
                })
            ],
            subtitles: [
                new Step({
                    afterStep: function (output) {
                        return parseSubtitleData();
                    }
                })
            ]
        }
    });

    var getJson = function(){
        var match = $('script:not(:empty)').text().match(/(window\.CP\.embedSetup\()(.*)\);/);
        var jsonObject = JSON.parse(match[2]);
        return JSON.parse(jsonObject[0].media);
    };

    var idParser = function(){
        try {
            return (((getJson() || {}).result || {}).mediaItem || {}).id;
        }
        catch(e){
            throw new Exception(config.error.id, Tool.getRealUrl());
        }
    };

    var parseSubtitleData = function(){
        return COMMON_SOURCE.grabIplaSubtitlesData(getJson());
    };

    this.setup = function(){
        var callback = function(data) {
            window.sessionStorage.setItem(config.storage.topWindowLocation, data.location);
            WrapperDetector.run(properties);
        };
        MessageReceiver.awaitMessage({
            origin: 'https://pulsembed.eu',
            windowReference: window.parent
        }, callback);
    };
});
