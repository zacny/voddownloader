var VOD = (function() {
    var properties = new Configurator({
        observer: {
            selector: '#v_videoPlayer'
        },
        injection: {
            class: 'right_margin'
        },
        chains: {
            videos: [
                new Step({
                    urlTemplate: 'https://player-api.dreamlab.pl/?body[id]=#videoId&body[jsonrpc]=2.0' +
                        '&body[method]=get_asset_detail&body[params][ID_Publikacji]=#videoId' +
                        '&body[params][Service]=vod.onet.pl&content-type=application/jsonp' +
                        '&x-onet-app=player.front.onetapi.pl&callback=',
                    before: function (input) {
                        return idParser();
                    },
                    after: function (output) {
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
                var videoDesc = value.vertical_resolution + ', ' + value.video_bitrate;
                items.push(Tool.mapDescription({
                    source: 'VOD',
                    key: value.vertical_resolution,
                    video: videoDesc,
                    url: value.url
                }));
            });

            subtitles.forEach(function(subtitle) {
                var extension = subtitle.name.split('.').pop();
                subtitlesItems.push({
                    url: subtitle.url,
                    format: extension,
                    description: subtitle.name
                })
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
        var properties = Common.createProperties('div.pulsembed_embed', frameSelector);

        ElementDetector.detect(properties, function () {
            MessageReceiver.postUntilConfirmed({
                windowReference: $(frameSelector).get(0).contentWindow,
                origin: src,
                message: {
                    location: window.location.href
                }
            });
        });
    };

    this.setup = function(){
        if(iplaDetected()) {
            workWithSubService();
        }
        else if(Tool.isTopWindow()){
            Common.run(properties);
        }
    };
});
