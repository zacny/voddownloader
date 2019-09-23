var IPLA = (function(IPLA) {
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
                    urlTemplate: 'https://getmedia.redefine.pl/vods/get_vod/?cpid=1' +
                        '&ua=www_iplatv_html5/12345&media_id=#videoId',
                    beforeStep: function (input) {
                        return idParser();
                    },
                    afterStep: function (output) {
                        return IPLA.grabVideoData(output);
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
                    afterStep: function (output) {
                        return IPLA.grabSubtitlesData(output);
                    }
                })
            ]
        }
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

    IPLA.waitOnWrapper = function(){
        WrapperDetector.run(properties, IPLA.waitOnWrapper);
    };

    IPLA.grabSubtitlesData = function(data){
        var items = [];
        var subtitles = (((data.result || {}).mediaItem || {}).displayInfo || {}).subtitles || [];
        subtitles.forEach(function(subtitle) {
            items.push(new Format({
                url: subtitle.src,
                description: subtitle.name,
                format: subtitle.format
            }))
        });
        return {
            cards: {subtitles: {items: items}}
        };
    };

    IPLA.grabVideoData = function(data){
        var items = [];
        var vod = data.vod || {};
        if(vod.copies && vod.copies.length > 0){
            $.each(vod.copies, function( index, value ) {
                items.push(new Format({
                    bitrate: value.bitrate,
                    url: value.url,
                    quality: value.quality_p
                }))
            });
            return {
                title: vod.title,
                cards: {videos: {items: items}}
            }
        }
        throw new Exception(config.error.noSource, Tool.getRealUrl());
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

    return IPLA;
}(IPLA || {}));
