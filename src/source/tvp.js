var TVP = (function() {
    /**
     *  vod.tvp.pl, cyfrowa.tvp.pl
     */
    var urlVideoParser = function() {
        var urlMatch = window.location.href.match(/^https?:\/\/.*\.tvp\.pl\/video\/[a-zA-Z0-9\-]*,[a-zA-Z0-9\-]*,(\d{6,})$/);
        if(urlMatch && urlMatch[1]){
            return urlMatch[1];
        }

        return urlForwardParser();
    };

    /**
     *  sport.tvp.pl, polonia.tvp.pl, (subdomeny).tvp.pl
     */
    var urlForwardParser = function() {
        var urlMatch = window.location.href.match(/^https?:\/\/.*\.tvp\..*\/(\d{6,})\/.*$/);
        if(urlMatch && urlMatch[1]){
            return urlMatch[1];
        }

        return urlParameterParser();
    };
    /**
     *  www.tvp.info, wiadomosci.tvp.pl, (subdomeny).tvp.pl, www.tvpparlament.pl
     */
    var urlParameterParser = function(){
        var ids = [
            Tool.getUrlParameter('ID', window.location.href),
            Tool.getUrlParameter('object_id', window.location.href)
        ];
        var id = ids.find(nonNull);
        if(id){
            return id;
        }

        throw new Exception(config.error.id, window.location.href);
    };

    var nonNull = function (id) {
        return id !== null;
    };

    var properties = new Configurator({
        observer: {
            /**       vod.tvp.pl           sport.tvp.pl       www.tvpparlament.pl  www.tvp.info
             *        cyfrowa.tvp.pl       polonia.tvp.pl                          wiadomosci.tvp.pl
             *                             (subdomeny).tvp.pl                      (subdomeny).tvp.pl
             */
            selector: 'div.playerContainerWrapper, #JS-TVPlayer2-Wrapper, .player-video-container,' +
                ' #tvplayer, #Player'
        },
        chains: {
            videos: [
                new Step({
                    urlTemplate: 'https://tvp.pl/pub/stat/videofileinfo?video_id=#videoId',
                    before: function (input) {
                        return urlVideoParser();
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
        if(window.location.href.match(/^https?:\/\/.*\.tvp\.pl\/video\/[a-zA-Z0-9\-]*,[a-zA-Z0-9\-]*,(\d{6,})$/)){
            setTimeout(function(){
                if($('div.tp3-state-error').length)
                    $('div.tp3-state-error').css("display","none");
                Common.run(properties);
            }, 4000);
        }
        else {
            Common.run(properties);
        }
    };
});
