var Common = (function(Common) {
    Common.grabIplaSubtitlesData = function(data){
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

    Common.run = function(properties){
        HistoryTamper.onLocationChange(function () {
            DomTamper.removeButton(properties);
        });
        ElementDetector.detect(properties, function () {
            DomTamper.createButton(properties);
        });
    };

    Common.createProperties = function(anchor, selector, mode) {
        return {
            observer: {
                anchor: anchor,
                mode: mode ? mode : 'added',
                selector: selector,
            },
            ready: function() {
                return $(this.observer.selector).length > 0;
            }
        };
    };

    return Common;
}(Common || {}));
