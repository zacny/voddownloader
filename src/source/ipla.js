var IPLA = (function(IPLA) {
    var properties = Configurator.setup({
        wrapper: {
            selector: 'div.player-wrapper:visible:first-child, div.promo-box:visible:first-child,' +
                ' div.player-error-presentation:visible:first-child'
        },
        button: {
            class: 'ipla_download_button'
        },
        asyncChains: {
            default: [
                AsyncStep.setup({
                    urlTemplate: 'https://getmedia.redefine.pl/vods/get_vod/?cpid=1' +
                        '&ua=www_iplatv_html5/12345&media_id=#videoId',
                    beforeStep: function (input) {
                        return idParser();
                    },
                    afterStep: function (output) {
                        return IPLA.grabVideoFormats(output);
                    }
                })
            ]
        }
    });

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

    IPLA.grabVideoFormats = function(data){
        var formats = [];
        var vod = data.vod || {};
        if(vod.copies && vod.copies.length > 0){
            $.each(vod.copies, function( index, value ) {
                formats.push({
                    bitrate: value.bitrate,
                    url: value.url,
                    quality: value.quality_p
                });
            });
            return {
                title: vod.title,
                formats: formats
            }
        }
        throw new Exception(config.error.noSource, window.location.href);
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

        throw new Exception(config.error.id, window.location.href);
    };

    return IPLA;
}(IPLA || {}));
