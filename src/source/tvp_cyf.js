var CYF_TVP = (function() {
    var properties = new Configurator({
        wrapper: {
            selector: 'div.playerContainerWrapper'
        },
        button: {
            class: 'tvp_cyf_downlaod_button'
        },
        asyncChains: {
            videos: [
                new Step({
                    urlTemplates: ['https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=#videoId'],
                    beforeStep: function (input) {
                        return idParser();
                    },
                    afterStep: COMMON_SOURCE.grabTvpVideoData
                })
            ]
        }
    });

    var idParser = function(){
        var src = $('iframe#JS-TVPlayer').attr('src');
        if(src !== undefined) {
            return src.split("/").pop();
        }
        else {
            var div = $('div.playerWidget');
            if(div !== undefined){
                return div.attr('data-video-id');
            }
        }

        throw new Exception(config.error.id, window.location.href);
    };

    this.setup = function(){
        WrapperDetector.run(properties);
    };
});
