// ==UserScript==
// @name           voddownloader
// @version        5.7.0-develop
// @description    Skrypt służący do pobierania materiałów ze znanych serwisów VOD.
//                 Działa poprawnie tylko z rozszerzeniem Tampermonkey.
//                 Cześć kodu pochodzi z:
//                 miniskrypt.blogspot.com,
//                 miniskrypt.hubaiitv.pl
// @author         Przmus, zacny
// @namespace      http://www.ipla.tv/
// @source         https://github.com/zacny/voddownloader
// @include        https://vod.tvp.pl/video/*
// @include        /^https://(bialystok|katowice|lodz|rzeszow|bydgoszcz|kielce|olsztyn|szczecin|gdansk|krakow|opole|warszawa|gorzow|lublin|poznan|wroclaw).tvp.pl/\d{6,}/
// @include        https://cyfrowa.tvp.pl/video/*
// @include        https://www.ipla.tv/*
// @include        https://player.pl/*
// @include        https://www.cda.pl/*
// @include        https://vod.pl/*
// @include        https://redir.atmcdn.pl/*
// @include        https://*.redcdn.pl/file/o2/redefine/partner/*
// @include        https://video.wp.pl/*
// @exclude        https://vod.pl/playerpl*
// @exclude        http://www.tvp.pl/sess/*
// @exclude        https://www.cda.pl/iframe/*
// @grant          GM_getResourceText
// @grant          GM_xmlhttpRequest
// @grant          GM_download
// @grant          GM_setClipboard
// @grant          GM_info
// @connect        tvp.pl
// @connect        getmedia.redefine.pl
// @connect        player-api.dreamlab.pl
// @run-at         document-end
// @require        https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @require        https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.3.1/js/bootstrap.min.js
// @require        http://localhost:5011/lib/js/mdb-with-waves-patch.js
// @resource       buttons_css http://localhost:5011/lib/css/voddownloader-buttons.css
// @resource       content_css http://localhost:5011/lib/css/voddownloader-content.css
// ==/UserScript==

