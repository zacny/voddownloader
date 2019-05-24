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
            if (url !== undefined) {
                w.location.href = url;
            } else {
                throw CONST.id_error;
            }
        }catch(e){
            DomTamper.handleError(e, w, properties);
        }
    };

    CDA.waitOnWrapper = function(){
        WrapperDetector.run(properties);
    };

    return CDA;
}(CDA || {}));
