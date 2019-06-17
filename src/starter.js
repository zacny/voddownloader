var Starter = (function(Starter) {
    var tvZones = [
        'bialystok', 'katowice', 'lodz', 'rzeszow', 'bydgoszcz', 'kielce', 'olsztyn', 'szczecin',
        'gdansk', 'krakow', 'opole', 'warszawa', 'gorzow', 'lublin', 'poznan', 'wroclaw'
    ];

    var matcher = [
        {action: VOD_TVP.waitOnWrapper, pattern: /^https:\/\/vod\.tvp\.pl\/video\//},
        {action: CYF_TVP.waitOnWrapper, pattern: /^https:\/\/cyfrowa\.tvp\.pl\/video\//},
        {action: TVP_REG.waitOnWrapper, pattern: new RegExp('^https:\/\/(' + tvZones.join('|') + ')\.tvp\.pl\/\\d{6,}\/')},
        {action: TVN.waitOnWrapper, pattern: /^https:\/\/(?:w{3}\.)?(?:tvn)?player\.pl\//},
        {action: CDA.waitOnWrapper, pattern: /^https:\/\/www\.cda\.pl\//},
        {action: VOD.waitOnWrapper, pattern: /^https:\/\/vod.pl\//},
        {action: VOD_IPLA.waitOnWrapper, pattern: /^https:\/\/.*\.redcdn.pl\/file\/o2\/redefine\/partner\//},
        {action: IPLA.waitOnWrapper, pattern: /^https:\/\/www\.ipla\.tv\//},
        {action: WP.waitOnWrapper, pattern: /^https:\/\/video\.wp\.pl\//},
        {action: NINATEKA.waitOnWrapper, pattern: /^https:\/\/ninateka.pl\//}
    ];

    Starter.start = function() {
        matcher.some(function(item){
            if(location.href.match(item.pattern)){
                item.action();
                return true;
            }
        });
    };

    return Starter;
}(Starter || {}));
