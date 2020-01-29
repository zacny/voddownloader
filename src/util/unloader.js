var Unloader = (function(Unloader) {
    var win;
    var observer;
    var url;

    Unloader.init = function(w, service){
        win = w;
        observer = (service || {}).observer;
        url = Tool.getRealUrl();
        $(window).bind('beforeunload', function(){
            if(!win.closed) {
                DomTamper.handleError(new Exception(config.error.noParent, url), win);
            }
        });
        if(observer){
            $(observer.anchor).disconnect(observer.mode, observer.selector);
        }
    };

    return Unloader;
}(Unloader || {}));
