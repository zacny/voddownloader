var TVP_VIDEOINFO = (function(TVP_VIDEOINFO) {
    var properties = Configurator.setup({
        wrapper: 'body',
        grabber: {
            urlTemplates: ['https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=$idn'],
            idParser: function(){
                try {
                    var videoId = jsonContent.copy_of_object_id !== undefined ?
                        jsonContent.copy_of_object_id :
                        jsonContent.video_id;
                    return videoId;
                }
                catch(e){
                    DomTamper.handleError(e, properties, window);
                }
            },
            formatParser: function(data){
                return VOD_TVP.grabVideoFormats(data);
            }
        }
    });
    var jsonContent = '';

    var getJsonContent = function(){
        var content = $(properties.wrapper).html();
        jsonContent = JSON.parse(content);
    };

    TVP_VIDEOINFO.parseJson = function() {
        try {
            getJsonContent();
            VideoGrabber.grabVideoDataAsync(properties, 0, window);
        }
        catch(e){
            DomTamper.handleError(e, properties, window);
        }
    };

    return TVP_VIDEOINFO;
}(TVP_VIDEOINFO || {}));
