var ARTE = (function(ARTE) {
    var properties = new Configurator({
        wrapper: {
            selector: 'div.avp-player'
        },
        button: {
            class: 'arte_download_button',
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
                return  b.bitrate - a.bitrate;
            });
            data.cards['videos'].items.sort(function (a, b) {
                var aLang = a.langCode, bLang = b.langCode;
                if(aLang !== 'POL' && bLang !== 'POL'){
                    return ('' + a.langCode).localeCompare(b.langCode);
                }
                else if(aLang === 'POL' && bLang !== 'POL'){
                    return -1;
                }
                else if(aLang !== 'POL' && bLang === 'POL'){
                    return 1;
                }
                else {
                    return 0;
                }
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
                items.push(new Format({
                    bitrate: stream.bitrate,
                    quality: stream.width + 'x' + stream.height,
                    langCode: stream.versionShortLibelle,
                    langDesc: stream.versionLibelle,
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

    ARTE.waitOnWrapper = function(){
        WrapperDetector.run(properties);
    };

    return ARTE;
}(ARTE || {}));
