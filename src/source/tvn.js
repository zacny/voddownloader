var TVN = (function() {
    var properties = new Configurator({
        wrapper: {
            selector: '#player-container'
        },
        button: {
            class: 'btn btn-primary tvn_download_button'
        },
        asyncChains: {
            videos: [
                new Step({
                    urlTemplate: '/api/?platform=ConnectedTV&terminal=Panasonic&format=json' +
                        '&authKey=064fda5ab26dc1dd936f5c6e84b7d3c2&v=3.1&m=getItem&id=#videoId',
                    beforeStep: function(input){
                        return idParser();
                    },
                    afterStep: function(output) {
                        return grabVideoData(output);
                    }
                })
            ]
        },
        formatter: function(data){
            var sortingOrder = {
                'HD': 7,
                'Bardzo wysoka': 6,
                'Wysoka': 5,
                'Standard': 4,
                'Średnia': 3,
                'Niska': 2,
                'Bardzo niska': 1
            };

            data.cards['videos'].items.sort(function (a, b) {
                return sortingOrder[b.quality] - sortingOrder[a.quality];
            });
        }
    });

    var idParser = function(){
        var watchingNow = $('.watching-now').closest('.embed-responsive').find('.embed-responsive-item');
        if(watchingNow.length > 0){
            return watchingNow.attr('href').split(',').pop();
        }

        return episodeIdParser();
    };

    var episodeIdParser = function () {
        var match = window.location.href.match(/odcinki,(\d+)\/.*,(\d+)/);
        if(match && match[2]){
            return match[2];
        }

        return serialIdParser();
    };

    var serialIdParser = function () {
        var match = window.location.href.match(/odcinki,(\d+)/);
        if(match && match[1]){
            throw new Exception(config.error.tvnId, Tool.getRealUrl());
        }

        return vodIdParser();
    };

    var vodIdParser = function(){
        var match = window.location.href.match(/,(\d+)/);
        if(match && match[1]){
            return match[1];
        }

        throw new Exception(config.error.tvnId, Tool.getRealUrl());
    };

    var grabVideoData = function(data){
        var items = [];
        var main = ((data.item || {}).videos || {}).main || {};
        var video_content = main.video_content || {};
        if(main.video_content_license_type !== 'WIDEVINE' && video_content && video_content.length > 0){
            $.each(video_content, function( index, value ) {
                items.push(new Format({
                    quality: value.profile_name,
                    url: value.url
                }));
            });

            return {
                title: getTitle(data),
                cards: {videos: {items: items}}
            }
        }
        throw new Exception(config.error.noSource, Tool.getRealUrl());
    };

    var getTitle = function(data){
        var title = data.item.episode != null ? 'E'+data.item.episode : '';
        title = data.item.season != null ? 'S'+data.item.season + title : title;
        if(data.item.serie_title != null){
            title = data.item.serie_title + (title != '' ? ' - ' + title : '');
        }
        return title;
    };

    var inVodFrame = function(){
        var regexp = new RegExp('https:\/\/player\.pl(.*)');
        var match = regexp.exec(window.location.href);
        if(match[1]) {
            window.sessionStorage.setItem(config.storage.topWindowLocation, 'https://vod.pl' + match[1]);
        }
    };

    this.setup = function(){
        if(!Tool.isTopWindow()) {
            inVodFrame();
        }

        WrapperDetector.run(properties, this.setup);
    };
});
