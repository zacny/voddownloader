var VOD_TVP = (function() {
    var properties = new Configurator({
        wrapper: {
            /**        vod.tvp.pl             *.tvp.pl **/
            selector: '#JS-TVPlayer2-Wrapper, #player2'
        },
        button: {
            class: 'tvp_vod_downlaod_button',
        },
        asyncChains: {
            videos: [
                new Step({
                    urlTemplates: ['https://tvp.pl/pub/stat/videofileinfo?video_id=#videoId'],
                    beforeStep: function (input) {
                        return idParser();
                    }
                }),
                new Step({
                    urlTemplates: ['https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=#videoId'],
                    beforeStep: function (json) {
                        return getRealVideoId(json);
                    },
                    afterStep: COMMON_SOURCE.grabTvpVideoData
                })
            ]
        }
    });

    var idParser = function() {
        var src = $(properties.wrapper.selector).attr('data-video-id');
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
        WrapperDetector.run(properties);
    };
});
