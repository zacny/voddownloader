var WP = (function() {
    var properties = new Configurator({
        observer: {
            anchor: 'body',
            selector: 'div.npp-container'
        },
        button: {
            class: 'wp_download_button material__category'
        },
        asyncChains: {
            videos: [
                new Step({
                    urlTemplate: 'https://wideo.wp.pl/player/mid,#videoId,embed.json',
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
            var id = window.location.href.match(/^(.*)-(\d+)v$/)[2];
            //__NEXT_DATA__ is a variable on page
            return __NEXT_DATA__.props.initialPWPState.material[id].mid;
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
                    var videoDesc = value.quality + ', ' + value.resolution;
                    items.push(Tool.mapDescription({
                        source: 'WP',
                        key: value.quality,
                        video: videoDesc,
                        url: value.url
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

    this.setup = function(){
        Common.run(properties);
    };
});
