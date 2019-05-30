var CONFIG = (function(CONFIG) {
    var settings = {
        attempts: 10,
        attempt_timeout: 1500,
        id_error: 'Nie udało się odnaleźć idetyfikatora.',
        api_error: 'Nie odnaleziono adresów do strumieni.',
        call_error: 'Błąd pobierania informacji o materiale.',
        drm_error: 'Materiał posiada DRM. Ten skrypt służy do pobierania darmowych, niezabezpieczonych materiałów.',
        timeout_error: 'Zbyt długi czas odpowiedzi. Przypuszczalnie problem sieciowy.'
    };

    CONFIG.get = function(name) {
        return settings[name];
    };

    return CONFIG;
}(CONFIG || {}));

