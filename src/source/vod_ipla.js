var VOD_IPLA = (function(VOD_IPLA) {
    var properties = Configurator.setup({
        wrapper: {
            selector: '#player-wrapper'
        },
        button: {
            class: 'vod_ipla_downlaod_button'
        },
        asyncSteps: [
            AsyncStep.setup({
                urlTemplates: 'https://getmedia.redefine.pl/vods/get_vod/?cpid=1&ua=www_iplatv_html5/12345' +
                    '&media_id=$videoId',
                beforeStep: function(input){
                    return idParser();
                },
                afterStep: function(output) {
                    return IPLA.grabVideoFormats(output);
                }
            })
        ]
    });

    var idParser = function(){
        try {
            var match = $('script:not(:empty)').text().match(/(window\.CP\.embedSetup\()(.*)\);/);
            var jsonObject = JSON.parse(match[2]);
            return JSON.parse(jsonObject[0].media).result.mediaItem.id;
        }
        catch(e){
            throw(CONST.id_error);
        }
    };

    VOD_IPLA.waitOnWrapper = function(){
        WrapperDetector.run(properties);
    };

    return VOD_IPLA;
}(VOD_IPLA || {}));
