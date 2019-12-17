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
                    urlTemplate: 'https://vod.tvp.pl/sess/TVPlayer2/api.php?id=#videoId&@method=getTvpConfig' +
                        '&@callback=callback',
                    responseType: 'jsonp',
                    beforeStep: function (input) {
                        return idParser();
                    },
                    afterStep: COMMON_SOURCE.grapTvpVideoData
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
