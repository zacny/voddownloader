var CDA = (function() {
    var properties = new Configurator({
        observer: {
            selector: '.pb-video-player-wrap'
        },
        button: {
            class: 'cda_download_button',
            click: function(){
                clickButton();
            }
        }
    });

    var clickButton = function(){
        var w = window.open();
        try {
            var url = $("video.pb-video-player").attr('src');
            if(url !== undefined){
                /** HTML5 player */
                if(!url.match(/blank\.mp4/)){
                    prepareResult(url, w);
                }
                /** Flash pleyar - l is an existing variable on page */
                else if(l !== undefined){
                    prepareResult(l, w);
                }
                else {
                    throw new Exception(config.error.id, window.location.href);
                }
            }
        }catch(e){
            DomTamper.handleError(e, w);
        }
    };

    var prepareResult = function(url, w) {
        var cardsData = properties.cardsData;
        var title = $('meta[property="og:title"]');
        var quality = $('.quality-btn-active');
        cardsData.title = title.length > 0 ? title.attr('content').trim() : 'brak danych';
        var videoDesc = quality.length > 0 ? quality.text() : '-';
        cardsData.cards['videos'].items = [
            Tool.mapDescription({
                source: 'CDA',
                key: videoDesc,
                video: videoDesc,
                audio: '-',
                url: url
            })
        ];

        DomTamper.createDocument(cardsData, w);
    };

    this.setup = function(){
        Common.run(properties);
    };
});
