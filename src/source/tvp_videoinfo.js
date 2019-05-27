var TVP_VIDEOINFO = (function(TVP_VIDEOINFO) {
    var properties = Configurator.setup({
        wrapper: 'body',
        storageKey: 'voddownloader.tvp.videoid'
    });

    var getJsonContent = function(){
        var content = $(properties.wrapper).html();
        return JSON.parse(content);
    };

    TVP_VIDEOINFO.parseJson = function() {
        try {
            var json = getJsonContent();
            var videoId = json.copy_of_object_id !== undefined ? json.copy_of_object_id : json.video_id;
            console.log('videoId: ' + videoId);
            StorageUtil.put(properties.storageKey, videoId, window);
        }
        catch(e){
            DomTamper.handleError(e, properties, window);
        }
    };

    return TVP_VIDEOINFO;
}(TVP_VIDEOINFO || {}));
