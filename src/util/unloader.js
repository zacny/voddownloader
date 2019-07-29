var Unloader = (function(Unloader) {
    var win;
    var url;

    Unloader.init = function(w){
        win = w;
        url = window.location.href;
        $(window).bind('beforeunload', function(){
            if(!win.closed) {
                DomTamper.handleError(new Exception(config.error.noParent, url), win);
            }
        });
    };

    return Unloader;
}(Unloader || {}));
