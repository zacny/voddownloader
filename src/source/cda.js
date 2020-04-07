var CDA = (function() {
    var properties = new Configurator({
        observer: {
            selector: '.pb-video-player-wrap'
        },
        button: {
            class: 'cda_download_button',
        },
        chains: {
            videos: [
                new Step({
                    before: function(input){
                        return getDestinationUrl();
                    },
                    after: function (input) {
                        return grabVideoData(input);
                    }
                })
            ]
        }
    });

    var getDestinationUrl = function(){
        var url = $("video.pb-video-player").attr('src');
        if(url !== undefined){
            /** HTML5 player */
            if(!url.match(/blank\.mp4/)){
                return url;
            }
            /** Flash pleyar - l is an existing variable on page */
            else if(l !== undefined){
                return l;
            }
        }
        throw new Exception(config.error.id, window.location.href);
    };

    var grabVideoData = function(data){
        var items = [];
        var title = $('meta[property="og:title"]');
        var quality = $('.quality-btn-active');
        var videoDesc = quality.length > 0 ? quality.text() : '-';
        items.push(Tool.mapDescription({
            source: 'CDA',
            key: videoDesc,
            video: videoDesc,
            audio: '-',
            url: data
        }));
        return {
            title: title.length > 0 ? title.attr('content').trim() : 'brak danych',
            cards: {videos: {items: items}}
        };
    };

    this.setup = function(){
        Common.run(properties);
    };
});
