var CDA = (function(CDA) {
    var properties = Configurator.setup({
        wrapper: {
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
        var title = $('meta[property="og:title"]');
        var quality = $('.quality-btn-active');
        var data = {
            title: title.length > 0 ? title.attr('content').trim() : 'brak danych',
            formats: [new Format({
                url: url,
                quality: quality.length > 0 ? quality.text() : undefined
            })]
        };

        DomTamper.createDocument(properties, data, w);
    };

    CDA.waitOnWrapper = function(){
        WrapperDetector.run(properties);
    };

    return CDA;
}(CDA || {}));
