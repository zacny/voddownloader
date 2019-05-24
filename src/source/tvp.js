var TVP = (function(TVP) {
    var properties = Configurator.setup({
        wrapper: {
            selector: '#playerBoxContainer-x'
        },
        button: {
            class: 'tvp_downlaod_button'
        },
        grabber: {
            urlTemplates: ['https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=$idn'],
            idParser: function(){
                try {
                    var src = $('input[name="recommended_url"]').val();
                    return src.split("/").pop();
                }
                catch(e){
                    throw CONST.id_error;
                }
            },
            formatParser: function(data){
                return VOD_TVP.grabVideoFormats(data);
            }
        }
    });

    TVP.waitOnWrapper = function(){
        WrapperDetector.run(properties);
    };

    return TVP;
}(TVP || {}));
