var VideoGrabber = (function(VideoGrabber){
    var getVideoData = function(vod, templateIndex){
        var url = getUrl(vod, templateIndex);

        console.log("GET: " + url);
        return $.ajax({
            method: 'GET',
            dataType: 'json',
            url: url
        });
    };

    var tryNextUrl = function(vod, templateIndex, w, error){
        var templates = vod.grabber.urlTemplates;
        if(templates[templateIndex+1] !== undefined) {
            VideoGrabber.grabVideoDataAsync(vod, templateIndex+1, w);
        }
        else {
            throw error;
        }
    };

    var getUrl = function(vod,templateIndex) {
        var idn = vod.grabber.idParser();
        var templates = vod.grabber.urlTemplates;
        return templates[templateIndex].replace(/\$idn/g, idn);
    };

    var getJson = function(vod, templateIndex){
        var idn = vod.grabber.idParser();
        var templates = vod.grabber.urlTemplates;
        var url = templates[templateIndex].replace(/\$idn/g, idn);
    };

    VideoGrabber.grabVideoDataFromJson = function(vod, templateIndex, w){
        w = (w === undefined) ? window.open(): w;
        var url = getUrl(vod, templateIndex);
        return DomTamper.createIframe(url, w);
    };

    VideoGrabber.grabVideoDataAsync = function(vod, templateIndex, w){
        try {
            w = (w === undefined) ? window.open(): w;
            getVideoData(vod, templateIndex).then(function(data){
                try {
                    var formatData = vod.grabber.formatParser(data);
                    if(formatData && formatData.formats.length == 0){
                        tryNextUrl(vod, templateIndex, w, CONST.api_error);
                    }
                    else {
                        DomTamper.createDocument(formatData, w);
                    }
                }
                catch(e){
                    DomTamper.handleError(e, vod, w);
                }
            }, function(data){
                try {
                    tryNextUrl(vod, templateIndex, w, CONST.call_error);
                }
                catch(e){
                    DomTamper.handleError(e, vod, w);
                }
            });
        }
        catch(e){
            DomTamper.handleError(e, vod, w);
        }
    };
    return VideoGrabber;
}(VideoGrabber || {}));
