var CONFIG = (function(CONFIG) {
    var settings = {
        attempts: 10,
        attempt_timeout: 1500,
        id_error: new Exception('Nie udało się odnaleźć idetyfikatora.', 'ID_ERROR'),
        api_error: new Exception('Nie odnaleziono adresów do strumieni.', 'API_ERROR'),
        call_error: new Exception('Błąd pobierania informacji o materiale.', 'CALL_ERROR'),
        drm_error: new Exception('Materiał posiada DRM. ' +
            'Ten skrypt służy do pobierania darmowych, niezabezpieczonych materiałów.', 'DRM_ERROR'),
        timeout_error: new Exception('Zbyt długi czas odpowiedzi. Przypuszczalnie problem sieciowy.', 'TIMEOUT_ERROR')
    };

    CONFIG.get = function() {
        return settings[name];
    };

    return WrapperDetector;
}(WrapperDetector || {}));
