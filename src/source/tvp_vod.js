var VOD_TVP = (function(VOD_TVP) {
    var properties = Configurator.setup({
        wrapper: {
            selector: 'div.playerContainer'
        },
        button: {
            class: 'video-block__btn tvp_vod_downlaod_button',
            click: function(){
                VideoGrabber.grabVideoDataFromJson(properties, 0);
            }
        },
        grabber: {
            urlTemplates: ['https://apivod.tvp.pl/tv/video/$idn'],
            idParser: function(){
                var src = properties.wrapper.get().attr('data-id');
                return src.split("/").pop();
            },
            formatParser: function(data){
                return VOD_TVP.grabVideoFormats(data);
            }
        }
    });

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
