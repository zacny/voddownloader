var IPLA = (function() {
    var properties = new Configurator({
        wrapper: {
            selector: 'div.player-wrapper:visible:first-child, div.promo-box:visible:first-child,' +
                ' div.player-error-presentation:visible:first-child'
        },
        button: {
            class: 'ipla_download_button'
        },
        chainSelector: function(){
            return ['videos', 'subtitles'];
        },
        asyncChains: {
            videos: [
                new Step({
                    urlTemplate: 'https://distro.redefine.pl/partner_api/v1/2yRS5K/media/#media_id/vod/player_data?' +
                        'dev=pc&os=linux&player=html&app=firefox&build=12345',
                    beforeStep: function (input) {
                        return {media_id: idParser()};
                    },
                    afterStep: COMMON_SOURCE.grabIplaVideoData
                })
            ],
            subtitles: [
                new Step({
                    urlTemplate: 'https://b2c.redefine.pl/rpc/navigation/',
                    method: 'POST',
                    methodParam: function(){
                        return getParamsForSubtitles();
                    },
                    afterStep: COMMON_SOURCE.grabIplaSubtitlesData
                })
            ]
        },
        formatter: COMMON_SOURCE.iplaFormatter
    });

    var getParamsForSubtitles = function(){
        var mediaId = idParser();
        return {
            jsonrpc: "2.0",
            id: 1,
            method: "prePlayData",
            params: {
                userAgentData: {
                    application: "firefox",
                    portal: "ipla"
                },
                cpid: 1,
                mediaId: mediaId
            }
        }
    };

    var idParser = function(){
        var match = location.href.match(/[\a-z\d]{32}/);
        if(match && match[0]) {
            return match[0];
        }

        return grabVideoIdFromWatchingNowElement();
    };

    this.setup = function(){
        WrapperDetector.run(properties, this.setup);
    };

    var grabVideoIdFromWatchingNowElement = function(){
        var href = $('div.vod-image-wrapper__overlay').closest('a').attr('href');
        if(href !== undefined){
            var match = href.match(/[\a-z\d]{32}/);
            if(match && match[0]){
                return match[0];
            }
        }
        return grabVideoIdFromHtmlElement();
    };

    var grabVideoIdFromHtmlElement = function(){
        var frameSrc = $('app-commercial-wallpaper iframe:first-child').attr('src');
        if(frameSrc !== undefined) {
            return Tool.getUrlParameter('vid', frameSrc);
        }

        throw new Exception(config.error.id, Tool.getRealUrl());
    };
});
