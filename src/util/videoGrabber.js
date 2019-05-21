var VideoGrabber = (function(VideoGrabber){
    var getVideoData = function(url, w){
        return $.ajax({
            url: url,
            method: 'GET',
            dataType: 'json'
        });
    };

    VideoGrabber.grabVideoData = function(vod, templateIndex, w){
        try {
            var idn = vod.grabber.idParser();
            var templates = vod.grabber.urlTemplates;
            var url = templates[templateIndex].replace(/\$idn/g, idn);
            w = (w === undefined) ? window.open(): w;
            console.log(url);
            getVideoData(url, w).then(function(data){
                try {
                    var formatData = vod.grabber.formatParser(data);
                    if(formatData && formatData.formats.length == 0){
                        throw CONST.api_structure_error;
                    }
                    DomTamper.createDocument(formatData, w);
                }
                catch(e){
                    DomTamper.handleError(e, w);
                }
            }, function(data){
                if(templates[templateIndex+1] !== undefined) {
                    VideoGrabber.grabVideoData(vod, templateIndex+1, w);
                }
                else {
                    DomTamper.handleError(CONST.call_error, w);
                }
            });
        }
        catch(e){
            DomTamper.handleError(e, w);
        }
    };
    return VideoGrabber;
}(VideoGrabber || {}));
