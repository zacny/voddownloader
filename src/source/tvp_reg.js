var TVP_REG = (function() {
    var properties = new Configurator({
        wrapper: {
            selector: 'div.js-video'
        },
        button: {
            class: 'tvp_reg_download_button'
        },
        asyncChains: {
            videos: [
                new Step({
                    urlTemplate: 'https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=#videoId',
                    beforeStep: function (input) {
                        return idParser();
                    },
                    afterStep: COMMON_SOURCE.grabTvpVideoData
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

    this.setup = function(){
        WrapperDetector.run(properties);
    };
});
