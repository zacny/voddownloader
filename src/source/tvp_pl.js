var TVP_PL = (function() {
    var idParser = function() {
        var scripts = $('script[type="text/javascript"]').filter(':not([src])');
        for (var i = 0; i < scripts.length; i++) {
            var match = $(scripts[i]).text().match(/window.__videoData\W+"_id":\s*(\d+)/m);
            if(match && match[1]){
                return match[1];
            }
        }

        throw new Exception(config.error.id, window.location.href);
    };

    var properties = new TvpConfigurator('.news-video__overlay', idParser);

    this.setup = function(){
        Common.run(properties);
    };
});