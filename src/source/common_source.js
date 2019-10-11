var COMMON_SOURCE = (function(COMMON_SOURCE) {
    COMMON_SOURCE.grabIplaSubtitlesData = function(data){
        var items = [];
        var subtitles = (((data.result || {}).mediaItem || {}).displayInfo || {}).subtitles || [];
        subtitles.forEach(function(subtitle) {
            items.push({
                url: subtitle.src,
                description: subtitle.name,
                format: subtitle.format
            })
        });
        return {
            cards: {subtitles: {items: items}}
        };
    };

    COMMON_SOURCE.grabTvpVideoData = function(data){
        var items = [];
        if(data.status == 'OK' && data.formats !== undefined){
            $.each(data.formats, function( index, value ) {
                if(value.adaptive == false){
                    var videoDesc = value.totalBitrate;
                    items.push(Tool.mapDescription({
                        source: 'TVP',
                        key: value.totalBitrate,
                        video: videoDesc,
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