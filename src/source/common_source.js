var COMMON_SOURCE = (function(COMMON_SOURCE) {
    COMMON_SOURCE.grabIplaSubtitlesData = function(data){
        var items = [];
        var subtitles = (((data.result || {}).mediaItem || {}).displayInfo || {}).subtitles || [];
        subtitles.forEach(function(subtitle) {
            items.push(new Format({
                url: subtitle.src,
                description: subtitle.name,
                format: subtitle.format
            }))
        });
        return {
            cards: {subtitles: {items: items}}
        };
    };

    COMMON_SOURCE.grabIplaVideoData = function(data){
        var items = [];
        var vod = data.vod || {};
        if(vod.copies && vod.copies.length > 0){
            $.each(vod.copies, function( index, value ) {
                items.push(new Format({
                    bitrate: value.bitrate,
                    url: value.url,
                    quality: value.quality_p
                }))
            });
            return {
                title: vod.title,
                cards: {videos: {items: items}}
            }
        }
        throw new Exception(config.error.noSource, Tool.getRealUrl());
    };

    COMMON_SOURCE.grabTvpVideoData = function(data){
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

    return COMMON_SOURCE;
}(COMMON_SOURCE || {}));