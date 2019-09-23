var VOD = (function(VOD) {
    var properties = new Configurator({
        wrapper: {
            selector: '#v_videoPlayer'
        },
        button: {
            class: 'vod_download_button'
        },
        asyncChains: {
            videos: [
                new Step({
                    urlTemplate: 'https://player-api.dreamlab.pl/?body[id]=#videoId&body[jsonrpc]=2.0' +
                        '&body[method]=get_asset_detail&body[params][ID_Publikacji]=#videoId' +
                        '&body[params][Service]=vod.onet.pl&content-type=application/jsonp' +
                        '&x-onet-app=player.front.onetapi.pl&callback=',
                    beforeStep: function (input) {
                        return idParser();
                    },
                    afterStep: function (output) {
                        return grabVideoData(output);
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

        throw new Exception(config.error.id, Tool.getRealUrl());
    };

    var grabVideoData = function (data) {
        var items = [];
        var subtitlesItems = [];
        var video = (((data.result || new Array())[0] || {}).formats || {}).wideo || {};
        var meta = ((data.result || new Array())[0] || {}).meta || {};
        var subtitles = meta.subtitles || [];
        var videoData = video['mp4-uhd'] && video['mp4-uhd'].length > 0 ? video['mp4-uhd'] : video['mp4'];
        if(videoData && videoData.length > 0){
            videoData.forEach(function(value) {
                items.push(new Format({
                    quality: value.vertical_resolution,
                    bitrate: value.video_bitrate,
                    url: value.url
                }))
            });

            subtitles.forEach(function(subtitle) {
                subtitlesItems.push(new Format({
                    url: subtitle.url,
                    description: subtitle.name
                }))
            });

            return {
                title: meta.title,
                cards: {
                    videos: {items: items},
                    subtitles: {items: subtitlesItems}
                }
            }
        }
        throw new Exception(config.error.noSource, Tool.getRealUrl());
    };

    var iplaDetected = function(){
        return $('#v_videoPlayer div.pulsembed_embed').length > 0;
    };

    var workWithSubService = function(){
        var src = 'https://pulsembed.eu';
        var frameSelector = 'iframe[src^="' + src + '"]';

        ElementDetector.detect(frameSelector, function () {
            MessageReceiver.postUntilConfirmed({
                windowReference: $(frameSelector).get(0).contentWindow,
                origin: src,
                message: {
                    location: window.location.href
                }
            });
        });
    };

    VOD.waitOnWrapper = function(){
        if(iplaDetected()) {
            workWithSubService();
        }
        else {
            WrapperDetector.run(properties);
        }
    };

    return VOD;
}(VOD || {}));
