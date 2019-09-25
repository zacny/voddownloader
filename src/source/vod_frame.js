var VOD_FRAME = (function() {
    this.setup = function(){
        var callback = function(data) {
            var src = 'https://redir.atmcdn.pl';
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
        };
        MessageReceiver.awaitMessage({
            origin: 'https://vod.pl',
            windowReference: window.parent
        }, callback);
    };
});
