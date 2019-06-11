var config = (function(config) {
    var settings = {
        attempts: 10,
        attempt_timeout: 1500,
        fontawesome: {
            css: 'https://use.fontawesome.com/releases/v5.8.2/css/all.css',
        },
        bootstrap: {
            css: 'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.3.1/css/bootstrap.min.css',
            script: 'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.3.1/js/bootstrap.min.js'
        },
        mdb: {
            css: 'https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.8.2/css/mdb.min.css',
            script: 'https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.8.2/js/mdb.min.js'
        },
        id_error: 'Nie udało się odnaleźć idetyfikatora.',
        api_error: 'Nie odnaleziono adresów do strumieni.',
        call_error: 'Błąd pobierania informacji o materiale.',
        drm_error: 'Materiał posiada DRM. Ten skrypt służy do pobierania darmowych, niezabezpieczonych materiałów.',
        timeout_error: 'Zbyt długi czas odpowiedzi. Przypuszczalnie problem sieciowy.'
    };

    config.get = function(name) {
        var nameParts = name.split('.');
        var element = settings;
        for(var i = 0; i < nameParts.length; i++){
            var element = element[nameParts[i]];
        }
        return element;
    };

    return config;
}(config || {}));

