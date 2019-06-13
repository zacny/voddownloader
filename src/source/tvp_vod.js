var VOD_TVP = (function(VOD_TVP) {
    var properties = Configurator.setup({
        wrapper: {
            selector: 'div.playerContainer'
        },
        button: {
            class: 'video-block__btn tvp_vod_downlaod_button',
        },
        asyncChains: {
            default: [
                AsyncStep.setup({
                    urlTemplate: 'https://tvp.pl/pub/stat/videofileinfo?video_id=#videoId',
                    beforeStep: function (input) {
                        return idParser();
                    }
                }),
                AsyncStep.setup({
                    urlTemplate: 'https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=#videoId',
                    beforeStep: function (json) {
                        return getRealVideoId(json);
                    },
                    afterStep: function (output) {
                        return VOD_TVP.grabVideoFormats(output);
                    }
                })
            ]
        }
    });

    var idParser = function(){
        var src = properties.wrapper.get().attr('data-id');
        var videoId = src.split("/").pop();

        if(videoId === null)
            throw new Exception(config.get('error.id'), 'Źródło: ' + src);

        return {
            videoId: videoId
        };
    };

    var getRealVideoId = function(json){
        var videoId = json.copy_of_object_id !== undefined ?
            json.copy_of_object_id : json.video_id;
        return {
            videoId: videoId
        };
    };

    VOD_TVP.grabVideoFormats = function(data){
        var formats = [];
        if(data.status == 'OK' && data.formats !== undefined){
            $.each(data.formats, function( index, value ) {
                if(value.adaptive == false){
                    formats.push({
                        bitrate: value.totalBitrate,
                        url: value.url
                    });
                }
            });
        }

        return {
            title: data.title,
            formats: formats
        };
    };

    VOD_TVP.waitOnWrapper = function(){
        WrapperDetector.run(properties);
    };

    return VOD_TVP;
}(VOD_TVP || {}));
