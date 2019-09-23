var VOD_TVP = (function(VOD_TVP) {
    var properties = new Configurator({
        wrapper: {
            selector: 'div.playerContainerWrapper'
        },
        button: {
            class: 'video-block__btn tvp_vod_downlaod_button',
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
                    urlTemplate: 'https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=#videoId',
                    beforeStep: function (json) {
                        return getRealVideoId(json);
                    },
                    afterStep: function (output) {
                        return VOD_TVP.grabVideoData(output);
                    }
                })
            ]
        }
    });

    var idParser = function() {
        var src = $('div.playerContainer').attr('data-id');
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

    VOD_TVP.grabVideoData = function(data){
        var items = [];
        if(data.status == 'OK' && data.formats !== undefined){
            $.each(data.formats, function( index, value ) {
                if(value.adaptive == false){
                    items.push(new Format({
                        bitrate: value.totalBitrate,
                        url: value.url
                    }));
                }
            });
            return {
                title: data.title,
                cards: {videos: {items: items}}
            }
        }
        throw new Exception(config.error.noSource, window.location.href);
    };

    VOD_TVP.waitOnWrapper = function(){
        WrapperDetector.run(properties);
    };

    return VOD_TVP;
}(VOD_TVP || {}));
