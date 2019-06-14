var CDA = (function(CDA) {
    var properties = Configurator.setup({
        wrapper: {
            selector: '#player'
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
                    w.location.href = url;
                }
                /** Flash pleyar - l is an existing variable on page */
                else if(l !== undefined){
                    w.location.href = l;
                }
                else {
                    throw new Exception(config.error.id, window.location.href);
                }
            }
        }catch(e){
            DomTamper.handleError(e, w);
        }
    };

    CDA.waitOnWrapper = function(){
        WrapperDetector.run(properties);
    };

    return CDA;
}(CDA || {}));
