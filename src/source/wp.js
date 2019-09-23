var WP = (function(WP) {
    var properties = new Configurator({
        wrapper: {
            selector: '#Player0 > div'
        },
        button: {
            class: 'wp_download_button material__category'
        },
        asyncChains: {
            videos: [
                new Step({
                    urlTemplate: 'https://video.wp.pl/player/mid,#videoId,embed.json',
                    beforeStep: function (input) {
                        return idParser();
                    },
                    afterStep: function (output) {
                        return grabVideoData(output);
                    }
                })
            ]
        }
    });

    var idParser = function () {
        try {
            return $('.identifier').attr('data-id');
        }
        catch(e){
            throw new Exception(config.error.id, window.location.href);
        }
    };

    var grabVideoData = function(data){
        var items = [];
        var urls = (data.clip || {}).url || {};
        if(urls && urls.length > 0){
            $.each(urls, function( index, value ) {
                if(value.type === 'mp4@avc'){
                    items.push(new Format({
                        bitrate: value.quality,
                        url: value.url,
                        quality: value.resolution
                    }));
                }
            });

            return {
                title: data.clip.title,
                cards: {videos: {items: items}}
            }
        }
        throw new Exception(config.error.noSource, window.location.href);
    };

    WP.waitOnWrapper = function(){
        WrapperDetector.run(properties, WP.waitOnWrapper);
    };

    return WP;
}(WP || {}));
