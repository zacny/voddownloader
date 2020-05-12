var TVP = (function() {
    var dataAttributeParser = function() {
        var src = $(properties.observer.selector).attr('data-video-id');
        if(src !== undefined){
            return {
                videoId: src.split("/").pop()
            };
        }

        return urlForwardParser();
    };

    var urlForwardParser = function() {
        var urlMatch = window.location.href.match(/^https?:\/\/.*\.tvp\..*\/(\d{6,})\/.*$/);
        if(urlMatch && urlMatch[1]){
            return urlMatch[1];
        }

        return urlParameterParser();
    };

    var urlParameterParser = function(){
        var id = Tool.getUrlParameter('object_id', window.location.href);
        if(id){
            return id;
        }

        throw new Exception(config.error.id, window.location.href);
    };

    var properties = new Configurator({
        observer: {
            /**     vod.tvp.pl              tvp regionalne      sport.tvp.pl       polonia.tvp.pl    tvpparlament.pl
             *      cyfrowa.tvp.pl          www.tvp.info
             *      (subdomeny).tvp.pl
             */
            selector: '#JS-TVPlayer2-Wrapper, #player2, .news-video__overlay, .player-video-container, #tvplayer'
        },
        chains: {
            videos: [
                new Step({
                    urlTemplate: 'https://tvp.pl/pub/stat/videofileinfo?video_id=#videoId',
                    before: function (input) {
                        return dataAttributeParser();
                    },
                    after: function (input, result) {
                        return getRealVideoId(input, result.before.videoId);
                    }
                }),
                new Step({
                    urlTemplate: 'https://vod.tvp.pl/sess/TVPlayer2/api.php?id=#videoId&@method=getTvpConfig' +
                        '&@callback=callback',
                    responseType: 'jsonp',
                    after: function(input){
                        return grapVideoData(input);
                    }
                })
            ]
        }
    });

    var getRealVideoId = function(json, videoId){
        var videoId = (json || {}).copy_of_object_id !== undefined ?
            json.copy_of_object_id : videoId;
        return {
            videoId: videoId
        };
    };

    var grapVideoData = function(data){
        var items = [];
        var subtitlesItems = [];
        var info = ((data || {}).content || {}).info || {};
        var files = ((data || {}).content || {}).files || [];
        var subtitles = ((data || {}).content || {}).subtitles || [];
        var files = removeUnsupportedVideoFormats(files);
        if(files.length) {
            files.forEach(function (file) {
                var videoDesc = file.quality.bitrate;
                items.push(Tool.mapDescription({
                    source: 'TVP',
                    key: videoDesc,
                    video: videoDesc,
                    url: file.url
                }));
            });
            subtitles.forEach(function(subtitle) {
                var extension = subtitle.type;
                subtitlesItems.push({
                    url: 'https:' + subtitle.url,
                    format: extension,
                    description: subtitle.lang
                })
            });

            return {
                title: (info.title != null ? info.title : '') + (info.subtitle != null ? ' ' + info.subtitle : ''),
                cards: {
                    videos: {items: items},
                    subtitles: {items: subtitlesItems}
                }
            }
        }
        throw new Exception(config.error.noSource, window.location.href);
    };

    var removeUnsupportedVideoFormats = function(files){
        var result = [];
        files.forEach(function (file) {
            if (file['type'] === 'any_native') {
                result.push(file);
            }
        });
        return result;
    };


    this.setup = function(){
        Common.run(properties);
    };
});
