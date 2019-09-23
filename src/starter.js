var Starter = (function(Starter) {
    var tvZones = [
        'bialystok', 'katowice', 'lodz', 'rzeszow', 'bydgoszcz', 'kielce', 'olsztyn', 'szczecin',
        'gdansk', 'krakow', 'opole', 'warszawa', 'gorzow', 'lublin', 'poznan', 'wroclaw'
    ];

    var sources = [
        {action: VOD_TVP.waitOnWrapper, pattern: /^https:\/\/vod\.tvp\.pl\/video\//},
        {action: CYF_TVP.waitOnWrapper, pattern: /^https:\/\/cyfrowa\.tvp\.pl\/video\//},
        {action: TVP_REG.waitOnWrapper, pattern: new RegExp('^https:\/\/(' + tvZones.join('|') + ')\.tvp\.pl\/\\d{6,}\/')},
        {action: TVN.waitOnWrapper, pattern: /^https:\/\/(?:w{3}\.)?(?:tvn)?player\.pl\//},
        {action: CDA.waitOnWrapper, pattern: /^https:\/\/.*\.cda\.pl\//},
        {action: VOD.waitOnWrapper, pattern: /^https:\/\/vod.pl\//},
        {action: VOD_IPLA.waitOnWrapper, pattern: /^https:\/\/.*\.redcdn.pl\/file\/o2\/redefine\/partner\//},
        {action: IPLA.waitOnWrapper, pattern: /^https:\/\/www\.ipla\.tv\//},
        {action: WP.waitOnWrapper, pattern: /^https:\/\/video\.wp\.pl\//},
        {action: NINATEKA.waitOnWrapper, pattern: /^https:\/\/ninateka.pl\//},
        {action: ARTE.waitOnWrapper, pattern: /^https:\/\/www.arte.tv\/.*\/videos\//},
        {action: VOD_FRAME.setup, pattern: /^https:\/\/pulsembed\.eu\//}
    ];

    Starter.start = function() {
        sources.some(function(source){
            if(location.href.match(source.pattern)){
                source.action();
                return true;
            }
        });
    };

    return Starter;
}(Starter || {}));
