const config = {
    attempts: 10,
    attemptTimeout: 1500,
    storageItem: 'voddownloader.doNotwarnIfIncorrectPluginSettingsDetected',
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
    },
    error: {
        id: {
            caption: 'Nie udało się odnaleźć idetyfikatora.',
            template: Tool.template`Algorytm rozpoznawania identyfikatora wideo na stronie: '${0}' 
                zakończył się niepowodzeniem.\nMoże to oznaczać błąd skryptu.`,
        },
        tvnId: {
            caption: 'Nie udało się odnaleźć idetyfikatora.',
            template: Tool.template`Algorytm rozpoznawania identyfikatora wideo na stronie: '${0}' 
                zakończył się niepowodzeniem.\nJeżeli jest to główna strona programu oznacza to, 
                że nie udało się odnaleźć identyfikatora ostatniego odcinka. Wejdź na stronę odcinka 
                i spróbuj ponownie.\nMoże to również oznaczać błąd skryptu.`,
        },
        cdnId: {
            caption: 'Nie udało się odnaleźć idetyfikatora.',
            template: Tool.template`Algorytm rozpoznawania identyfikatora wideo na stronie: '${0}' 
                zakończył się niepowodzeniem. Upewnij się, że html5 player jest włączony.\n
                Może to oznaczać błąd skryptu.`,
        },
        api: {
            caption: 'Nie odnaleziono adresów do strumieni.',
            template: Tool.template`Błąd przetwarzania odpowiedzi asynchronicznej dla kroku z indeksem: ${0} 
                na stronie: '${1}'\nZgłoś problem autorom skryptu.`,
        },
        call: {
            caption: 'Błąd pobierania informacji o materiale.',
            template: Tool.template`Błąd w wykonaniu kroku asynchronicznego z indeksem: ${0} na stronie: '${1}'\n
                Zgłoś problem autorom skryptu.`,
        },
        drm: {
            caption: 'Materiał posiada DRM.',
            template: Tool.template`Ten skrypt służy do pobierania darmowych, niezabezpieczonych materiałów. 
                Materiał ze strony: '${0}' nie jest publicznie dostępny.`,
        },
        timeout: {
            caption: 'Zbyt długi czas odpowiedzi.',
            template: Tool.template`Dla kroku asychronicznego z indeksem: ${0} na stronie '${1}' nie dotarły 
                informacje zwrotne.\nPrzypuszczalnie jest to problem sieciowy. Spróbuj ponownie za jakiś czas.`
        }
    }
};

