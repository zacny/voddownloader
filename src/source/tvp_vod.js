var VOD_TVP = (function() {
    var idParser = function() {
        var src = $(properties.observer.selector).attr('data-video-id');
        if(src !== undefined){
            return {
                videoId: src.split("/").pop()
            };
        }

        throw new Exception(config.error.id, window.location.href);
    };
    /**                                   vod.tvp.pl             *.tvp.pl **/
    var properties = new TvpConfigurator('#JS-TVPlayer2-Wrapper, #player2', 'tvp_vod_downlaod_button', idParser);

    this.setup = function(){
        Common.run(properties);
    };
});
