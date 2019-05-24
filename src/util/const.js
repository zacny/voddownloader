var CONST = {
    attempts: 10,
    attempt_timeout: 1500,
    id_error: new Exception('Nie udało się odnaleźć idetyfikatora.', 'ID_ERROR'),
    api_error: new Exception('Nie odnaleziono adresów do strumieni.', 'API_ERROR'),
    call_error: new Exception('Błąd pobierania informacji o materiale.', 'CALL_ERROR'),
    drm_error: new Exception('Materiał posiada DRM. ' +
        'Ten skrypt służy do pobierania darmowych, niezabezpieczonych materiałów.', 'DRM_ERROR')
};
