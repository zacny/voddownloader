var VOD = (function(VOD) {
    var properties = Configurator.setup({
        wrapper: {
            selector: '#v_videoPlayer'
        },
        button: {
            class: 'vod_download_button'
        },
        grabber: {
            urlTemplates: [
                'https://player-api.dreamlab.pl/?body[id]=$idn&body[jsonrpc]=2.0&body[method]=get_asset_detail&body[params][ID_Publikacji]=$idn' +
                '&body[params][Service]=vod.onet.pl&content-type=application/jsonp&x-onet-app=player.front.onetapi.pl&callback=',
            ],
            idParser: function(){
                try {
                    var id = $(".mvp").attr('id');
                    return id.match(/mvp:(.+)/)[1];
                }
                catch(e){
                    throw(CONST.id_error);
                }
            },
            formatParser: function(data){
                var formats = [];
                var video = (((data.result || new Array())[0] || {}).formats || {}).wideo || {};
                var meta = ((data.result || new Array())[0] || {}).meta || {};
                var videoData = video['mp4-uhd'] && video['mp4-uhd'].length > 0 ? video['mp4-uhd'] : video['mp4'];
                if(videoData){
                    $.each(videoData, function( index, value ) {
                        formats.push({
                            quality: value.vertical_resolution,
                            bitrate: value.video_bitrate,
                            url: value.url
                        });
                    });
                }
                return {
                    title: meta.title,
                    formats: formats
                }
            }
        }
    });

    var isTopWindow = function(){
        return window.top === window.self;
    };

    var iplaSectionDetected = function(){
        return $('#v_videoPlayer div.pulsembed_embed').length > 0;
    };

    VOD.waitOnWrapper = function(){
        if(isTopWindow() && !iplaSectionDetected()){
            WrapperDetector.run(properties);
        }
    };

    return VOD;
}(VOD || {}));
