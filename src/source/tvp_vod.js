var VOD_TVP = (function() {
    var properties = new Configurator({
        observer: {
            /**        vod.tvp.pl             *.tvp.pl **/
            selector: '#JS-TVPlayer2-Wrapper, #player2'
        },
        button: {
            class: 'tvp_vod_downlaod_button',
        },
        asyncChains: {
            videos: [
                new Step({
                    urlTemplate: 'https://tvp.pl/pub/stat/videofileinfo?video_id=#videoId',
                    beforeStep: function (input) {
                        return idParser();
                    }
                }),
                new Step({
                    urlTemplate: 'https://vod.tvp.pl/sess/TVPlayer2/api.php?id=#videoId&@method=getTvpConfig' +
                        '&@callback=callback',
                    responseType: 'jsonp',
                    beforeStep: function (json) {
                        return getRealVideoId(json);
                    },
                    afterStep: Common.grapTvpVideoData
                })
            ]
        }
    });

    var idParser = function() {
        var src = $(properties.observer.selector).attr('data-video-id');
        if(src !== undefined){
            return {
                videoId: src.split("/").pop()
            };
        }

        throw new Exception(config.error.id, window.location.href);
    };

    var getRealVideoId = function(json){
        var videoId = json.copy_of_object_id !== undefined ?
            json.copy_of_object_id : json.video_id;
        return {
            videoId: videoId
        };
    };

    this.setup = function(){
        Common.run(properties);
    };
});
