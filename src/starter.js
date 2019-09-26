var Starter = (function(Starter) {
    var tvZones = [
        'bialystok', 'katowice', 'lodz', 'rzeszow', 'bydgoszcz', 'kielce', 'olsztyn', 'szczecin',
        'gdansk', 'krakow', 'opole', 'warszawa', 'gorzow', 'lublin', 'poznan', 'wroclaw'
    ];

    var sources = [
        {objectName: 'VOD_TVP', urlPattern: /^https:\/\/vod\.tvp\.pl\/video\//},
        {objectName: 'CYF_TVP', urlPattern: /^https:\/\/cyfrowa\.tvp\.pl\/video\//},
        {objectName: 'TVP_REG', urlPattern: new RegExp('^https:\/\/(' + tvZones.join('|') + ')\.tvp\.pl\/\\d{6,}\/')},
        {objectName: 'TVN', urlPattern: /^https:\/\/(?:w{3}\.)?(?:tvn)?player\.pl\//},
        {objectName: 'CDA', urlPattern: /^https:\/\/.*\.cda\.pl\//},
        {objectName: 'VOD', urlPattern: /^https:\/\/vod.pl\//},
        {objectName: 'VOD_IPLA', urlPattern: /^https:\/\/partner\.ipla\.tv\/embed\/|^https:\/\/.*\.redcdn.pl\/file\/o2\/redefine\/partner\//},
        {objectName: 'IPLA', urlPattern: /^https:\/\/www\.ipla\.tv\//},
        {objectName: 'WP', urlPattern: /^https:\/\/video\.wp\.pl\//},
        {objectName: 'NINATEKA', urlPattern: /^https:\/\/ninateka.pl\//},
        {objectName: 'ARTE', urlPattern: /^https:\/\/www.arte.tv\/.*\/videos\//},
        {objectName: 'VOD_FRAME', urlPattern: /^https:\/\/pulsembed\.eu\//}
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
