var TVP_PL = (function() {
    var idParser = function() {
        var scripts = $('script[type="text/javascript"]').filter(':not([src])');
        for (var i = 0; i < scripts.length; i++) {
            var match = $(scripts[i]).text().match(/GS_BASE_CONFIG\W+materialIdentifier:\s*"(\d+)"/m);
            if(match && match[1]){
                return match[1];
            }
        }

        throw new Exception(config.error.id, window.location.href);
    };

    var properties = new TvpConfigurator('#tvplayer', 'tvp_vod_downlaod_button', idParser);

    this.setup = function(){
        Common.run(properties);
    };
});