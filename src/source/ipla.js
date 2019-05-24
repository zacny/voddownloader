var IPLA = (function(IPLA) {
    var properties = Configurator.setup({
        wrapper: {
            selector: 'div.player-wrapper:visible:first-child, div.promo-box:visible:first-child,' +
                ' div.player-error-presentation:visible:first-child'
        },
        button: {
            class: 'ipla_download_button'
        },
        grabber: {
            urlTemplates: ['https://getmedia.redefine.pl/vods/get_vod/?cpid=1&ua=www_iplatv_html5/12345&media_id=$idn'],
            idParser: function(){
                if(location.href.match(/[\a-z\d]{32}/) !== null){
                    return window.location.href.match(/[\a-z\d]{32}/)[0];
                }

                return grabVideoIdFromWatchingNowElement();
            },
            formatParser: function(data){
                return IPLA.grabVideoFormats(data);
            }
        }
    });

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
        }
        return {
            title: vod.title,
            formats: formats
        }
    };

    var grabVideoIdFromWatchingNowElement = function(){
        try {
            var href = $('div.vod-image-wrapper__overlay').closest('a').attr('href');
            return href.match(/[\a-z\d]{32}/)[0];
        }
        catch(e){
            return grabVideoIdFromHtmlElement();
        }
    };

    var grabVideoIdFromHtmlElement = function(){
        try{
            var frameSrc = $('app-commercial-wallpaper iframe:first-child').attr('src');
            return Tool.getUrlParameter('vid', frameSrc);
        }
        catch(e){
            throw CONST.id_error;
        }
    };

    return IPLA;
}(IPLA || {}));
