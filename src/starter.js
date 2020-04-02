var Starter = (function(Starter) {
    var sources = [
        {objectName: 'TVP', urlPattern: new RegExp(
                '^https:\/\/(vod|cyfrowa)\.tvp\.pl\/video\/.*$|' +
                '^https?:\/\/.*\.tvp\.(pl|info)\/sess\/TVPlayer2\/embed.*$|' +
                '^https?:\/\/.*\.tvp\.pl\/\\d{6,}\/.*$|' +
                '^https?:\/\/w{3}\.tvpparlament\.pl\/sess\/.*'
            )
        },
        {objectName: 'TVN', urlPattern: new RegExp('^https:\/\/(?:w{3}\.)?(?:tvn)?player\.pl\/')},
        {objectName: 'CDA', urlPattern: new RegExp('^https:\/\/.*\.cda\.pl\/')},
        {objectName: 'VOD', urlPattern: new RegExp('^https:\/\/vod.pl\/')},
        {objectName: 'VOD_IPLA', urlPattern: new RegExp(
                '^https:\/\/partner\.ipla\.tv\/embed\/|' +
                '^https:\/\/.*\.redcdn\.pl\/file\/o2\/redefine\/partner\/'
            )
        },
        {objectName: 'IPLA', urlPattern: new RegExp('^https:\/\/w{3}\.ipla\.tv\/')},
        {objectName: 'WP', urlPattern: new RegExp('^https:\/\/wideo\.wp\.pl\/')},
        {objectName: 'NINATEKA', urlPattern: new RegExp('^https:\/\/ninateka.pl\/')},
        {objectName: 'ARTE', urlPattern: new RegExp('^https:\/\/w{3}\.arte\.tv\/.*\/videos\/')},
        {objectName: 'VOD_FRAME', urlPattern: new RegExp('^https:\/\/pulsembed\.eu\/')},
        {objectName: 'TV_TRWAM', urlPattern: new RegExp('^https:\/\/tv-trwam\.pl\/local-vods\/')}
    ];

    Starter.start = function() {
        sources.some(function(source){
            if(source.urlPattern.exec(location.href)){
                var object = eval('new ' + source.objectName + '()');
                console.info('voddownloader: jQuery v' + $().jquery + ', context: ' + source.objectName);
                object.setup();
                return true;
            }
        });
    };

    return Starter;
}(Starter || {}));
