var TVP_REG = (function(TVP_REG) {
    var properties = Configurator.setup({
        wrapper: {
            selector: 'div.js-video'
        },
        button: {
            class: 'tvp_reg_download_button'
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
            return $('div.js-video').attr('data-object-id');
        }
        catch(e){
            throw new Exception(config.get('error.id'), 'Źródło: ' + $('div.js-video').get(0));
        }
    };

    TVP_REG.waitOnWrapper = function(){
        WrapperDetector.run(properties);
    };

    return TVP_REG;
}(TVP_REG || {}));
