var VOD_FRAME = (function() {
    this.setup = function(){
        var callback = function(data) {
            setupDetector('https://redir.atmcdn.pl', data);
            setupDetector('https://partner.ipla.tv', data);
        };
        MessageReceiver.awaitMessage({
            origin: 'https://vod.pl',
            windowReference: window.parent
        }, callback);
    };

    var setupDetector = function(src, data){
        var frameSelector = 'iframe[src^="' + src + '"]';

        ElementDetector.detect(frameSelector, function () {
            MessageReceiver.postUntilConfirmed({
                windowReference: $(frameSelector).get(0).contentWindow,
                origin: src,
                message: {
                    location: data.location
                }
            });
        });
    }
});
