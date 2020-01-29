var Starter = (function(Starter) {
    var sources = [
        {objectName: 'VOD_TVP', urlPattern: /^https:\/\/vod\.tvp\.pl\/video\/|^https?:\/\/.*\.tvp.pl\/sess\/TVPlayer2\/embed.*$/},
        {objectName: 'CYF_TVP', urlPattern: /^https:\/\/cyfrowa\.tvp\.pl\/video\//},
        {objectName: 'TVN', urlPattern: /^https:\/\/(?:w{3}\.)?(?:tvn)?player\.pl\//},
        {objectName: 'CDA', urlPattern: /^https:\/\/.*\.cda\.pl\//},
        {objectName: 'VOD', urlPattern: /^https:\/\/vod.pl\//},
        {objectName: 'VOD_IPLA', urlPattern: /^https:\/\/partner\.ipla\.tv\/embed\/|^https:\/\/.*\.redcdn.pl\/file\/o2\/redefine\/partner\//},
        {objectName: 'IPLA', urlPattern: /^https:\/\/www\.ipla\.tv\//},
        {objectName: 'WP', urlPattern: /^https:\/\/wideo\.wp\.pl\//},
        {objectName: 'NINATEKA', urlPattern: /^https:\/\/ninateka.pl\//},
        {objectName: 'ARTE', urlPattern: /^https:\/\/www.arte.tv\/.*\/videos\//},
        {objectName: 'VOD_FRAME', urlPattern: /^https:\/\/pulsembed\.eu\//},
        {objectName: 'TV_TRWAM', urlPattern: /^https:\/\/tv-trwam.pl\/local-vods\//}
    ];

    Starter.start = function() {
        sources.some(function(source){
            if(location.href.match(source.urlPattern)){
                var object = eval('new ' + source.objectName + '()');
                console.info('voddownloader: jQuery v' + $().jquery + ', context: ' + source.objectName);
                object.setup();
                return true;
            }
        });
    };

    return Starter;
}(Starter || {}));
