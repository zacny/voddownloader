var TVP_REG = (function(TVP_REG) {
    var properties = Configurator.setup({
        wrapper: {
            selector: 'div.js-video'
        },
        button: {
            class: 'tvp_reg_download_button'
        },
        grabber: {
            urlTemplates: ['https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=$idn'],
            idParser: function(){
                try {
                    return $('div.js-video').attr('data-object-id');
                }
                catch(e){
                    throw CONST.video_id_error;
                }
            },
            formatParser: function(data){
                return VOD_TVP.grabVideoFormats(data);
            }
        }
    });

    TVP_REG.waitOnWrapper = function(){
        WrapperDetector.run(properties);
    };

    return TVP_REG;
}(TVP_REG || {}));
