var CYF_TVP = (function(CYF_TVP) {
    var properties = Configurator.setup({
        wrapper: {
            selector: 'div.playerContainerWrapper'
        },
        button: {
            class: 'video-block__btn tvp_cyf_downlaod_button'
        },
        grabber: {
            urlTemplates: ['https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=$idn'],
            idParser: function(){
                try {
                    var src = $('iframe#JS-TVPlayer').attr('src');
                    return src.split("/").pop();
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

    CYF_TVP.waitOnWrapper = function(){
        WrapperDetector.run(properties);
    };

    return CYF_TVP;
}(CYF_TVP || {}));
