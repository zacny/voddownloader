var config = (function(config) {
    var settings = {
        attempts: 10,
        attemptTimeout: 1500,
        storageItem: 'voddownloader.doNotwarnIfIncorrectPluginSettingsDetected',
        fontawesome: {
            css: 'https://use.fontawesome.com/releases/v5.8.2/css/all.css'
        },
        bootstrap: {
            css: 'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.3.1/css/bootstrap.min.css'
        },
        mdb: {
            css: 'https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.8.2/css/mdb.min.css',
            /*script: 'https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.8.2/js/mdb.min.js'*/
        },
        error: {
            id: 'Nie udało się odnaleźć idetyfikatora.',
            api: 'Nie odnaleziono adresów do strumieni.',
            call: 'Błąd pobierania informacji o materiale.',
            drm: 'Materiał posiada DRM. Ten skrypt służy do pobierania darmowych, niezabezpieczonych materiałów.',
            timeout: 'Zbyt długi czas odpowiedzi. Przypuszczalnie problem sieciowy.'
        }
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

