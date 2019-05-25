var Starter = (function(Starter) {
    var matcher = [
        {action: VOD_TVP.waitOnWrapper, pattern: /^https:\/\/vod\.tvp\.pl\//},
        {action: CYF_TVP.waitOnWrapper, pattern: /^https:\/\/cyfrowa\.tvp\.pl\//},
        {action: TVP.waitOnWrapper, pattern: /^http:\/\/www\.tvp\.pl\//},
        {action: TVP_REG.waitOnWrapper,
            pattern: /^https:\/\/(bialystok|katowice|lodz|rzeszow|bydgoszcz|kielce|olsztyn|szczecin|gdansk|krakow|opole|warszawa|gorzow|lublin|poznan|wroclaw)\.tvp\.pl\//},
        {action: TVN.waitOnWrapper, pattern: /^https:\/\/(?:w{3}\.)?(?:tvn)?player\.pl\//},
        {action: CDA.waitOnWrapper, pattern: /^https:\/\/www\.cda\.pl\//},
        {action: VOD.waitOnWrapper, pattern: /^https:\/\/vod\.pl\//},
        {action: VOD_IPLA.waitOnWrapper, pattern: /^https:\/\/.*\.redcdn.pl\/file\/o2\/redefine\/partner\//},
        {action: IPLA.waitOnWrapper, pattern: /^https:\/\/www\.ipla\.tv\//},
        {action: APIVOD_TVP.parseJson, patter: /^https:\/\/apivod\.tvp\.pl\/tv\/video\//},
        {action: WP.waitOnWrapper, patter: /^https:\/\/video\.wp\.pl\//}
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
