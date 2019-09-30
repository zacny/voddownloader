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
        var displayInfo = (data.mediaItem || {}).displayInfo || {};
        var mediaSources = ((data.mediaItem || {}).playback || {}).mediaSources || {};
        var videos = $.grep(mediaSources, function(source) {
            return source.accessMethod === 'direct';
        });
        if(videos && videos.length > 0){
            $.each(videos, function( index, value ) {
                items.push(new Format({
                    url: value.url,
                    quality: value.quality
                }))
            });
            return {
                title: displayInfo.title,
                cards: {videos: {items: items}}
            }
        }
        throw new Exception(config.error.noSource, Tool.getRealUrl());
    };

    COMMON_SOURCE.iplaFormatter = function(data){
        var videosRegexp = /^(\d+)p$/;
        data.cards['videos'].items.sort(function (a, b) {
            var qualityMatchA = a.quality.match(videosRegexp);
            var qualityMatchB = b.quality.match(videosRegexp);
            var qualityA = qualityMatchA && qualityMatchA[1] ? Number(qualityMatchA[1]) : 0;
            var qualityB = qualityMatchB && qualityMatchB[1] ? Number(qualityMatchB[1]) : 0;
            return qualityB - qualityA;
        });
        data.cards['subtitles'].items.sort(function (a, b) {
            return ('' + a.format).localeCompare(b.format);
        });
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