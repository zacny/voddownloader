var TVN = (function(TVN) {
    var properties = Configurator.setup({
        wrapper: {
            selector: '#player-container'
        },
        button: {
            class: 'btn btn-primary tvn_download_button'
        },
        asyncChains: {
            default: [
                AsyncStep.setup({
                    urlTemplate: '/api/?platform=ConnectedTV&terminal=Panasonic&format=json' +
                        '&authKey=064fda5ab26dc1dd936f5c6e84b7d3c2&v=3.1&m=getItem&id=#videoId',
                    beforeStep: function(input){
                        return idParser();
                    },
                    afterStep: function(output) {
                        return formatParser(output);
                    }
                })
            ]
        }
    });

    var idParser = function(){
        var watchingNow = $('.watching-now').closest('.embed-responsive').find('.embed-responsive-item');
        if(watchingNow.length > 0){
            return watchingNow.attr('href').split(',').pop();
        }

        return episodeIdParser();
    };

    var episodeIdParser = function () {
        var match = window.location.href.match(/odcinki,(\d+)\/.*,(\d+)/);
        if(match && match[2]){
            return match[2];
        }

        return serialIdParser();
    };

    var serialIdParser = function () {
        var match = window.location.href.match(/odcinki,(\d+)/);
        if(match && match[1]){
            throw new Exception(config.error.tvnId, window.location.href);
        }

        return vodIdParser();
    };

    var vodIdParser = function(){
        var match = window.location.href.match(/,(\d+)/);
        if(match && match[1]){
            return match[1];
        }

        throw new Exception(config.error.tvnId, window.location.href);
    };

    var formatParser = function(data){
        var formats = [];
        var title;
        var video_content = (((data.item || {}).videos || {}).main || {}).video_content || {};
        if(video_content && video_content.length > 0){
            $.each(video_content, function( index, value ) {
                var lastPartOfUrl = Tool.deleteParametersFromUrl(value.url).split("/").pop();
                var bitrate = lastPartOfUrl.match(/\d{2,}/g);
                formats.push({
                    quality: value.profile_name,
                    bitrate: bitrate,
                    url: value.url
                });
            });
            title = data.item.episode != null ? 'E'+data.item.episode : '';
            title = data.item.season != null ? 'S'+data.item.season + title : title;
            if(data.item.serie_title != null){
                title = data.item.serie_title + (title != '' ? ' - ' + title : '');
            }

            return {
                title: title,
                formats: formats
            }
        }
        throw new Exception(config.error.noSource, window.location.href);
    };

    TVN.waitOnWrapper = function(){
        WrapperDetector.run(properties, TVN.waitOnWrapper);
    };

    return TVN;
}(TVN || {}));
