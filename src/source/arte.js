var ARTE = (function(ARTE) {
    var properties = Configurator.setup({
        wrapper: {
            selector: 'div.avp-player'
        },
        button: {
            class: 'arte_download_button',
        },
        asyncChains: {
            default: [
                AsyncStep.setup({
                    urlTemplate: 'https://api.arte.tv/api/player/v1/config/#langCode/#videoId',
                    beforeStep: function (input) {
                        return idParser();
                    },
                    afterStep: function (output) {
                        return grabVideoFormats(output);
                    }
                })
            ]
        },
        formatter: function(data) {
            data.formats.sort(function (a, b) {
                return  b.bitrate - a.bitrate;
            });
            data.formats.sort(function (a, b) {
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
        var language = $('header > div > div > button > span');
        return language.length > 0 ? language.text().toLowerCase() : 'pl';
    };

    var idParser = function() {
        try {
            var metaUrl = $('meta[property="og:url"]').attr('content');
            var url = decodeURIComponent(Tool.getUrlParameter('json_url', metaUrl));
            return {
                videoId: Tool.deleteParametersFromUrl(url).split('/').pop(),
                langCode: detectLanguage()
            };
        }
        catch(e){
            throw new Exception(config.error.id, window.location.href);
        }
    };

    var grabVideoFormats = function(data){
        var formats = [];
        var title = (((data || {}).videoJsonPlayer || {}).eStat || {}).streamName || '';
        var streams = ((data || {}).videoJsonPlayer || {}).VSR || {};
        if(streams){
            Object.keys(streams).filter(function(k, i) {
                return k.startsWith("HTTPS");
            }).forEach(function(k) {
                var stream = streams[k];
                console.log(stream);
                formats.push(new Format({
                    bitrate: stream.bitrate,
                    quality: stream.width + 'x' + stream.height,
                    langCode: stream.versionShortLibelle,
                    langDesc: stream.versionLibelle,
                    url: stream.url
                }));
            });
            return {
                title: title,
                formats: formats
            };
        }
        throw new Exception(config.error.noSource, window.location.href);
    };

    ARTE.waitOnWrapper = function(){
        WrapperDetector.run(properties);
    };

    return ARTE;
}(ARTE || {}));
