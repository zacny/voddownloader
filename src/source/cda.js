var CDA = (function(CDA) {
    var properties = Configurator.setup({
        wrapper: {
            selector: '#player'
        },
        button: {
            class: 'cda_download_button',
            click: function(){
                var url = $("video.pb-video-player").attr('src');
                if(url !== undefined){
                    var w = window.open();
                    w.location.href = url;
                }
                else {
                    DomTamper.handleError(CONST.video_id_error, w);
                }
            }
        }
    });

    CDA.waitOnWrapper = function(){
        WrapperDetector.run(properties);
    };

    return CDA;
}(CDA || {}));
