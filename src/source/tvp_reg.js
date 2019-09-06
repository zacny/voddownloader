var TVP_REG = (function(TVP_REG) {
    var properties = Configurator.setup({
        wrapper: {
            selector: 'div.js-video'
        },
        button: {
            class: 'tvp_reg_download_button'
        },
        asyncChains: {
            videos: [
                Step.setup({
                    urlTemplate: 'https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=#videoId',
                    beforeStep: function (input) {
                        return idParser();
                    },
                    afterStep: function (output) {
                        return VOD_TVP.grabVideoData(output);
                    }
                })
            ]
        }
    });

    var idParser = function(){
        var dataId = $('div.js-video').attr('data-object-id');
        if(dataId != undefined) {
            return dataId;
        }

        throw new Exception(config.error.id, window.location.href);
    };

    TVP_REG.waitOnWrapper = function(){
        WrapperDetector.run(properties);
    };

    return TVP_REG;
}(TVP_REG || {}));
