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
                    urlTemplate: 'https://api.arte.tv/api/player/v1/config/pl/#videoId',
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
            Tool.numberModeSort(data.formats, true);
            Tool.infoModeSort(data.formats);
        }
    });

    var idParser = function() {
        try {
            var metaUrl = $('meta[property="og:url"]').attr('content');
            var url = decodeURIComponent(Tool.getUrlParameter('json_url', metaUrl));
            return Tool.deleteParametersFromUrl(url).split('/').pop();
        }
        catch {
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
                    quality: stream.width + ' x ' + stream.height,
                    info: stream.versionShortLibelle,
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