(function vodDownloader($) {
    'use strict';

    function Exception(error, ...templateParams) {
	    this.error = error;
	    this.templateParams = templateParams;
	}
	
	var Tool = (function(Tool) {
	    Tool.deleteParametersFromUrl = function(url){
	        return decodeURIComponent(url.replace(/\?.*/,''));
	    };
	
	    Tool.getUrlParameter = function(paramName, url){
	        var results = new RegExp('[\?&]' + paramName + '=([^&#]*)').exec(url);
	        if (results==null) {
	            return null;
	        }
	        return decodeURIComponent(results[1]) || 0;
	    };
	
	    Tool.numberModeSort = function(formats){
	        formats.sort(function (a, b) {
	            return b.bitrate - a.bitrate;
	        });
	    };
	
	    Tool.formatConsoleMessage = function(message, params){
	        console.log.apply(this, $.merge([message], params));
	    };
	
	    Tool.downloadFile = function(fileUrl, title){
	        var extension = Tool.deleteParametersFromUrl(fileUrl.split('.').pop());
	        var title = (title !== undefined && title !== '' ) ? title : 'nieznany';
	        var name = title + '.' + extension;
	        GM_download(fileUrl, name);
	    };
	
	    Tool.template = function(templates, ...keys){
	        return (function(...values) {
	            var dict = values[values.length - 1] || {};
	            var result = [templates[0]];
	            keys.forEach(function(key, i) {
	                var value = Number.isInteger(key) ? values[key] : dict[key];
	                result.push(value, templates[i + 1]);
	            });
	            return result.join('');
	        });
	    };
	
	    return Tool;
	}(Tool || {}));
	
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
	
	
	var AsyncStep = (function(AsyncStep){
	    AsyncStep.setup = function(properties){
	        var step = {
	            urlTemplate: '',
	            /** Will be done before async call. It should return an object ready to use by resolveUrl function. **/
	            beforeStep: function(input){return input},
	            /** Will be done after async call **/
	            afterStep: function (output) {return output},
	            resolveUrl: function (input) {
	                var url = this.urlTemplate;
	                var urlParams = {};
	                $.each(input, function (key, value) {
	                    url = url.replace(new RegExp('#'+key,'g'), value);
	                    urlParams[key] = value;
	                });
	
	                return {
	                    url: url,
	                    urlParams: urlParams
	                };
	            }
	        };
	
	        return $.extend(true, step, properties);
	    };
	    return AsyncStep;
	}(AsyncStep || {}));
	
	var Notification = (function(Notification) {
	    var create = function(title, bodyContent, special) {
	        var specialContentClasses = special ? ' special-color white-text' : '';
	        var content = $('<div>').addClass('toast notification' + specialContentClasses).attr('role', 'alert')
	            .attr('aria-live', 'assertive').attr('aria-atomic', 'true')
	            .attr('name', special ? 'special' : 'normal').attr('data-delay', '5000');
	        var header = $('<div>').addClass('toast-header special-color-dark white-text');
	        var warnIcon = $('<i>').addClass('fas fa-exclamation-triangle pr-2');
	        var title = $('<strong>').addClass('mr-auto').text(title);
	        var time = $('<small>').text(new Date().toLocaleTimeString());
	        var close = $('<button>').attr('type', 'button').addClass('ml-2 mb-1 close white-text')
	            .attr('data-dismiss', 'toast').attr('aria-label', 'Close')
	            .append($('<span>').attr('aria-hidden', 'true').text('\u00D7'));
	
	        if(special){
	            header.append(warnIcon);
	            content.attr('data-autohide', 'false');
	        }
	        header.append(title).append(time).append(close);
	        var body = $('<div>').addClass('toast-body notification-body').append(bodyContent);
	
	        content.append(header).append(body);
	        return content;
	    };
	
	    Notification.show = function(options, w){
	        options = options || {};
	        var special = false;
	        if (options.hasOwnProperty('special')) {
	            special = options.special;
	        }
	        if(!options.hasOwnProperty('title') || !options.hasOwnProperty('content')){
	            return;
	        }
	
	        var rootElement = $(w.document.body);
	        var notification = create(options.title, options.content, special);
	        $('#notification-container', rootElement).append(notification);
	        $('.toast', rootElement).toast('show');
	        $('.toast', rootElement).on('hidden.bs.toast', function (){
	            $.each($(this), function(index, value) {
	                var element = $(value);
	                element.remove();
	            });
	        })
	    };
	
	    return Notification;
	}(Notification || {}));
	
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
	
	/** Icons preview: https://fontawesome.com/v4.7.0/icons **/
	var DomTamper = (function(DomTamper){
	
	    DomTamper.injectStyle = function(w, name){
	        var head = $(w.document.head);
	        if(!head.find('style[name="' + name + '"]').length){
	            var styleElement = $('<style>').attr('type', 'text/css')
	                .attr('name', name).text((GM_getResourceText(name)));
	            head.append(styleElement);
	        }
	    };
	
	    var injectStylesheet = function (w, setting) {
	        var head = $(w.document.head);
	        if(!head.find('link[name="' + setting.id + '"]').length){
	            var stylesheet = $('<link>').attr('name', setting.id).attr('type', 'text/css').attr('rel', 'stylesheet')
	                .attr('href',  setting.css);
	            head.append(stylesheet);
	        }
	    };
	
	    var prepareHead = function(w){
	        injectStylesheet(w, config.fontawesome);
	        injectStylesheet(w, config.bootstrap);
	        injectStylesheet(w, config.mdb);
	        DomTamper.injectStyle(w, 'content_css');
	    };
	
	    var createBugReportLink = function(w, additionalClass){
	        var button = $('<button>').attr('type', 'button').addClass('btn btn-sm m-0').addClass(additionalClass)
	            .append($('<i>').addClass('fas fa-bug'));
	        button.click(function(){
	            w.open('https://github.com/zacny/voddownloader/issues');
	        });
	        return $('<div>').addClass('bug-report-position').append(button);
	    };
	
	    var prepareBody = function(w, pageContent, detection) {
	        appendOrReplace(w, pageContent);
	        attachWaveEffect(w, pageContent);
	        if(detection) {
	            PluginSettingsDetector.detect(w);
	        }
	    };
	
	    var appendOrReplace = function (w, pageContent) {
	        var body = $(w.document.body);
	        if(body.children().length > 0){
	            body.children(":first").replaceWith(pageContent);
	        }
	        else {
	            body.append(pageContent);
	        }
	    };
	
	    var attachWaveEffect = function(w, pageContent){
	        var buttons = pageContent.find('.btn:not(.btn-flat), .btn-floating');
	        Waves.attach(buttons, ['waves-light']);
	        Waves.init({}, w);
	    };
	
	    DomTamper.handleError = function(exception, w){
	        if(w === undefined){
	            w = window.open();
	        }
	
	        prepareHead(w);
	        var message = exception.error.template(exception.templateParams);
	        var pageContent = $('<div>').addClass('page-content');
	        var card = $('<div>').addClass('card text-white bg-danger mb-3');
	        var cardHeader = $('<div>').addClass('card-header')
	            .text('Niestety natrafiono na problem, który uniemożliwił dalsze działanie');
	        var cardBody = $('<div>').addClass('card-body')
	            .append($('<h5>').addClass('card-title').text(exception.error.caption))
	            .append($('<div>').addClass('card-text text-white').text(message));
	
	        pageContent.append(card.append(cardHeader).append(cardBody))
	            .append(createBugReportLink(w, 'btn-danger'));
	        prepareBody(w, pageContent);
	    };
	
	    DomTamper.createButton = function(properties){
	        properties.wrapper.get().find('#'+properties.button.id).remove();
	        var button = $('<input>').attr('id', properties.button.id).attr('type', 'button')
	            .attr('style', properties.button.style).attr('value', 'Pobierz video').addClass(properties.button.class);
	        button.bind('click', properties.button.click);
	        properties.wrapper.get().append(button);
	    };
	
	    DomTamper.createLoader = function(w){
	        var body = $(w.document.body);
	        prepareHead(w);
	        var pageContent = $('<div>').addClass('page-content');
	        var card = $('<div>').addClass('card text-white bg-dark');
	        var cardHeader = $('<div>').addClass('card-header').text('Poczekaj trwa wczytywanie danych...');
	        var cardBody = $('<div>').addClass('card-body');
	        var bodyContainer = $('<div>').addClass('d-flex justify-content-center m-3');
	        var spinner = $('<div>').addClass('spinner-border spinner-size').attr('role', 'status')
	            .append($('<span>').addClass('sr-only').text('Loading...'));
	        cardBody.append(bodyContainer.append(spinner));
	        card.append(cardHeader).append(cardBody);
	        pageContent.append(card);
	        prepareBody(w, pageContent);
	    };
	
	    var createAction = function(iconClass, label){
	        return $('<button>').attr('type', 'button').addClass('btn btn-dark btn-sm m-1 pl-3 pr-3')
	            .append($('<i>').addClass('fas pr-1').addClass(iconClass)).append(label);
	    };
	
	    var downloadActionClick = function (data, w) {
	        var options = {title: 'Rozpoczęto pobieranie pliku', content: data.title};
	        Tool.downloadFile(data.value.url, data.title);
	        Notification.show(options, w);
	    };
	
	    var copyActionClick = function (data, w) {
	        GM_setClipboard(data.value.url);
	        var options = {title: 'Kopiowanie', content: 'Skopiowano do schowka'};
	        Notification.show(options, w);
	    };
	
	    var openActionClick = function (data, w) {
	        w.open(data.value.url);
	    };
	
	    var createRow = function(data, rowClass, w){
	        var actions = $('<td>').attr('scope', 'row').addClass('actions-row');
	        actions.append(createAction('fa-save', 'Zapisz').click(
	            function(){downloadActionClick(data, w)})
	        );
	        actions.append(createAction('fa-clone', 'Kopiuj').click(
	            function() {copyActionClick(data, w)})
	        );
	        actions.append(createAction('fa-film', 'Otwórz').click(
	            function() {openActionClick(data, w)})
	        );
	
	        var descriptionText = data.value.quality == undefined ?
	            'Bitrate: ' + data.value.bitrate :
	            'Bitrate: ' + data.value.bitrate + ', Jakość: '+ data.value.quality;
	        var description = $('<td>').text(descriptionText);
	
	        return $('<tr>').append(actions).append(description);
	    };
	
	    var createTable = function(data, w){
	        var table = $('<table>').addClass('table table-bordered table-striped btn-table')
	            .append($('<thead>').addClass('black white-text')
	                .append($('<tr>').append($('<th>').attr('scope', 'col').attr('colspan', 2).text(data.title)))
	            );
	        var tbody = $('<tbody>');
	        table.append(tbody);
	        $.each(data.formats, function(index, value) {
	            var rowClass = index === 0 ? 'best-quality' : '';
	            var params = {
	                value: value,
	                title: data.title
	            };
	            tbody.append(createRow(params, rowClass, w));
	        });
	
	        return table;
	    };
	
	    var setWindowTitle = function(data, w){
	        var head = $(w.document.head);
	        var title = head.find('title');
	        if(title.length) {
	            title.text(data.title);
	        }
	        else {
	            head.append($('<title>').text(data.title));
	        }
	    };
	
	    DomTamper.createDocument = function(data, w){
	        Tool.numberModeSort(data.formats);
	
	        prepareHead(w);
	        setWindowTitle(data, w);
	        var pageContent = $('<div>').addClass('page-content');
	        pageContent.append(createTable(data, w));
	        pageContent.append(createBugReportLink(w, 'special-color white-text'));
	        pageContent.append(createNotificationContainer());
	        prepareBody(w, pageContent, true);
	    };
	
	    var createNotificationContainer = function(){
	        return $('<div>').attr('id', 'notification-container')
	            .attr('aria-live', 'polite').attr('aria-atomic', 'true').addClass('notification-container');
	    };
	
	    return DomTamper;
	}(DomTamper || {}));
	
	var Executor = (function(Executor){
	    var executeAsync = function(service, options, w){
	        var exceptionParams = [options.stepIndex, window.location.href];
	        var resolveUrl = beforeStep(service, options);
	        console.log('step ' + options.chainName + '[' + options.stepIndex + ']: ' + resolveUrl.url);
	        var requestParams = {
	            method: 'GET',
	            url: resolveUrl.url,
	            responseType: 'json',
	            onload: function(data) {
	                options.data = data.response;
	                asyncCallback(service, options, w);
	            },
	            onerror: function(){
	                DomTamper.handleError(new Exception(config.error.call, exceptionParams), w);
	            },
	            ontimeout: function(){
	                DomTamper.handleError(new Exception(config.error.timeout, exceptionParams), w);
	            }
	        };
	        GM_xmlhttpRequest(requestParams);
	    };
	
	    var beforeStep = function(service, options){
	        var steps = service.asyncChains[options.chainName];
	        var currentStep = steps[options.stepIndex];
	        var result = currentStep.beforeStep(options.data);
	        if(typeof result === 'string' || typeof result == 'number'){
	            result = {
	                videoId: result
	            }
	        }
	        if(options.urlParams){
	            $.extend(true, options.urlParams, result);
	        }
	        else {
	            options.urlParams = result;
	        }
	        return currentStep.resolveUrl(options.urlParams);
	    };
	
	    var afterStep = function(service, options) {
	        var steps = service.asyncChains[options.chainName];
	        var currentStep = steps[options.stepIndex];
	        var output = currentStep.afterStep(options.data);
	        options.data = output;
	        options.stepIndex += 1;
	        return steps[options.stepIndex];
	    };
	
	    var asyncCallback = function(service, options, w){
	        try {
	            var nextStep = afterStep(service, options);
	            if(nextStep !== undefined) {
	                return Promise.resolve().then(
	                    Executor.asyncChain(service, options, w)
	                );
	            }
	            else {
	                return Promise.resolve().then(
	                    service.onDone(options.data, w)
	                );
	            }
	        }
	        catch(e){
	            DomTamper.handleError(new Exception(config.error.api, options.stepIndex, window.location.href), w);
	        }
	    };
	
	    Executor.asyncChain = function(service, options, w){
	        try {
	            if(w === undefined){
	                w = window.open();
	                DomTamper.createLoader(w);
	            }
	
	            executeAsync(service, options, w);
	        }
	        catch(e){
	            DomTamper.handleError(e, w);
	        }
	    };
	
	    return Executor;
	}(Executor || {}));
	
	var Configurator = (function(Configurator){
	    Configurator.setup = function(properties){
	        var service = {
	            wrapper: {
	                selector: '',
	                get: function(){
	                    return $(service.wrapper.selector);
	                },
	                exist: function(){
	                    return $(service.wrapper.selector).length > 0;
	                }
	            },
	            button: {
	                id: 'direct-download',
	                style: '',
	                class: '',
	                click: function(){
	                    var chainName = service.chainSelector();
	                    Executor.asyncChain(service, {
	                        stepIndex: 0,
	                        chainName: chainName
	                    });
	                }
	            },
	            asyncChains: {
	                default: []
	            },
	            chainSelector: function(){
	                return "default";
	            },
	            onDone: function(data, w) {
	                DomTamper.createDocument(data, w);
	            }
	        };
	
	        return $.extend(true, service, properties);
	    };
	    return Configurator;
	}(Configurator || {}));
	
	var ChangeVideoDetector = (function(ChangeVideoDetector){
	    var checkVideoChange = function(oldSrc, videoChangeCallback) {
	        var src = window.location.href;
	        if(src !== undefined && oldSrc !== src){
	            console.log("checkVideoChange: " + oldSrc + " -> " + src);
	            return Promise.resolve().then(videoChangeCallback);
	        }
	        else {
	            return Promise.resolve().then(
	                setTimeout(checkVideoChange, config.attemptTimeout, oldSrc, videoChangeCallback)
	            );
	        }
	    };
	
	    ChangeVideoDetector.run = function(videoChangeCallback){
	        console.log('ChanageVideoDetector start');
	        var src = window.location.href;
	        checkVideoChange(src, videoChangeCallback);
	    };
	    return ChangeVideoDetector;
	}(ChangeVideoDetector || {}));
	
	var WrapperDetector = (function(WrapperDetector){
	    var onWrapperExist = function(properties){
	        if(properties.wrapper.exist()) {
	            DomTamper.createButton(properties);
	        }
	        else {
	            console.info("Nie mam nic do zrobienia");
	        }
	    };
	
	    var checkWrapperExist = function(attempt, properties){
	        logWrapperMessage(properties.wrapper, attempt);
	        if (properties.wrapper.exist() || attempt == 0) {
	            return Promise.resolve().then(onWrapperExist(properties));
	        } else {
	            attempt = (attempt > 0) ? attempt-1 : attempt;
	            return Promise.resolve().then(
	                setTimeout(checkWrapperExist, config.attemptTimeout, attempt, properties)
	            );
	        }
	    };
	
	    var logWrapperMessage = function(wrapper, attempt){
	        var existColor = wrapper.exist() ? 'color:green' : 'color:red';
	        var params = [
	                existColor, wrapper.selector, 'color:gray',
	                'color:black;font-weight: bold', attempt, 'color:gray'
	            ];
	        Tool.formatConsoleMessage('check for: "%c%s%c" [%c%s%c]', params);
	    };
	
	    WrapperDetector.run = function(properties, videoChangeCallback) {
	        checkWrapperExist(config.attempts, properties);
	        if(typeof videoChangeCallback === "function"){
	            ChangeVideoDetector.run(videoChangeCallback);
	        }
	    };
	    return WrapperDetector;
	}(WrapperDetector || {}));
	
	var VOD_TVP = (function(VOD_TVP) {
	    var properties = Configurator.setup({
	        wrapper: {
	            selector: 'div.playerContainer'
	        },
	        button: {
	            class: 'video-block__btn tvp_vod_downlaod_button',
	        },
	        asyncChains: {
	            default: [
	                AsyncStep.setup({
	                    urlTemplate: 'https://tvp.pl/pub/stat/videofileinfo?video_id=#videoId',
	                    beforeStep: function (input) {
	                        return idParser();
	                    }
	                }),
	                AsyncStep.setup({
	                    urlTemplate: 'https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=#videoId',
	                    beforeStep: function (json) {
	                        return getRealVideoId(json);
	                    },
	                    afterStep: function (output) {
	                        return VOD_TVP.grabVideoFormats(output);
	                    }
	                })
	            ]
	        }
	    });
	
	    var idParser = function() {
	        // var src = properties.wrapper.get().attr('data-id');
	        // var videoId = src.split("/").pop();
	        //
	        // if(videoId === null){
	            throw new Exception(config.error.id, window.location.href);
	        // }
	
	        return {
	            videoId: videoId
	        };
	    };
	
	    var getRealVideoId = function(json){
	        var videoId = json.copy_of_object_id !== undefined ?
	            json.copy_of_object_id : json.video_id;
	        return {
	            videoId: videoId
	        };
	    };
	
	    VOD_TVP.grabVideoFormats = function(data){
	        var formats = [];
	        if(data.status == 'OK' && data.formats !== undefined){
	            $.each(data.formats, function( index, value ) {
	                if(value.adaptive == false){
	                    formats.push({
	                        bitrate: value.totalBitrate,
	                        url: value.url
	                    });
	                }
	            });
	        }
	
	        return {
	            title: data.title,
	            formats: formats
	        };
	    };
	
	    VOD_TVP.waitOnWrapper = function(){
	        WrapperDetector.run(properties);
	    };
	
	    return VOD_TVP;
	}(VOD_TVP || {}));
	
	var CYF_TVP = (function(CYF_TVP) {
	    var properties = Configurator.setup({
	        wrapper: {
	            selector: 'div.playerContainerWrapper'
	        },
	        button: {
	            class: 'video-block__btn tvp_cyf_downlaod_button'
	        },
	        asyncChains: {
	            default: [
	                AsyncStep.setup({
	                    urlTemplate: 'https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=#videoId',
	                    beforeStep: function (input) {
	                        return idParser();
	                    },
	                    afterStep: function (output) {
	                        return VOD_TVP.grabVideoFormats(output);
	                    }
	                })
	            ]
	        }
	    });
	
	    var idParser = function(){
	        try {
	            var src = $('iframe#JS-TVPlayer').attr('src');
	            return src.split("/").pop();
	        }
	        catch(e){
	            throw new Exception(config.error.id, window.location.href);
	        }
	    };
	
	    CYF_TVP.waitOnWrapper = function(){
	        WrapperDetector.run(properties);
	    };
	
	    return CYF_TVP;
	}(CYF_TVP || {}));
	
	var TVP_REG = (function(TVP_REG) {
	    var properties = Configurator.setup({
	        wrapper: {
	            selector: 'div.js-video'
	        },
	        button: {
	            class: 'tvp_reg_download_button'
	        },
	        asyncChains: {
	            default: [
	                AsyncStep.setup({
	                    urlTemplate: 'https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=#videoId',
	                    beforeStep: function (input) {
	                        return idParser();
	                    },
	                    afterStep: function (output) {
	                        return VOD_TVP.grabVideoFormats(output);
	                    }
	                })
	            ]
	        }
	    });
	
	    var idParser = function(){
	        try {
	            return $('div.js-video').attr('data-object-id');
	        }
	        catch(e){
	            throw new Exception(config.error.id, window.location.href);
	        }
	    };
	
	    TVP_REG.waitOnWrapper = function(){
	        WrapperDetector.run(properties);
	    };
	
	    return TVP_REG;
	}(TVP_REG || {}));
	
	var TVN = (function(TVN) {
	    var properties = Configurator.setup({
	        wrapper: {
	            selector: '#player-container'
	        },
	        button: {
	            class: 'btn btn-primary tvn_download_button'
	        },
	        asyncChains: {
	            default: [
	                AsyncStep.setup({
	                    urlTemplate: '/api/?platform=ConnectedTV&terminal=Panasonic&format=json' +
	                        '&authKey=064fda5ab26dc1dd936f5c6e84b7d3c2&v=3.1&m=getItem&id=#videoId',
	                    beforeStep: function(input){
	                        return idParser();
	                    },
	                    afterStep: function(output) {
	                        return formatParser(output);
	                    }
	                })
	            ],
	            serial: [
	                AsyncStep.setup({
	                    urlTemplate: 'https://player.pl/playerapi/item/translate?programId=#programId' +
	                        '&4K=true&platform=BROWSER',
	                    beforeStep: function(input){
	                         return serialIdParser();
	                    },
	                    afterStep: function(output) {
	                        return {
	                            serialId: output.id
	                        };
	                    }
	                }),
	                AsyncStep.setup({
	                    urlTemplate: 'https://player.pl/playerapi/product/vod/serial/#serialId/season/list?4K=true' +
	                        '&platform=BROWSER',
	                    afterStep: function(output) {
	                        return {
	                            seasonId: output[0].id
	                        };
	                    }
	                }),
	                AsyncStep.setup({
	                    urlTemplate: 'https://player.pl/playerapi/product/vod/serial/#serialId/season/#seasonId/' +
	                        'episode/list?4K=true&platform=BROWSER',
	                    afterStep: function(output) {
	                        return {
	                            episodeId: output[0].externalArticleId
	                        };
	                    }
	                }),
	                AsyncStep.setup({
	                    urlTemplate: '/api/?platform=ConnectedTV&terminal=Panasonic&format=json' +
	                        '&authKey=064fda5ab26dc1dd936f5c6e84b7d3c2&v=3.1&m=getItem&id=#episodeId',
	                    afterStep: function(output) {
	                        return formatParser(output);
	                    }
	                })
	            ]
	        },
	        chainSelector: function(){
	            return selectChain();
	        }
	    });
	
	    var selectChain = function(){
	        if($('.watching-now').length > 0){
	            return "default";
	        }
	        var pageURL = window.location.href;
	        var match = pageURL.match(/odcinki,(\d+)\/.*,(\d+)/);
	        if(match && match[2]){
	            return "default";
	        }
	        match = pageURL.match(/odcinki,(\d+)/);
	        if(match && match[1]){
	            return "serial";
	        }
	
	        return "default";
	    };
	
	    var serialIdParser = function () {
	        var match = window.location.href.match(/odcinki,(\d+)/);
	        if(match && match[1]){
	            return {
	                programId: match[1]
	            }
	        }
	
	        throw new Exception(config.error.caption.id, config.error.template.idTvn(window.location.href));
	    };
	
	    var idParser = function(){
	        var watchingNow = $('.watching-now').closest('.embed-responsive').find('.embed-responsive-item');
	        if(watchingNow.length > 0){
	            return watchingNow.attr('href').split(',').pop();
	        }
	
	        return episodeIdParser();
	    };
	
	    var episodeIdParser = function () {
	        var match = window.location.href.match(/odcinki,(\d+)\/.*,(\d+)/);
	        if(match && match[2]){
	            return match[2];
	        }
	
	        return vodIdParser();
	    };
	
	    var vodIdParser = function(){
	        var match = window.location.href.match(/,(\d+)/);
	        if(match && match[1]){
	            return match[1];
	        }
	
	        throw new Exception(config.error.caption.id, config.error.template.id(window.location.href));
	    };
	
	    var formatParser = function(data){
	        var formats = [];
	        var title;
	        var video_content = (((data.item || {}).videos || {}).main || {}).video_content || {};
	        if(video_content && video_content.length > 0){
	            $.each(video_content, function( index, value ) {
	                var lastPartOfUrl = Tool.deleteParametersFromUrl(value.url).split("/").pop();
	                var bitrate = lastPartOfUrl.match(/\d{2,}/g);
	                formats.push({
	                    quality: value.profile_name,
	                    bitrate: bitrate,
	                    url: value.url
	                });
	            });
	            title = data.item.episode != null ? 'E'+data.item.episode : '';
	            title = data.item.season != null ? 'S'+data.item.season + title : title;
	            if(data.item.serie_title != null){
	                title = data.item.serie_title + (title != '' ? ' - ' + title : '');
	            }
	        }
	        return {
	            title: title,
	            formats: formats
	        }
	    };
	
	    TVN.waitOnWrapper = function(){
	        WrapperDetector.run(properties, TVN.waitOnWrapper);
	    };
	
	    return TVN;
	}(TVN || {}));
	
	var IPLA = (function(IPLA) {
	    var properties = Configurator.setup({
	        wrapper: {
	            selector: 'div.player-wrapper:visible:first-child, div.promo-box:visible:first-child,' +
	                ' div.player-error-presentation:visible:first-child'
	        },
	        button: {
	            class: 'ipla_download_button'
	        },
	        asyncChains: {
	            default: [
	                AsyncStep.setup({
	                    urlTemplate: 'https://getmedia.redefine.pl/vods/get_vod/?cpid=1' +
	                        '&ua=www_iplatv_html5/12345&media_id=#videoId',
	                    beforeStep: function (input) {
	                        return idParser();
	                    },
	                    afterStep: function (output) {
	                        return IPLA.grabVideoFormats(output);
	                    }
	                })
	            ]
	        }
	    });
	
	    var idParser = function(){
	        if(location.href.match(/[\a-z\d]{32}/) !== null) {
	            return window.location.href.match(/[\a-z\d]{32}/)[0];
	        }
	
	        return grabVideoIdFromWatchingNowElement();
	    };
	
	    IPLA.waitOnWrapper = function(){
	        WrapperDetector.run(properties, IPLA.waitOnWrapper);
	    };
	
	    IPLA.grabVideoFormats = function(data){
	        var formats = [];
	        var vod = data.vod || {};
	        if(vod.copies && vod.copies.length > 0){
	            $.each(vod.copies, function( index, value ) {
	                formats.push({
	                    bitrate: value.bitrate,
	                    url: value.url,
	                    quality: value.quality_p
	                });
	            });
	        }
	        return {
	            title: vod.title,
	            formats: formats
	        }
	    };
	
	    var grabVideoIdFromWatchingNowElement = function(){
	        try {
	            var href = $('div.vod-image-wrapper__overlay').closest('a').attr('href');
	            return href.match(/[\a-z\d]{32}/)[0];
	        }
	        catch(e){
	            return grabVideoIdFromHtmlElement();
	        }
	    };
	
	    var grabVideoIdFromHtmlElement = function(){
	        try{
	            var frameSrc = $('app-commercial-wallpaper iframe:first-child').attr('src');
	            return Tool.getUrlParameter('vid', frameSrc);
	        }
	        catch(e){
	            throw new Exception(config.error.id, window.location.href);
	        }
	    };
	
	    return IPLA;
	}(IPLA || {}));
	
	var VOD = (function(VOD) {
	    var properties = Configurator.setup({
	        wrapper: {
	            selector: '#v_videoPlayer'
	        },
	        button: {
	            class: 'vod_download_button'
	        },
	        asyncChains: {
	            default: [
	                AsyncStep.setup({
	                    urlTemplate: 'https://player-api.dreamlab.pl/?body[id]=#videoId&body[jsonrpc]=2.0' +
	                        '&body[method]=get_asset_detail&body[params][ID_Publikacji]=#videoId' +
	                        '&body[params][Service]=vod.onet.pl&content-type=application/jsonp' +
	                        '&x-onet-app=player.front.onetapi.pl&callback=',
	                    beforeStep: function (input) {
	                        return idParser();
	                    },
	                    afterStep: function (output) {
	                        return formatParser(output);
	                    }
	                })
	            ]
	        }
	    });
	
	    var idParser = function () {
	        try {
	            var id = $(".mvp").attr('id');
	            return id.match(/mvp:(.+)/)[1];
	        }
	        catch(e){
	            throw new Exception(config.error.id, window.location.href);
	        }
	    };
	
	    var formatParser = function (data) {
	        var formats = [];
	        var video = (((data.result || new Array())[0] || {}).formats || {}).wideo || {};
	        var meta = ((data.result || new Array())[0] || {}).meta || {};
	        var videoData = video['mp4-uhd'] && video['mp4-uhd'].length > 0 ? video['mp4-uhd'] : video['mp4'];
	        if(videoData){
	            $.each(videoData, function( index, value ) {
	                formats.push({
	                    quality: value.vertical_resolution,
	                    bitrate: value.video_bitrate,
	                    url: value.url
	                });
	            });
	        }
	        return {
	            title: meta.title,
	            formats: formats
	        }
	    };
	
	    var isTopWindow = function(){
	        return window.top === window.self;
	    };
	
	    var iplaSectionDetected = function(){
	        return $('#v_videoPlayer div.pulsembed_embed').length > 0;
	    };
	
	    VOD.waitOnWrapper = function(){
	        if(isTopWindow() && !iplaSectionDetected()){
	            WrapperDetector.run(properties);
	        }
	    };
	
	    return VOD;
	}(VOD || {}));
	
	var VOD_IPLA = (function(VOD_IPLA) {
	    var properties = Configurator.setup({
	        wrapper: {
	            selector: '#player-wrapper'
	        },
	        button: {
	            class: 'vod_ipla_downlaod_button'
	        },
	        asyncChains: {
	            default: [
	                AsyncStep.setup({
	                    urlTemplate: 'https://getmedia.redefine.pl/vods/get_vod/?cpid=1&ua=www_iplatv_html5/12345' +
	                        '&media_id=#videoId',
	                    beforeStep: function (input) {
	                        return idParser();
	                    },
	                    afterStep: function (output) {
	                        return IPLA.grabVideoFormats(output);
	                    }
	                })
	            ]
	        }
	    });
	
	    var idParser = function(){
	        try {
	            var match = $('script:not(:empty)').text().match(/(window\.CP\.embedSetup\()(.*)\);/);
	            var jsonObject = JSON.parse(match[2]);
	            return JSON.parse(jsonObject[0].media).result.mediaItem.id;
	        }
	        catch(e){
	            throw new Exception(config.error.id, window.location.href);
	        }
	    };
	
	    VOD_IPLA.waitOnWrapper = function(){
	        WrapperDetector.run(properties);
	    };
	
	    return VOD_IPLA;
	}(VOD_IPLA || {}));
	
	var WP = (function(WP) {
	    var properties = Configurator.setup({
	        wrapper: {
	            selector: '#mainPlayer'
	        },
	        button: {
	            class: 'material__category wp_download_button'
	        },
	        asyncChains: {
	            default: [
	                AsyncStep.setup({
	                    urlTemplate: 'https://video.wp.pl/player/mid,#videoId,embed.json',
	                    beforeStep: function (input) {
	                        return idParser();
	                    },
	                    afterStep: function (output) {
	                        return grabVideoFormats(output);
	                    }
	                })
	            ]
	        }
	    });
	
	    var idParser = function () {
	        try {
	            var pageURL = window.location.href;
	            var regexp = new RegExp('mid,(\\d+),cid');
	            var match = regexp.exec(pageURL);
	            return match[1];
	        }
	        catch(e){
	            throw new Exception(config.error.id, window.location.href);
	        }
	    };
	
	    var grabVideoFormats = function(data){
	        var formats = [];
	        var urls = (data.clip || {}).url || {};
	        if(urls && urls.length > 0){
	            $.each(urls, function( index, value ) {
	                if(value.type === 'mp4@avc'){
	                    formats.push({
	                        bitrate: value.quality,
	                        url: 'http:' + value.url,
	                        quality: value.resolution
	                    });
	                }
	            });
	        }
	        return {
	            title: data.clip.title,
	            formats: formats
	        }
	    };
	
	    WP.waitOnWrapper = function(){
	        WrapperDetector.run(properties, WP.waitOnWrapper);
	    };
	
	    return WP;
	}(WP || {}));
	
	var CDA = (function(CDA) {
	    var properties = Configurator.setup({
	        wrapper: {
	            selector: '#player'
	        },
	        button: {
	            class: 'cda_download_button',
	            click: function(){
	                clickButton();
	            }
	        }
	    });
	
	    var clickButton = function(){
	        var w = window.open();
	        try {
	            var url = $("video.pb-video-player").attr('src');
	            if(url !== undefined){
	                if (!url.match(/blank\.mp4/)) {
	                    w.location.href = url;
	                }
	                else {
	                    throw new Exception(config.error.idCdn, window.location.href);
	                }
	            }
	        }catch(e){
	            DomTamper.handleError(e, w);
	        }
	    };
	
	    CDA.waitOnWrapper = function(){
	        WrapperDetector.run(properties);
	    };
	
	    return CDA;
	}(CDA || {}));
	
	var Starter = (function(Starter) {
	    var tvZones = [
	        'bialystok', 'katowice', 'lodz', 'rzeszow', 'bydgoszcz', 'kielce', 'olsztyn', 'szczecin',
	        'gdansk', 'krakow', 'opole', 'warszawa', 'gorzow', 'lublin', 'poznan', 'wroclaw'
	    ];
	
	    var matcher = [
	        {action: VOD_TVP.waitOnWrapper, pattern: /^https:\/\/vod\.tvp\.pl\/video\//},
	        {action: CYF_TVP.waitOnWrapper, pattern: /^https:\/\/cyfrowa\.tvp\.pl\/video\//},
	        {action: TVP_REG.waitOnWrapper, pattern: new RegExp('^https:\/\/(' + tvZones.join('|') + ')\.tvp\.pl\/\\d{6,}\/')},
	        {action: TVN.waitOnWrapper, pattern: /^https:\/\/(?:w{3}\.)?(?:tvn)?player\.pl\//},
	        {action: CDA.waitOnWrapper, pattern: /^https:\/\/www\.cda\.pl\//},
	        {action: VOD.waitOnWrapper, pattern: /^https:\/\/vod.pl\//},
	        {action: VOD_IPLA.waitOnWrapper, pattern: /^https:\/\/.*\.redcdn.pl\/file\/o2\/redefine\/partner\//},
	        {action: IPLA.waitOnWrapper, pattern: /^https:\/\/www\.ipla\.tv\//},
	        {action: WP.waitOnWrapper, pattern: /^https:\/\/video\.wp\.pl\//}
	    ];
	
	    Starter.start = function() {
	        matcher.some(function(item){
	            if(location.href.match(item.pattern)){
	                item.action();
	                return true;
	            }
	        });
	    };
	
	    return Starter;
	}(Starter || {}));
	
	$(document).ready(function(){
	    console.info('voddownloader with jQuery v' + $().jquery);
	    DomTamper.injectStyle(window, 'buttons_css');
	    Starter.start();
	});

}).bind(this)(jQuery);