var VOD = (function(VOD) {
    var properties = Configurator.setup({
        wrapper: {
            selector: '#v_videoPlayer'
        },
        button: {
            class: 'vod_download_button'
        },
        asyncChains: {
            default: [
                AsyncStep.setup({
                    urlTemplate: 'https://player-api.dreamlab.pl/?body[id]=#videoId&body[jsonrpc]=2.0' +
                        '&body[method]=get_asset_detail&body[params][ID_Publikacji]=#videoId' +
                        '&body[params][Service]=vod.onet.pl&content-type=application/jsonp' +
                        '&x-onet-app=player.front.onetapi.pl&callback=',
                    beforeStep: function (input) {
                        return idParser();
                    },
                    afterStep: function (output) {
                        return formatParser(output);
                    }
                })
            ]
        }
    });

    var idParser = function () {
        var id = $(".mvp").attr('id');
        if(id !== undefined){
            return id.match(/mvp:(.+)/)[1];
        }

        return parseFromJS();
    };

    var parseFromJS = function(){
        var scripts = $('script[type="text/javascript"]').filter(':not([src])');
        for (var i = 0; i < scripts.length; i++) {
            var match = $(scripts[i]).text().match(/\"mvpId\"\s*:\s*\"(\d+\.\d+)\"/);
            if(match && match[1]){
                return match[1];
            }
        }

        throw new Exception(config.error.id, window.location.href);
    };

    var formatParser = function (data) {
        var formats = [];
        var video = (((data.result || new Array())[0] || {}).formats || {}).wideo || {};
        var meta = ((data.result || new Array())[0] || {}).meta || {};
        var videoData = video['mp4-uhd'] && video['mp4-uhd'].length > 0 ? video['mp4-uhd'] : video['mp4'];
        if(videoData && videoData.length > 0){
            $.each(videoData, function( index, value ) {
                formats.push({
                    quality: value.vertical_resolution,
                    bitrate: value.video_bitrate,
                    url: value.url
                });
            });

            return {
                title: meta.title,
                formats: formats
            }
        }
        throw new Exception(config.error.noSource, window.location.href);
    };

    var isTopWindow = function(){
        return window.top === window.self;
    };

    var iplaSectionDetected = function(){
        return $('#v_videoPlayer div.pulsembed_embed').length > 0;
    };

    VOD.waitOnWrapper = function(){
        if(isTopWindow() && !iplaSectionDetected()){
            WrapperDetector.run(properties);
        }
    };

    return VOD;
}(VOD || {}));
