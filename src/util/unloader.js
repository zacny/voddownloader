var Unloader = (function(Unloader) {
    var win;

    Unloader.init = function(w){
        win = w;
        $(window).bind('beforeunload', function(){
            if(!win.closed) {
                win.close();
            }
        });
    };

    return Unloader;
}(Unloader || {}));
