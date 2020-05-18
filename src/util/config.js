const config = {
    attempts: 10,
    attemptTimeout: 1500,
    storage: {
        doNotWarn: 'voddownloader.doNotwarnIfIncorrectPluginSettingsDetected',
        topWindowLocation: 'voddownloader.topWindowLocation'
    },
    urlParamPattern: '#',
    urlParamDefaultKey: 'videoId',
    urlPartPattern: '~',
    include: {
        fontawesome: {
            id: 'fontawesome',
            css: 'https://use.fontawesome.com/releases/v5.8.2/css/all.css'
        },
        bootstrap: {
            id: 'bootstrap',
            css: 'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.3.1/css/bootstrap.min.css'
        },
        mdb: {
            id: 'mdb',
            css: 'https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.8.2/css/mdb.min.css',
            /*script: 'https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.8.2/js/mdb.min.js'*/
        }
    },
    error: {
        id: {
            caption: 'Nie udało się odnaleźć idetyfikatora.',
            template: Tool.template`Algorytm rozpoznawania identyfikatora wideo na stronie: ${0} \
                zakończył się niepowodzeniem. Może to oznaczać błąd skryptu lub zmiany w portalu.`,
        },
        tvnId: {
            caption: 'Nie udało się odnaleźć idetyfikatora.',
            template: Tool.template`Algorytm rozpoznawania identyfikatora wideo na stronie: ${0} \
                zakończył się niepowodzeniem.\nJeżeli jest to główna strona programu oznacza to, \
                że nie udało się odnaleźć identyfikatora ostatniego odcinka. Wejdź na stronę odcinka \
                i spróbuj ponownie.\nMoże to również oznaczać błąd skryptu lub zmiany w portalu.`,
        },
        call: {
            caption: 'Błąd pobierania informacji o materiale.',
            template: Tool.template`Wystąpił błąd w wykonaniu skryptu w kroku: ${0} na stronie: ${1} \
                Zgłoś problem autorom skryptu.`,
        },
        noSource: {
            caption: 'Nie udało się odnaleźć metadanych tego materiału.',
            template: Tool.template`Materiał ze strony ${0} nie posiada zdefiniowanych metadanych potrzebnych do \
                działania skryptu lub są one nieprawdłowe.\n
                Może to oznaczać, że nie jest to materiał publicznie dostępny, nie posiada zdefiniowanych źródeł lub nie \
                mogą one zostać wyświetlone w przeglądarce bez dodatkowego oprogramowania albo jest to materiał \
                umieszczony w płatnej strefie.`,
            type: 'info'
        },
        timeout: {
            caption: 'Zbyt długi czas odpowiedzi.',
            template: Tool.template`Dla kroku: ${0} na stronie "${1}" nie dotarły \
                informacje zwrotne.\nPrzypuszczalnie jest to problem sieciowy. Spróbuj ponownie za jakiś czas.`
        },
        noParent: {
            caption: 'Brak zakładki ze stroną główną.',
            template: Tool.template`Została zamknięta zakładka ze stroną na której został uruchomiony skrypt. \
                    Ta zakładka nie może przez to działać poprawnie. Otwórz ponownie stronę główną: \n ${0} \n
                    by przywrócić prawidłowe funkcjonowanie skryptu.`
        }
    },
    description: {
        defaults: {
            language: 'polski',
            audio:  'MPEG ACC'
        },
        sources: {
            IPLA: {
                '1080p': {video: 'H264 MPEG-4 AVC, 4011 kb/s, 1920x1080, 25fps, 16:9', index: 1},
                '720p': {video: 'H264 MPEG-4 AVC, 1672 kb/s, 1280x720, 25fps, 16:9', index: 2},
                '576p': {video: 'H264 MPEG-4 AVC, 1175 kb/s, 1024x576, 25fps, 16:9', index: 3},
                '384p': {video: 'H264 MPEG-4 AVC, 256 kb/s, 484x272, 25fps, 16:9', index: 4}
            },
            WP: {
                HQ: {video: 'H264 MPEG-4 AVC, 1804 kb/s, 1280x720, 24fps, 16:9', index: 1},
                LQ: {video: 'H264 MPEG-4 AVC, 616 kb/s, 640x360, 24fps, 16:9', index: 2}
            },
            TVN: {
                'HD': {video: 'H264 MPEG-4 AVC, 2776 kb/s, 1280x720, 25fps, 16:9', index: 1},
                'Bardzo wysoka': {video: 'H264 MPEG-4 AVC, 1786 kb/s, 1280x720, 25fps, 16:9', index: 2},
                'Wysoka': {video: 'H264 MPEG-4 AVC, 1191 kb/s, 720x576, 25fps, 5:4', index: 3},
                'Standard': {video: 'H264 MPEG-4 AVC, 794 kb/s, 720x576, 25fps, 5:4', index: 4},
                'Średnia': {video: 'H264 MPEG-4 AVC, 596 kb/s, 640x480, 25fps, 4:3', index: 5},
                'Niska': {video: 'H264 MPEG-4 AVC, 417 kb/s, 512x384, 25fps, 4:3', index: 6},
                'Bardzo niska': {video: 'H264 MPEG-4 AVC, 238 kb/s, 320x240, 25fps, 4:3', index: 7}
            },
            VOD: {
                '1080':{video: 'H264 MPEG-4 AVC, 1920x1080, 25fps, 16:9', index: 1},
                '720': {video: 'H264 MPEG-4 AVC, 1280x720, 25fps, 16:9', index: 2},
                '576': {video: 'H264 MPEG-4 AVC, 1024x576, 25fps, 16:9', index: 3},
                '480': {video: 'H264 MPEG-4 AVC, 854x480, 25fps, 16:9', index: 4},
                '360': {video: 'H264 MPEG-4 AVC, 640x360, 25fps, 16:9', index: 5},
                '240': {video: 'H264 MPEG-4 AVC, 426x240, 25fps, 16:9', index: 6}
            },
            TVP: {
                '9100000': {video: 'H264 MPEG-4 AVC, 21030 kb/s, 1920x1080, 25fps, 16:9', index: 1},
                '5420000': {video: 'H264 MPEG-4 AVC, 9875 kb/s, 1280x720, 25fps, 16:9', index: 2},
                '2850000': {video: 'H264 MPEG-4 AVC, 4661 kb/s, 960x540, 25fps, 16:9', index: 3},
                '1750000': {video: 'H264 MPEG-4 AVC, 1782 kb/s, 800x450, 25fps, 16:9', index: 4},
                '1250000': {video: 'H264 MPEG-4 AVC, 1255 kb/s, 640x360, 25fps, 16:9', index: 5},
                '820000': {video: 'H264 MPEG-4 AVC, 809 kb/s, 480x270, 25fps, 16:9', index: 6},
                '590000': {video: 'H264 MPEG-4 AVC, 581 kb/s, 398x224, 25fps, 199:112', index: 7}
            },
            ARTE: {
                '2200': {video: 'H264 MPEG-4 AVC,  2438 kb/s, 1280x720, 25fps, 16:9', index: 1},
                '1500': {video: 'H264 MPEG-4 AVC,  1619 kb/s, 720x406, 25fps, 360:203', index: 2},
                '800': {video: 'H264 MPEG-4 AVC,  805 kb/s, 640x360, 25fps, 16:9', index: 3},
                '300': {video: 'H264 MPEG-4 AVC,  357 kb/s, 384x216, 25fps, 16:9', index: 4}
            },
            NINATEKA: {
                def: {video: 'H264 MPEG-4 AVC,  900 kb/s, 640x360, 25fps, 16:9', index: 1}
            },
            CDA: {
                '1080p': {video: 'H264 MPEG-4 AVC, 1920x1080, 16:9', index: 1},
                '720p': {video: 'H264 MPEG-4 AVC, 1280x720, 16:9', index: 2},
                '480p': {video: 'H264 MPEG-4 AVC, 854x480, 427:240', index: 3},
                '360p': {video: 'H264 MPEG-4 AVC, 640x360, 16:9', index: 4},
            },
            TRWAM: {
                '360p': {video: 'H264 MPEG-4 AVC, 640x360, 16:9', index: 1}
            }
        }
    }
};

