var CYF_TVP = (function() {
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

    var properties = new TvpConfigurator('div.playerContainerWrapper', 'tvp_cyf_downlaod_button', idParser);

    this.setup = function(){
        Common.run(properties);
    };
});
