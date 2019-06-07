var CYF_TVP = (function(CYF_TVP) {
    var properties = Configurator.setup({
        wrapper: {
            selector: 'div.playerContainerWrapper'
        },
        button: {
            class: 'video-block__btn tvp_cyf_downlaod_button'
        },
        asyncChains: {
            default: [
                AsyncStep.setup({
                    urlTemplate: 'https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=#videoId',
                    beforeStep: function (input) {
                        return idParser();
                    },
                    afterStep: function (output) {
                        return VOD_TVP.grabVideoFormats(output);
                    }
                })
            ]
        }
    });

    var idParser = function(){
        try {
            var src = $('iframe#JS-TVPlayer').attr('src');
            return src.split("/").pop();
        }
        catch(e){
            throw new Exception(CONFIG.get('id_error', 'Źródło: ' + src));
        }
    };

    CYF_TVP.waitOnWrapper = function(){
        WrapperDetector.run(properties);
    };

    return CYF_TVP;
}(CYF_TVP || {}));
