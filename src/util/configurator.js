function Configurator(properties){
    var service = {
        observer: {
            anchor: undefined,
            mode: 'added',
            selector: undefined
        },
        injection: {
            selector: properties.observer.selector,
            id: 'direct-download',
            class: '',
        },
        cardsData: {
            title: '',
            cards: {
                videos: {
                    icon: 'fa-video', label: 'Video', collapse: true, items: [],
                    info: [
                        {name: 'video', desc: 'video'},
                        {name: 'audio', desc: 'audio'},
                        {name: 'language', desc: 'wersja językowa'}
                    ],
                    actions: [
                        {label: 'Pobierz', icon: 'fa-download'},
                        {label: 'Kopiuj', icon: 'fa-clone'},
                        {label: 'Otwórz', icon: 'fa-film'}
                    ]
                },
                subtitles: {
                    icon: 'fa-file-alt', label: 'Napisy', collapse: false, items: [],
                    info: [
                        {name: 'description', desc: 'opis'},
                        {name: 'format', desc: 'format'}
                    ],
                    actions: [
                        {label: 'Pobierz', icon: 'fa-download'}
                    ]
                },
                streams: {
                    icon: 'fa-stream', label: 'Strumienie', collapse: false, items: [],
                    info: [
                        {name: 'description', desc: 'opis'},
                        {name: 'format', desc: 'format'}
                    ],
                    actions: [
                        {label: 'Kopiuj', icon: 'fa-clone'}
                    ]
                }
            }
        },
        chains: {
            videos: []
        },
        chainSelector: function(){
            return ['videos'];
        },
        formatter: function(data){
            data.cards['videos'].items.sort(function (a, b) {
                return a.index - b.index;
            });
            data.cards['subtitles'].items.sort(function (a, b) {
                return ('' + a.format).localeCompare(b.format);
            });
            data.cards['streams'].items.sort(function (a, b) {
                return ('' + a.format).localeCompare(b.format);
            });
        },
        aggregate: function(data){
            var aggregatedData = $.extend(true, {}, service.cardsData);
            var chains = service.chainSelector();
            chains.forEach(function(chain){
                var extend = data[chain][data[chain].length - 1].after;
                $.extend(true, aggregatedData, extend);
            });
            return aggregatedData;
        },
        onDone: function(data, w) {
            var aggregatedData = service.aggregate(data);
            service.formatter(aggregatedData);
            DomTamper.createDocument(aggregatedData, w);
        },
        ready: function(){
            return $(service.observer.selector).length > 0;
        },
        click: function(){
            var chainNames = service.chainSelector();
            Executor.chain(service, {
                stepIndex: 0,
                chainIndex: 0,
                retries: 0,
                chainNames: chainNames
            });
        },
        inject: function(){
            var icon = $('<i>').addClass('fas fa-video')
            var div = $('<div>')
                .attr('id', service.injection.id).attr('title', 'informacje o wideo')
                .append(icon).addClass('video_button').addClass(service.injection.class);
            $(service.observer.selector).hover(() => div.show(), () => div.hide());
            return div;
        },
    };

    return $.extend(true, service, properties);
}
