var VOD_IPLA = (function(VOD_IPLA) {
    var properties = Configurator.setup({
        wrapper: {
            selector: '#player-wrapper'
        },
        button: {
            class: 'vod_ipla_downlaod_button'
        },
        grabber: {
            urlTemplates: ['https://getmedia.redefine.pl/vods/get_vod/?cpid=1&ua=www_iplatv_html5/12345&media_id=$idn'],
            idParser: function(){
                try {
                    var match = $('script:not(:empty)').text().match(/(window\.CP\.embedSetup\()(.*)\);/);
                    var jsonObject = JSON.parse(match[2]);
                    return JSON.parse(jsonObject[0].media).result.mediaItem.id;
                }
                catch(e){
                    throw(CONST.video_id_error);
                }
            },
            formatParser: function(data){
                return IPLA.grabVideoFormats(data);
            }
        }
    });

    VOD_IPLA.waitOnWrapper = function(){
        WrapperDetector.run(properties);
    };

    return VOD_IPLA;
}(VOD_IPLA || {}));
