var VideoGrabber = (function(VideoGrabber){
    var getVideoData = function(vod, templateIndex){
        var idn = vod.grabber.idParser();
        var templates = vod.grabber.urlTemplates;
        var url = templates[templateIndex].replace(/\$idn/g, idn);

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
            VideoGrabber.grabVideoData(vod, templateIndex+1, w);
        }
        else {
            throw error;
        }
    };

    VideoGrabber.grabVideoData = function(vod, templateIndex, w){
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
                    DomTamper.handleError(e, w, vod);
                }
            }, function(data){
                try {
                    tryNextUrl(vod, templateIndex, w, CONST.call_error);
                }
                catch(e){
                    DomTamper.handleError(e, w, vod);
                }
            });
        }
        catch(e){
            DomTamper.handleError(e, w, vod);
        }
    };
    return VideoGrabber;
}(VideoGrabber || {}));
