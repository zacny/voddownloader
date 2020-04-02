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
        ElementDetector.detect(properties.observer, function () {
            DomTamper.createButton(properties);
        });
    };

    Common.createObserver = function(anchor, selector, mode) {
        return {
            anchor: anchor,
            mode: mode ? mode : 'added',
            selector: selector,
            exist: function() {
                return $(this.selector).length > 0;
            }
        };
    };

    return Common;
}(Common || {}));
