var VOD_FRAME = (function() {
    this.setup = function(){
        var callback = function(data) {
            var srcArray = ['https://redir.atmcdn.pl', 'https://partner.ipla.tv'];
            setupDetector(srcArray, data);
        };
        MessageReceiver.awaitMessage({
            origin: 'https://vod.pl',
            windowReference: window.parent
        }, callback);
    };

    var setupDetector = function(srcArray, data){
        var selectors = createArrySelectors(srcArray);
        var multiSelector = createMultiSelector(selectors);
        var properties = Common.createProperties('div.iplaContainer', multiSelector);

        ElementDetector.detect(properties, function() {
            selectors.forEach(function(element){
                if($(element.frameSelector).length > 0){
                    MessageReceiver.postUntilConfirmed({
                        windowReference: $(element.frameSelector).get(0).contentWindow,
                        origin: element.src,
                        message: {
                            location: data.location
                        }
                    });
                }
            });
        });
    };

    var createArrySelectors = function(srcArray){
        return jQuery.map(srcArray, function(src) {
            return {
                src: src,
                frameSelector: 'iframe[src^="' + src + '"]'
            }
        });
    };

    var createMultiSelector = function(selectors){
        return $.map(selectors, function(src){
            return src.frameSelector
        }).join(', ');
    }
});
