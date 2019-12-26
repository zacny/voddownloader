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

    var removeUnsupportedVideoFormats = function(files){
        var result = [];
        files.forEach(function (file) {
            if (file['type'] === 'any_native') {
                result.push(file);
            }
        });
        return result;
    };

    COMMON_SOURCE.grapTvpVideoData = function(data){
        var items = [];
        var subtitlesItems = [];
        var info = ((data || {}).content || {}).info || {};
        var files = ((data || {}).content || {}).files || [];
        var subtitles = ((data || {}).content || {}).subtitles || [];
        var files = removeUnsupportedVideoFormats(files);
        if(files.length) {
            files.forEach(function (file) {
                var videoDesc = file.quality.bitrate;
                items.push(Tool.mapDescription({
                    source: 'TVP',
                    key: videoDesc,
                    video: videoDesc,
                    url: file.url
                }));
            });
            subtitles.forEach(function(subtitle) {
                var extension = subtitle.type;
                subtitlesItems.push({
                    url: 'https:' + subtitle.url,
                    format: extension,
                    description: subtitle.lang
                })
            });

            return {
                title: (info.title != null ? info.title : '') + (info.subtitle != null ? ' ' + info.subtitle : ''),
                cards: {
                    videos: {items: items},
                    subtitles: {items: subtitlesItems}
                }
            }
        }
        throw new Exception(config.error.noSource, window.location.href);
    };

    return COMMON_SOURCE;
}(COMMON_SOURCE || {}));