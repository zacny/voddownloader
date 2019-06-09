var config = (function(config) {
    var settings = {
        attempts: 10,
        attempt_timeout: 1500,
        fontUrl: 'https://use.fontawesome.com/releases/v5.8.2/css/all.css',
        id_error: 'Nie udało się odnaleźć idetyfikatora.',
        api_error: 'Nie odnaleziono adresów do strumieni.',
        call_error: 'Błąd pobierania informacji o materiale.',
        drm_error: 'Materiał posiada DRM. Ten skrypt służy do pobierania darmowych, niezabezpieczonych materiałów.',
        timeout_error: 'Zbyt długi czas odpowiedzi. Przypuszczalnie problem sieciowy.'
    };

    config.get = function(name) {
        return settings[name];
    };

    return config;
}(config || {}));

