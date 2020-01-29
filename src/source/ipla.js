var IPLA = (function() {
    var properties = new Configurator({
        observer: {
            anchor: 'app-root',
            mode: 'added',
            selector: 'div.player-wrapper:visible, div.promo-box:visible,' +
                ' div.player-error-presentation:visible'
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
                    urlTemplateParts: [
                      'ua=www_iplatv_html5/12345',
                      'ua=mipla_ios/122'
                    ],
                    urlTemplate: 'https://getmedia.redefine.pl/vods/get_vod/?cpid=1&~&media_id=#videoId',
                    retryErrorCodes: [404],
                    beforeStep: function (input) {
                        return grabVideoIdFromUrl();
                    },
                    afterStep: function(data){
                        return grabVideoData(data);
                    }
                })
            ],
            subtitles: [
                new Step({
                    urlTemplate: 'https://b2c.redefine.pl/rpc/navigation/',
                    method: 'POST',
                    methodParam: function(){
                        return getParamsForSubtitles();
                    },
                    afterStep: Common.grabIplaSubtitlesData
                })
            ]
        }
    });

    var grabVideoData = function(data){
        var items = [];
        var vod = data.vod || {};
        if(vod.copies && vod.copies.length > 0 && !vod.drm){
            $.each(vod.copies, function( index, value ) {
                var videoDesc = value.quality_p + ', ' + value.bitrate;
                items.push(Tool.mapDescription({
                    source: 'IPLA',
                    key: value.quality_p,
                    video: videoDesc,
                    url: value.url
                }));
            });
            return {
                title: vod.title,
                cards: {videos: {items: items}}
            }
        }
        throw new Exception(config.error.noSource, Tool.getRealUrl());
    };

    var getParamsForSubtitles = function(){
        var mediaId = grabVideoIdFromUrl();
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

    this.setup = function(){
        Common.run(properties);
    };

    var matchingId = function(input, failureAction){
        input = input ? input : '';
        var match = matchingHexId(input);
        if(!match){
            match = matchingDecId(input);
        }
        return match ? match : failureAction();
    };

    var matchingHexId = function(input){
        var match = input.match(/[0-9a-f]{32}/);
        if(match && match[0]) {
            return match[0];
        }

        return null;
    };

    var matchingDecId = function(input) {
        var match = input.match(/([\d]+)?(\?.*)$/);
        if(match && match[1]) {
            return match[1];
        }

        return null;
    };

    var grabVideoIdFromUrl = function(){
        return matchingId(location.href, grabVideoIdFromWatchingNowElement);
    };

    var grabVideoIdFromWatchingNowElement = function(){
        return matchingId($('div.vod-image-wrapper__overlay').closest('a').attr('href'), grabVideoIdFromHtmlElement);
    };

    var grabVideoIdFromHtmlElement = function(){
        var frameSrc = $('app-commercial-wallpaper iframe:first-child').attr('src');
        if(frameSrc !== undefined) {
            return Tool.getUrlParameter('vid', frameSrc);
        }
        throw new Exception(config.error.id, Tool.getRealUrl());
    };
});
