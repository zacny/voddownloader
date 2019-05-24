var VOD_TVP = (function(VOD_TVP) {
    var apiPrefix = "https://api:vod@apivod.tvp.pl/tv/video/";

    var properties = Configurator.setup({
        wrapper: {
            /**
             * The first selector is iframe id. It shows when adblock is disabled.
             * Otherwise attach button to video content layer.
             **/
            selector: '#tvplayer, div.playerContainer'
        },
        button: {
            class: 'video-block__btn tvp_vod_downlaod_button'
        },
        grabber: {
            urlTemplates: ['https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=$idn'],
            idParser: function(){
                /** Detect from #tvplayer */
                var id = Tool.getUrlParameter('object_id', window.location.href);
                if(id !== null)
                    return id;

                return detectFromDataId();
            },
            formatParser: function(data){
                return VOD_TVP.grabVideoFormats(data);
            },
            errorHandler: function(exception, div){
                if(exception.name = 'API_ERROR'){
                    var idn = properties.grabber.idParser();
                    var link = $('<a />').attr('href',apiPrefix + idn).text("Może tutaj znajdziesz to czego szukasz?");
                    div.append('</br>').append(link);
                }
            }
        }
    });

    /** detect from div.playerContainer */
    var detectFromDataId = function(){
        try {
            var src = properties.wrapper.get().attr('data-id');
            return src.split("/").pop();
        }
        catch(e){
            throw CONST.id_error;
        }
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
        else if(data.status == 'NOT_FOUND'){
            throw CONST.api_error;
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
