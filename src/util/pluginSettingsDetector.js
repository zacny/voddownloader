var PluginSettingsDetector = (function(PluginSettingsDetector){
    var prepareWarningNotification = function(w) {
        var bodyContent = $('<div>')
            .append('Twój dodatek ma nieprawidłowe ustawienia, przez co nie możesz korzystać z opcji ')
            .append('bezpośredniego pobierania plików. Możesz skorygować je w następujący sposób:');
        var list = $('<ol>').addClass('m-0')
            .append($('<li>').text('Otwórz Panel sterowania Tampermonkey i kliknij ustawienia.'))
            .append($('<li>').text('Ogólne > Tryb konfiguracji > Expert'))
            .append($('<li>').text('Pobieranie BETA > Tryb pobierania > API przeglądarki'))
            .append($('<li>').text('Zapisz ustawienia, a jeżeli przeglądarka zapyta o możliwość zarządzania' +
                ' pobieranymi plikami, należy się zgodzić'));
        bodyContent.append(list).append(createButton(w));
        var options = {title: 'Wykryto problem', content: bodyContent, special: true};
        Notification.show(options, w);
    };

    var createButton = function(w){
        return $('<button>').attr('type', 'button').addClass('btn btn-dark btn-sm m-1 pl-3 pr-3')
            .append($('<i>').addClass('fas pr-1 fa-window-close')).append('Nie pokazuj więcej').click(function(){
                var rootElement = $(w.document.body);
                w.localStorage.setItem(config.storageItem, true);
                $('.toast.special-color', rootElement).toast('hide');
                setTimeout(function(){
                    $('.toast.special-color', rootElement).remove();
                }, 1000);
            });
    };

    var disableDownload = function(w){
        var rootElement = $(w.document.body);
        $('.fa-save', rootElement).closest('button').attr('disabled', true);
    };

    PluginSettingsDetector.detect = function(w){
        var downloadMode = GM_info.downloadMode;
        if(downloadMode !== 'browser'){
            disableDownload(w);
            var value = w.localStorage.getItem(config.storageItem);
            console.log('[' + config.storageItem + ']: ' + value);
            if(value !== 'true'){
                prepareWarningNotification(w);
            }
        }
    };
    return PluginSettingsDetector;
}(PluginSettingsDetector || {}));
