var TV_TRWAM = (function() {
    var properties = new Configurator({
        observer: {
            anchor: '#ipott',
            mode: 'added',
            selector: 'div[data-name="playerWindowPlace"]'
        },
        button: {
            class: 'trwam_download_button',
        },
        asyncChains: {
            videos: [
                new Step({
                    urlTemplate: 'https://api.arte.tv/api/player/v1/config/#langCode/#videoId',
                    beforeStep: function (input) {
                        return idParser();
                    },
                    afterStep: function (output) {
                        return grabVideoData(output);
                    }
                })
            ]
        },
        formatter: function(data) {
            data.cards['videos'].items.sort(function (a, b) {
                return a.index - b.index;
            });

            var sortingOrder = {'POL': 1};
            data.cards['videos'].items.sort(function (a, b) {
                var aLangOrder = sortingOrder[a.langCode] ? sortingOrder[a.langCode] : -1,
                    bLangOrder = sortingOrder[b.langCode] ? sortingOrder[b.langCode] : -1;
                return bLangOrder - aLangOrder;

            });
        }
    });

    var detectLanguage = function() {
        var regexp = new RegExp('https:\/\/www.arte\.tv\/(\\w{2})\/');
        var match = regexp.exec(window.location.href);
        return match[1];
    };

    var detectVideoId = function(){
        var regexp = new RegExp('https:\/\/www.arte\.tv\/\\w{2}\/videos\/([\\w-]+)\/');
        var match = regexp.exec(window.location.href);
        return match[1];
    };

    var idParser = function() {
        try {
            return {
                videoId: detectVideoId(),
                langCode: detectLanguage()
            };
        }
        catch(e){
            throw new Exception(config.error.id, window.location.href);
        }
    };

    var grabVideoData = function(data){
        var items = [];
        var title = (((data || {}).videoJsonPlayer || {}).eStat || {}).streamName || '';
        var streams = ((data || {}).videoJsonPlayer || {}).VSR || {};
        if(streams){
            Object.keys(streams).filter(function(k, i) {
                return k.startsWith("HTTPS");
            }).forEach(function(k) {
                var stream = streams[k];
                var videoDesc = stream.width + 'x' + stream.height + ', ' + stream.bitrate;
                items.push(Tool.mapDescription({
                    source: 'ARTE',
                    key: stream.bitrate,
                    video: videoDesc,
                    langCode: stream.versionShortLibelle,
                    language: stream.versionLibelle,
                    url: stream.url
                }));
            });
            return {
                title: title,
                cards: {videos: {items: items}}
            }
        }
        throw new Exception(config.error.noSource, window.location.href);
    };

    this.setup = function(){
        Common.run(properties);
    };

});