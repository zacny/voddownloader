var WP = (function(WP) {
    var properties = Configurator.setup({
        wrapper: {
            selector: '#mainPlayer'
        },
        button: {
            class: 'material__category wp_download_button'
        },
        grabber: {
            urlTemplates: ['https://video.wp.pl/player/mid,$idn,embed.json'],
            idParser: function(){
                try {
                    var pageURL = window.location.href;
                    var regexp = new RegExp('mid,(\\d+),cid');
                    var match = regexp.exec(pageURL);
                    return match[1];
                }
                catch(e){
                    throw CONST.id_error;
                }
            },
            formatParser: function(data){
                return grabVideoFormats(data);
            }
        }
    });

    var grabVideoFormats = function(data){
        var formats = [];
        var urls = (data.clip || {}).url || {};
        if(urls && urls.length > 0){
            $.each(urls, function( index, value ) {
                if(value.type === 'mp4@avc'){
                    formats.push({
                        bitrate: value.quality,
                        url: 'http:' + value.url,
                        quality: value.resolution
                    });
                }
            });
        }
        return {
            title: data.clip.title,
            formats: formats
        }
    };

    WP.waitOnWrapper = function(){
        WrapperDetector.run(properties, WP.waitOnWrapper);
    };

    return WP;
}(WP || {}));
