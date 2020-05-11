var HistoryTamper = (function(HistoryTamper){
    HistoryTamper.onLocationChange = function(locationChangeCallback){
        history.pushState = ( f => function pushState(){
            var ret = f.apply(this, arguments);
            window.dispatchEvent(new Event('pushstate'));
            window.dispatchEvent(new Event('locationchange'));
            return ret;
        })(history.pushState);

        history.replaceState = ( f => function replaceState(){
            var ret = f.apply(this, arguments);
            window.dispatchEvent(new Event('replacestate'));
            window.dispatchEvent(new Event('locationchange'));
            return ret;
        })(history.replaceState);

        window.addEventListener('popstate',()=>{
            window.dispatchEvent(new Event('locationchange'))
        });

        window.addEventListener('locationchange', function(){
            locationChangeCallback();
        });
    };

    return HistoryTamper;
}(HistoryTamper || {}));
