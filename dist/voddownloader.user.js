// ==UserScript==
// @name           Skrypt umożliwiający pobieranie materiałów ze znanych serwisów VOD.
// @version        6.15.1
// @updateURL      https://raw.githubusercontent.com/zacny/voddownloader/master/dist/voddownloader.meta.js
// @downloadURL    https://raw.githubusercontent.com/zacny/voddownloader/master/dist/voddownloader.user.js
// @description    Skrypt służący do pobierania materiałów ze znanych serwisów VOD.
//                 Działa poprawnie tylko z rozszerzeniem Tampermonkey.
//                 Cześć kodu pochodzi z:
//                 miniskrypt.blogspot.com,
//                 miniskrypt.hubaiitv.pl
// @author         Przmus, zacny
// @namespace      http://www.ipla.tv/
// @source         https://github.com/zacny/voddownloader
// @include        /^https://(vod|cyfrowa)\.tvp\.pl/video/.*$/
// @include        /^https?://.*\.tvp.(pl|info)/sess/TVPlayer2/embed.*$/
// @include        /^https?://((?!wiadomosci).)*\.tvp\.pl/\d{6,}/.*$/
// @include        https://www.tvpparlament.pl/sess/*
// @include        https://www.ipla.tv/*
// @include        https://player.pl/*
// @include        https://*.cda.pl/*
// @include        https://vod.pl/*
// @include        https://redir.atmcdn.pl/*
// @include        https://*.redcdn.pl/file/o2/redefine/partner/*
// @include        https://partner.ipla.tv/embed/*
// @include        https://wideo.wp.pl/*
// @include        https://ninateka.pl/*
// @include        https://www.arte.tv/*/videos/*
// @include        https://pulsembed.eu/*
// @include        https://tv-trwam.pl/local-vods/*
// @exclude        http://www.tvp.pl/sess/*
// @exclude        /^https?://(bialystok|gorzow|krakow|olsztyn|rzeszow|wroclaw|bydgoszcz|katowice|lublin|opole|szczecin|gdansk|kielce|lodz|poznan|warszawa)\.tvp.\pl/.*$/
// @exclude        /^https?://.*\.vod\.tvp\.pl/\d{6,}/.*$/
// @exclude        https://www.cda.pl/iframe/*
// @grant          GM_getResourceText
// @grant          GM_xmlhttpRequest
// @grant          GM_download
// @grant          GM_setClipboard
// @grant          GM_info
// @connect        tvp.pl
// @connect        getmedia.redefine.pl
// @connect        distro.redefine.pl
// @connect        player-api.dreamlab.pl
// @connect        api.arte.tv
// @connect        b2c.redefine.pl
// @connect        player.pl
// @connect        api-trwam.app.insysgo.pl
// @run-at         document-end
// @require        https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @require        https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.3.1/js/bootstrap.min.js
// @require        https://cdnjs.cloudflare.com/ajax/libs/platform/1.3.5/platform.min.js
// @require        https://gitcdn.xyz/cdn/zacny/voddownloader/4b17a120f521eaddf476d6e8fe3be152d506f244/lib/js/mdb-with-waves-patch.js
// @require        https://gitcdn.xyz/cdn/kapetan/jquery-observe/ca67b735bb3ae8d678d1843384ebbe7c02466c61/jquery-observe.js
// @resource       buttons_css https://raw.githubusercontent.com/zacny/voddownloader/master/lib/css/voddownloader-buttons.css
// @resource       content_css https://raw.githubusercontent.com/zacny/voddownloader/master/lib/css/voddownloader-content.css
// ==/UserScript==

(function vodDownloader($, platform, Waves) {
    'use strict';

    var Exception = (function(error, templateParams) {
	    this.error = error;
	    this.templateParams = Array.isArray(templateParams) ? templateParams : [templateParams];
	});
	
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
	
	    Tool.formatConsoleMessage = function(message, params){
	        console.log.apply(this, $.merge([message], params));
	    };
	
	    Tool.downloadFile = function(fileUrl, title){
	        var extension = Tool.deleteParametersFromUrl(fileUrl.split('.').pop());
	        var movieTitle = (title !== undefined && title !== '' ) ? title : 'nieznany';
	        movieTitle = movieTitle.replace(new RegExp(config.notAllowedFileNameCharsMask), '');
	        var name = movieTitle + '.' + extension;
	        name = name.replace(/\s+/g, ' ');
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
	
	    Tool.getRealUrl = function(){
	        var topUrl = window.sessionStorage.getItem(config.storage.topWindowLocation);
	        return topUrl !== null ? topUrl : window.location.href;
	    };
	
	    Tool.isTopWindow = function(){
	        return window.top === window.self;
	    };
	
	    Tool.pad = function(number, characters){
	        return(1e15+number+"").slice(-characters)
	    };
	
	    Tool.mapDescription = function(data){
	        var defaults = config.description.defaults;
	        var sourceDescriptions = config.description.sources[data.source] || {};
	        var descriptionVariant = sourceDescriptions[data.key] || {};
	        var output = {
	            video: descriptionVariant.video ? descriptionVariant.video : data.video,
	            index: descriptionVariant.index ? descriptionVariant.index : 99,
	            audio: data.audio ? data.audio : defaults.audio,
	            language: data.language ? data.language: defaults.language,
	            url: data.url
	        };
	        return $.extend(true, data, output);
	    };
	
	    return Tool;
	}(Tool || {}));
	
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
	    notAllowedFileNameCharsMask: '[\\/:\*\?"<>|]+',
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
	        }
	    },
	    error: {
	        id: {
	            caption: 'Nie udało się odnaleźć idetyfikatora.',
	            template: Tool.template`Algorytm rozpoznawania identyfikatora wideo na stronie: ${0} \
	                zakończył się niepowodzeniem. Może to oznaczać błąd skryptu.`,
	        },
	        tvnId: {
	            caption: 'Nie udało się odnaleźć idetyfikatora.',
	            template: Tool.template`Algorytm rozpoznawania identyfikatora wideo na stronie: ${0} \
	                zakończył się niepowodzeniem.\nJeżeli jest to główna strona programu oznacza to, \
	                że nie udało się odnaleźć identyfikatora ostatniego odcinka. Wejdź na stronę odcinka \
	                i spróbuj ponownie.\nMoże to również oznaczać błąd skryptu.`,
	        },
	        call: {
	            caption: 'Błąd pobierania informacji o materiale.',
	            template: Tool.template`Wystąpił błąd w wykonaniu skryptu w kroku: ${0} na stronie: ${1} \
	                Zgłoś problem autorom skryptu.`,
	        },
	        noSource: {
	            caption: 'Nie udało się odnaleźć źródeł do materiału.',
	            template: Tool.template`Materiał ze strony ${0} nie posiada zdefiniowanych źródeł, które mogłyby zostać \
	                wyświetlone. \nMoże to oznaczać, że nie jest on publicznie dostępny, dostępne źródła nie mogą zostać \
	                wyświetlone w przeglądarce bez dodatkowego oprogramowania lub jest umieszczony w płatnej strefie.`,
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
	
	
	var Step = (function(properties){
	    var step = {
	        urlTemplateParts: [],
	        urlTemplate: '',
	        before: function(input){return input},
	        after: function (output) {return output},
	        resultUrlParams: function (input, template) {
	            var urlParams = {};
	            $.each(input, function (key, value) {
	                template = template.replace(new RegExp(config.urlParamPattern + key,'g'), value);
	                urlParams[key] = value;
	            });
	
	            return {
	                url: template,
	                urlParams: urlParams
	            };
	        },
	        resolveUrl: function (input, partIndex) {
	            return this.resultUrlParams(input, this.resolveUrlParts(partIndex));
	        },
	        isRemote: function(){
	            return this.urlTemplate.length > 0;
	        },
	        method: 'GET',
	        headers: {},
	        responseType: 'json',
	        retryErrorCodes: [],
	        methodParam: function(){return {}},
	        resolveUrlParts: function(partIndex){
	            if(this.urlTemplateParts.length){
	                return this.urlTemplate.replace(config.urlPartPattern, this.urlTemplateParts[partIndex]);
	            }
	
	            return this.urlTemplate;
	        }
	    };
	
	    return $.extend(true, step, properties);
	});
	
	var Notification = (function(Notification) {
	    var create = function(title, bodyContent, special) {
	        var specialContentClasses = special ? ' special-color white-text' : '';
	        var content = $('<div>').addClass('toast notification' + specialContentClasses).attr('role', 'alert')
	            .attr('aria-live', 'assertive').attr('aria-atomic', 'true')
	            .attr('name', special ? 'special' : 'normal').attr('data-delay', '5000');
	        var header = $('<div>').addClass('toast-header special-color-dark white-text');
	        var warnIcon = $('<i>').addClass('fas fa-exclamation-triangle pr-2');
	        var notificationTitle = $('<strong>').addClass('mr-auto').text(title);
	        var time = $('<small>').text(new Date().toLocaleTimeString());
	        var close = $('<button>').attr('type', 'button').addClass('ml-2 mb-1 close white-text')
	            .attr('data-dismiss', 'toast').attr('aria-label', 'Close')
	            .append($('<span>').attr('aria-hidden', 'true').text('\u00D7'));
	
	        if(special){
	            header.append(warnIcon);
	            content.attr('data-autohide', 'false');
	        }
	        header.append(notificationTitle).append(time).append(close);
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
	                w.localStorage.setItem(config.storage.doNotWarn, true);
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
	            var value = w.localStorage.getItem(config.storage.doNotWarn);
	            if(value !== 'true'){
	                prepareWarningNotification(w);
	            }
	        }
	    };
	    return PluginSettingsDetector;
	}(PluginSettingsDetector || {}));
	
	var DomTamper = (function(DomTamper){
	
	    DomTamper.injectStyle = function(w, name){
	        var head = $(w.document.head);
	        if(!head.find('style[name="' + name + '"]').length){
	            var styleElement = $('<style>').attr('type', 'text/css')
	                .attr('name', name).text((GM_getResourceText(name)));
	            head.append(styleElement);
	        }
	    };
	
	    DomTamper.injectStylesheet = function (w, setting) {
	        var head = $(w.document.head);
	        if(!head.find('link[name="' + setting.id + '"]').length){
	            var stylesheet = $('<link>').attr('name', setting.id).attr('type', 'text/css').attr('rel', 'stylesheet')
	                .attr('href', setting.css);
	            head.append(stylesheet);
	        }
	    };
	
	    var prepareHead = function(w){
	        DomTamper.injectStylesheet(w, config.include.fontawesome);
	        DomTamper.injectStylesheet(w, config.include.bootstrap);
	        DomTamper.injectStylesheet(w, config.include.mdb);
	        DomTamper.injectStyle(w, 'content_css');
	    };
	
	    var createLinks = function(w, additionalClass){
	        var links = [
	            {
	                url: 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=RWX4EUR77CMKU',
	                icon: 'fa-hand-holding-usd',
	                tooltip: 'dotacje'
	            },
	            {
	                url: 'https://greasyfork.org/pl/scripts/6049-skrypt-umo%C5%BCliwiaj%C4%85cy-pobieranie-' +
	                    'materia%C5%82%C3%B3w-ze-znanych-serwis%C3%B3w-vod/feedback',
	                icon: 'fa-comments',
	                tooltip: 'problemy, komentarze'
	            },
	            {
	                url: 'https://github.com/zacny/voddownloader/issues',
	                icon: 'fa-bug',
	                tooltip: 'zgłoś błąd'
	            }
	        ];
	        var container = $('<div>').addClass('links-position');
	        links.forEach(function(link){
	            var button = $('<button>').attr('type', 'button').attr('title', link.tooltip)
	                .addClass('btn btn-sm m-1 p-2').addClass(additionalClass)
	                .append($('<i>').addClass('fas').addClass(link.icon).addClass('fa-2x'));
	            button.click(function(){
	                w.open(link.url);
	            });
	            container.append(button);
	        });
	        return container;
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
	        var errorData = getErrorData(exception);
	        var pageContent = $('<div>').addClass('page-content');
	        pageContent.append(createErrorContent(errorData));
	        pageContent.append(createLinks(w, errorData.type === 'error' ?
	            'btn-danger' : 'special-color white-text'));
	        prepareBody(w, pageContent);
	    };
	
	    var getErrorData = function(exception){
	        var type = 'error';
	        var caption = 'Niespodziewany błąd';
	        var message = 'Natrafiono na niespodziewany błąd: ' + exception;
	        if(exception.error){
	            message = exception.error.template.apply(this, exception.templateParams).replace(/\n/g, '<br/>');
	            caption = exception.error.caption;
	            type = exception.error.type !== undefined ? exception.error.type : 'error';
	        }
	
	        return {
	            message: linkify(message),
	            caption: caption,
	            type: type
	        }
	    };
	
	    var linkify = function(text) {
	        var linkDetectionRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
	        return text.replace(linkDetectionRegex, function(url) {
	            return '<u><a class="text-white" href="' + url + '">' + url + '</a></u>';
	        });
	    };
	
	    var createErrorContent = function(errorData){
	        var typeClass = errorData.type === 'error' ? 'bg-danger' : 'bg-dark';
	        var card = $('<div>').addClass('card text-white mb-3').addClass(typeClass);
	        var cardHeader = $('<div>').addClass('card-header')
	            .text('Niestety natrafiono na problem, który uniemożliwił dalsze działanie');
	        var cardBody = $('<div>').addClass('card-body')
	            .append($('<h5>').addClass('card-title').text(errorData.caption))
	            .append($('<div>').addClass('card-text text-white mb-3').append(errorData.message))
	            .append($('<div>').addClass('card-text text-white')
	                .append('Informacje o systemie: ').append(platform.description))
	            .append($('<div>').addClass('card-text text-white')
	                .append('Wersja pluginu: ').append(GM_info.version))
	            .append($('<div>').addClass('card-text text-white')
	                .append('Wersja skryptu: ').append(GM_info.script.version));
	        card.append(cardHeader).append(cardBody);
	        return card;
	    };
	
	    DomTamper.removeButton = function(properties){
	        $(properties.injection.selector).find('#' + properties.injection.id).remove();
	    };
	
	    DomTamper.createButton = function(properties){
	        DomTamper.removeButton(properties);
	        var element = properties.inject();
	        element.bind('click', properties.click);
	        $(properties.injection.selector).append(element);
	    };
	
	    DomTamper.createLoader = function(w){
	        prepareHead(w);
	        var pageContent = $('<div>').addClass('page-content');
	        pageContent.append(createLoaderContent());
	        pageContent.append(createLinks(w, 'special-color white-text'));
	        prepareBody(w, pageContent);
	        Unloader.init(w);
	    };
	
	    var createLoaderContent = function(){
	        var card = $('<div>').addClass('card text-white bg-dark');
	        var cardHeader = $('<div>').addClass('card-header').text('Poczekaj trwa wczytywanie danych...');
	        var cardBody = $('<div>').addClass('card-body');
	        var bodyContainer = $('<div>').addClass('d-flex justify-content-center m-3');
	        var spinner = $('<div>').addClass('spinner-border spinner-size').attr('role', 'status')
	            .append($('<span>').addClass('sr-only').text('Loading...'));
	        cardBody.append(bodyContainer.append(spinner));
	        card.append(cardHeader).append(cardBody);
	
	        return card;
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
	        prepareHead(w);
	        setWindowTitle(data, w);
	        var pageContent = $('<div>').addClass('page-content');
	        pageContent.append(Accordion.create(w, data));
	        pageContent.append(createLinks(w, 'special-color white-text'));
	        pageContent.append(createNotificationContainer());
	        prepareBody(w, pageContent, true);
	        Unloader.init(w);
	        Accordion.bindActions(w, data);
	    };
	
	    var createNotificationContainer = function(){
	        return $('<div>').attr('id', 'notification-container')
	            .attr('aria-live', 'polite').attr('aria-atomic', 'true').addClass('notification-container');
	    };
	
	    return DomTamper;
	}(DomTamper || {}));
	
	var HistoryTamper = (function(HistoryTamper){
	    HistoryTamper.onLocationChange = function(locationChangeCallback){
	        history.pushState = ( f => function pushState(){
	            var ret = f.apply(this, arguments);
	            window.dispatchEvent(new Event('pushstate'));
	            window.dispatchEvent(new Event('locationchange'));
	            return ret;
	        })(history.pushState);
	
	        history.replaceState = ( f => function replaceState(){
	            var ret = f.apply(this, arguments);
	            window.dispatchEvent(new Event('replacestate'));
	            window.dispatchEvent(new Event('locationchange'));
	            return ret;
	        })(history.replaceState);
	
	        window.addEventListener('popstate',()=>{
	            window.dispatchEvent(new Event('locationchange'))
	        });
	
	        window.addEventListener('locationchange', function(){
	            locationChangeCallback();
	        });
	    };
	
	    return HistoryTamper;
	}(HistoryTamper || {}));
	
	var Accordion = (function(Accordion) {
	    Accordion.create = function(w, data){
	        var mainCardTitle = $('<div>').addClass('card-header').text(data.title);
	
	        var accordion = $('<div>').addClass('accordion md-accordion').attr('id', 'accordion')
	            .attr('role', 'tablist').attr('aria-multiselectable', 'true');
	
	        createCards(accordion, data);
	
	        var mainCardBody = $('<div>').addClass('card-body p-0').append(accordion);
	        return $('<div>').addClass('card').append(mainCardTitle).append(mainCardBody);
	    };
	
	    var createCards = function(accordion, data) {
	        for(var key in data.cards) {
	            var card = createCard({
	                card: data.cards[key],
	                key: key,
	                title: data.title
	            });
	            accordion.append(card);
	        }
	    };
	
	    var createCard = function(data){
	        var accordionCard = $('<div>').addClass('border border-top-0');
	        var content = $('<div>').addClass('card-body pt-0');
	
	        var badgeClass = 'badge-light';
	        var textMuted = 'text-muted';
	        if(data.card.items.length > 0){
	            badgeClass = 'badge-danger';
	            textMuted = 'text-dark';
	            content.append(createCardContent(data));
	        }
	
	        var icon = $('<i>').addClass('fas').addClass(data.card.icon).addClass('pr-2');
	        var badge = $('<span>').addClass('badge mr-3 float-right').addClass(badgeClass)
	            .text(data.card.items.length);
	        var cardTitle = $('<h6>').addClass('mb-0').addClass(textMuted).append(icon).append(badge)
	            .append($('<span>').text(data.card.label));
	        var link = $('<a>').append(cardTitle);
	        var cardHeader = $('<div>').addClass('ml-3 p-2').attr('role', 'tab').attr('id', data.key).append(link);
	
	        var cardBody = $('<div>').addClass('collapse').attr('role', 'tabpanel')
	            .attr('aria-labelledby', data.key).append(content);
	        if(data.card.collapse){
	            cardBody.addClass('show');
	        }
	
	        accordionCard.append(cardHeader);
	        accordionCard.append(cardBody);
	        return accordionCard;
	    };
	
	    var createCardContent = function(data){
	        var table = $('<table>').addClass('table table-bordered table-striped btn-table');
	        var tbody = $('<tbody>');
	        table.append(tbody);
	        createRows(tbody, data);
	
	        return table;
	    };
	
	    var createRows = function(tableBody, data){
	        data.card.items.forEach(function(item) {
	            tableBody.append(createRow({
	                item: item,
	                info: data.card.info,
	                title: data.title,
	                actions: data.card.actions
	            }));
	        });
	    };
	
	    var createRow = function(data){
	        var actions = $('<td>').attr('scope', 'row').addClass('action-row-' + data.actions.length);
	        data.actions.forEach(function(action){
	            actions.append(createButton(action, data));
	        });
	
	        var description = $('<td>').html(createDescriptionHtml(data));
	        return $('<tr>').append(actions).append(description);
	    };
	
	    var createDescriptionHtml = function(data){
	        var descriptionHtml = $('<div>');
	
	        createDescription(data).forEach(function(item, idx, array){
	            descriptionHtml.append($('<b>').text(item.desc + ': '))
	                .append($('<span>').text(item.value));
	            if(idx !== array.length - 1) {//not last
	                descriptionHtml.append($('<span>').text(', '));
	            }
	        });
	        return descriptionHtml;
	    };
	
	    var itemExist = function(data, info){
	        return data.item.hasOwnProperty(info.name) && data.item[info.name] != null
	    };
	
	    var createDescription = function(data){
	        var description = [];
	        data.info.forEach(function(info){
	            if (itemExist(data, info)) {
	                description.push({
	                    desc: info.desc,
	                    value: data.item[info.name]
	                });
	            }
	        });
	        return description;
	    };
	
	    var createButton = function(action, data){
	        return $('<button>').attr('type', 'button').attr('data-url', data.item.url).attr('data-title', data.title)
	            .addClass('btn btn-dark btn-sm m-1 pl-3 pr-3')
	            .append($('<i>').addClass('fas pr-1').addClass(action.icon)).append(action.label);
	    };
	
	    Accordion.bindActions = function(w, data){
	        cardActions(w, data);
	        buttonActions(w);
	    };
	
	    var cardActions = function(w, data){
	        for(var key in data.cards) {
	            var cardHeader = $(w.document.body).find('#' + key);
	            var disabled = cardHeader.find('h6.text-muted');
	            if(disabled.length){
	                disabled.addClass('cursor-normal');
	                return;
	            }
	
	            $(w.document.body).find('#' + key).click(function() {
	                var id = $(this).attr('id');
	                $(w.document.body).find('div[aria-labelledby="' + id + '"]').toggle();
	            });
	        }
	    };
	
	    var buttonActions = function(w){
	        getButton(w, '.fa-clone').click(function(){ copyActionClick($(this), w) });
	        getButton(w, '.fa-film').click(function(){ openActionClick($(this), w) });
	        getButton(w, '.fa-download').click(function(){ downloadActionClick($(this), w) });
	    };
	
	    var getButton = function(w, iconClass){
	        return $(w.document.body).find(iconClass).parent();
	    };
	
	    var downloadActionClick = function (element, w) {
	        var options = {title: 'Rozpoczęto pobieranie pliku', content: element.attr('data-title')};
	        Tool.downloadFile(element.attr('data-url'), element.attr('data-title'));
	        Notification.show(options, w);
	    };
	
	    var copyActionClick = function (element, w) {
	        GM_setClipboard(element.attr('data-url'));
	        var options = {title: 'Kopiowanie', content: 'Skopiowano do schowka'};
	        Notification.show(options, w);
	    };
	
	    var openActionClick = function (element, w) {
	        w.open(element.attr('data-url'));
	    };
	
	    return Accordion;
	}(Accordion || {}));
	
	var Executor = (function(Executor){
	    var execute = function(service, options, w){
	        var setup = setupStep(service, options);
	        logStepInfo(options, setup);
	        if(setup.isRemote()){
	             executeAsync(service, setup, options, w);
	        }
	        else {
	            callback(service, options, w);
	        }
	    };
	
	    var executeAsync = function(service, setup, options, w){
	        var chain = options.chainNames[options.chainIndex];
	        var chainStep = chain + '[' + options.stepIndex + ']';
	        var exceptionParams = [chainStep, Tool.getRealUrl()];
	        var requestParams = {
	            method: setup.method,
	            headers: setup.headers,
	            url: setup.resolveUrl.url,
	            data: JSON.stringify(setup.methodParam()),
	            responseType: setup.responseType,
	            onload: function(data) {
	                var currentStep = getCurrentStep(service, options);
	                if(retryPossible(currentStep, options, data.status)){
	                    execute(service, options, w);
	                }
	                else {
	                    if(setup.responseType === 'jsonp'){
	                        var match = data.responseText.match(/callback\(([\s\S]*?)\);/);
	                        if(match && match[1] && !match[1].startsWith('null')){
	                            setStepResult(options, {async: JSON.parse(match[1])});
	                        }
	                    }
	                    else {
	                        setStepResult(options, {async: data.response || {}});
	                    }
	                    callback(service, options, w);
	                }
	            },
	            onerror: function(data){
	                DomTamper.handleError(new Exception(config.error.call, exceptionParams), w);
	            },
	            ontimeout: function(){
	                DomTamper.handleError(new Exception(config.error.timeout, exceptionParams), w);
	            }
	        };
	        GM_xmlhttpRequest(requestParams);
	    };
	
	    var retryPossible = function(step, options, status){
	        return step.retryErrorCodes.indexOf(status) >= 0 && step.urlTemplateParts[options.retries++];
	    };
	
	    var logStepInfo = function(options, setup){
	        var chain = options.chainNames[options.chainIndex];
	        var step = chain + '[' + options.stepIndex + ']';
	        var stepParams = $.isEmptyObject(setup.methodParam()) ? '' : JSON.stringify(setup.methodParam());
	        var params = [
	            'color:green', options.retries+1, 'color:black', ':',
	            'color:blue', step,  'color:red', setup.isRemote ? setup.method : '---',
	            'color:black;font-weight: bold', setup.resolveUrl.url, 'color:magenta', stepParams
	        ];
	        Tool.formatConsoleMessage('%c%s%c%s%c%s%c %s %c %s %c%s', params);
	    };
	
	    var setupStep = function(service, options){
	        var currentStep = getCurrentStep(service, options);
	        beforeStep(currentStep, options);
	        var setup = $.extend(true, {}, currentStep);
	        if(currentStep.isRemote()) {
	            setup.resolveUrl = currentStep.resolveUrl(getStepResult(options).before, options.retries);
	        }
	        return setup;
	    };
	
	    var getCurrentStep = function(service, options){
	        var chain = options.chainNames[options.chainIndex];
	        var steps = service.chains[chain];
	        return steps[options.stepIndex];
	    };
	
	    var beforeStep = function(currentStep, options){
	        var stepOutput = currentStep.before(getStepResult(options, true).after || {});
	        if(currentStep.isRemote()){
	            if(typeof stepOutput === 'string' || typeof stepOutput == 'number'){
	                var result = stepOutput;
	                stepOutput = {};
	                stepOutput[config.urlParamDefaultKey] = result;
	            }
	        }
	        setStepResult(options, {before: stepOutput});
	    };
	
	    var getStepResult = function(options, previous){
	        var chain = options.chainNames[options.chainIndex];
	        if(!options.results){
	            options.results = {};
	        }
	        if(!options.results[chain]){
	            options.results[chain] = [];
	        }
	        if(!options.results[chain][options.stepIndex]){
	            options.results[chain].push({});
	        }
	        var stepIndex = previous && options.stepIndex > 0 ? options.stepIndex - 1 : options.stepIndex;
	        return options.results[chain][stepIndex];
	    };
	
	    var setStepResult = function(options, object){
	        var chain = options.chainNames[options.chainIndex];
	        options.results[chain][options.stepIndex] = $.extend(true, getStepResult(options), object);
	    };
	
	    var hasNextStep = function(service, options){
	        var chain = options.chainNames[options.chainIndex];
	        var steps = service.chains[chain];
	        return steps.length - 1 > options.stepIndex;
	    };
	
	    var hasNextChain = function(service, options){
	        return options.chainNames.length - 1 > options.chainIndex;
	    };
	
	    var pushChain = function(service, options){
	        if(hasNextChain(service, options)){
	            options.chainIndex += 1;
	            options.stepIndex = 0;
	            return true;
	        }
	        return false;
	    };
	
	    var pushStep = function(service, options) {
	        if(hasNextStep(service, options)){
	            options.stepIndex += 1;
	            return true;
	        }
	        return false;
	    };
	
	    var afterStep = function(service, options) {
	        var currentStep = getCurrentStep(service, options);
	        var previousResult = currentStep.isRemote() ? getStepResult(options).async : getStepResult(options).before;
	        var output = currentStep.after(previousResult || {});
	        options.retries = 0;
	        setStepResult(options, {after: output});
	    };
	
	    var callback = function(service, options, w){
	        try {
	            afterStep(service, options);
	            if(pushStep(service, options) || pushChain(service, options)) {
	                return Promise.resolve().then(
	                    Executor.chain(service, options, w)
	                );
	            }
	            else {
	                return Promise.resolve().then(
	                    service.onDone(options.results, w)
	                );
	            }
	        }
	        catch(e){
	            DomTamper.handleError(e, w);
	        }
	    };
	
	    Executor.chain = function(service, options, w){
	        try {
	            if(w === undefined){
	                w = window.open();
	                DomTamper.createLoader(w, service);
	            }
	
	            execute(service, options, w);
	        }
	        catch(e){
	            DomTamper.handleError(e, w);
	        }
	    };
	
	    return Executor;
	}(Executor || {}));
	
	function Configurator(properties){
	    var service = {
	        observer: {
	            anchor: undefined,
	            mode: 'added',
	            selector: undefined
	        },
	        injection: {
	            selector: properties.observer.selector,
	            id: 'direct-download',
	            class: '',
	        },
	        cardsData: {
	            title: '',
	            cards: {
	                videos: {
	                    icon: 'fa-video', label: 'Video', collapse: true, items: [],
	                    info: [
	                        {name: 'video', desc: 'video'},
	                        {name: 'audio', desc: 'audio'},
	                        {name: 'language', desc: 'wersja językowa'}
	                    ],
	                    actions: [
	                        {label: 'Pobierz', icon: 'fa-download'},
	                        {label: 'Kopiuj', icon: 'fa-clone'},
	                        {label: 'Otwórz', icon: 'fa-film'}
	                    ]
	                },
	                subtitles: {
	                    icon: 'fa-file-alt', label: 'Napisy', collapse: false, items: [],
	                    info: [
	                        {name: 'description', desc: 'opis'},
	                        {name: 'format', desc: 'format'},
	                    ],
	                    actions: [
	                        {label: 'Pobierz', icon: 'fa-download'}
	                    ]
	                }
	            }
	        },
	        chains: {
	            videos: []
	        },
	        chainSelector: function(){
	            return ['videos'];
	        },
	        formatter: function(data){
	            data.cards['videos'].items.sort(function (a, b) {
	                return a.index - b.index;
	            });
	            data.cards['subtitles'].items.sort(function (a, b) {
	                return ('' + a.format).localeCompare(b.format);
	            });
	        },
	        aggregate: function(data){
	            var aggregatedData = {};
	            $.extend(true, aggregatedData, service.cardsData);
	            var chains = service.chainSelector();
	            chains.forEach(function(chain){
	                var extend = data[chain][data[chain].length - 1].after;
	                $.extend(true, aggregatedData, extend);
	            });
	            return aggregatedData;
	        },
	        onDone: function(data, w) {
	            var aggregatedData = service.aggregate(data);
	            service.formatter(aggregatedData);
	            DomTamper.createDocument(aggregatedData, w);
	        },
	        ready: function(){
	            return $(service.observer.selector).length > 0;
	        },
	        click: function(){
	            var chainNames = service.chainSelector();
	            Executor.chain(service, {
	                stepIndex: 0,
	                chainIndex: 0,
	                retries: 0,
	                chainNames: chainNames
	            });
	        },
	        inject: function(){
	            var icon = $('<i>').addClass('fas fa-video')
	            var div = $('<div>')
	                .attr('id', service.injection.id).attr('title', 'pobierz video')
	                .append(icon).addClass('video_button').addClass(service.injection.class);
	            $(service.observer.selector).hover(() => div.show(), () => div.hide());
	            return div;
	        },
	    };
	
	    return $.extend(true, service, properties);
	}
	
	var Detector = (function(conf) {
	    var configuration = conf;
	
	    var logObservation = function(){
	        var observer = configuration.properties.observer;
	        var color = configuration.properties.ready() ? 'color:green' : 'color:red';
	        var anchor = observer.anchor ? observer.anchor + '->' : '';
	        var params = [color, anchor + observer.selector, 'color:black'];
	        Tool.formatConsoleMessage('[%c%s%c]', params);
	    };
	
	    this.observe = function(){
	        var observer = configuration.properties.observer;
	        if(configuration.properties.ready()){
	            logObservation();
	            configuration.successCallback();
	        }
	        else {
	            $(observer.anchor).observe(observer.mode, observer.selector, function(record) {
	                logObservation();
	                configuration.successCallback();
	            });
	        }
	    };
	});
	
	var ElementDetector = (function(ElementDetector){
	    ElementDetector.detect = function(properties, callback){
	        var detector = new Detector({
	            properties: properties,
	            successCallback: callback
	        });
	        detector.observe();
	    };
	
	    return ElementDetector;
	}(ElementDetector || {}));
	
	var Unloader = (function(Unloader) {
	    var win;
	    var url;
	
	    Unloader.init = function(w){
	        win = w;
	        url = Tool.getRealUrl();
	        $(window).bind('beforeunload', function(){
	            if(!win.closed) {
	                DomTamper.handleError(new Exception(config.error.noParent, url), win);
	            }
	        });
	    };
	
	    return Unloader;
	}(Unloader || {}));
	
	var MessageReceiver = (function(MessageReceiver) {
	    var win;
	    var origin;
	    var callbackFunction;
	    var alreadyConfirmed = false;
	    var alreadyPosted = false;
	
	    var receiveMessage = function(event, callback){
	        if (event.origin !== origin) {
	            return;
	        }
	
	        var data = parseJSON(event.data);
	        if($.isEmptyObject(data)){
	            return;
	        }
	        if(data.confirmation){
	            alreadyConfirmed = true;
	        }
	        else {
	            data.confirmation = true;
	            if(!alreadyPosted) {
	                window.removeEventListener('message', callbackFunction);
	                alreadyPosted = true;
	                postMessage(data);
	                callback(data);
	            }
	        }
	    };
	
	    var parseJSON = function(json) {
	        if (typeof json == 'object')
	            return {};
	        try {
	            return JSON.parse(json);
	        }
	        catch(e) {
	            return {};
	        }
	    };
	
	    var postMessage = function(data){
	        data = JSON.stringify(data);
	        win.postMessage(data, '*');
	    };
	
	    MessageReceiver.awaitMessage = function(object, callback){
	        initCommunication(object, callback);
	    };
	
	    var initCommunication = function(object, callback){
	        callbackFunction = function(e){
	            receiveMessage(e, callback);
	        };
	        window.addEventListener('message', callbackFunction);
	        win = getProperty(object, 'windowReference');
	        origin = getProperty(object, 'origin');
	    };
	
	    var getProperty = function(object, prop){
	        if(object.hasOwnProperty(prop)){
	            return object[prop];
	        }
	    };
	
	    MessageReceiver.postUntilConfirmed = function(object){
	        initCommunication(object);
	        isMessageConfirmed(config.attempts, getProperty(object, 'message'))
	    };
	
	    var isMessageConfirmed = function(attempt, message){
	        if (alreadyConfirmed || attempt <= 0) {
	            return Promise.resolve().then(function(){
	                window.removeEventListener('message', callbackFunction);
	                if(attempt <= 0){
	                    console.warn("Nie udało się przekazać adresu z okna głównego.");
	                }
	            });
	        } else if(attempt > 0){
	            attempt = attempt-1;
	            postMessage(message);
	            return Promise.resolve().then(
	                setTimeout(isMessageConfirmed, config.attemptTimeout, attempt, message)
	            );
	        }
	    };
	
	    return MessageReceiver;
	}(MessageReceiver || {}));
	
	var Common = (function(Common) {
	    Common.grabIplaSubtitlesData = function(data){
	        var items = [];
	        var subtitles = (((data.result || {}).mediaItem || {}).displayInfo || {}).subtitles || [];
	        subtitles.forEach(function(subtitle) {
	            items.push({
	                url: subtitle.src,
	                description: subtitle.name,
	                format: subtitle.format
	            })
	        });
	        return {
	            cards: {subtitles: {items: items}}
	        };
	    };
	
	    Common.run = function(properties){
	        DomTamper.injectStylesheet(window, config.include.fontawesome);
	        HistoryTamper.onLocationChange(function () {
	            DomTamper.removeButton(properties);
	        });
	        ElementDetector.detect(properties, function () {
	            DomTamper.createButton(properties);
	        });
	    };
	
	    Common.createProperties = function(anchor, selector, mode) {
	        return {
	            observer: {
	                anchor: anchor,
	                mode: mode ? mode : 'added',
	                selector: selector,
	            },
	            ready: function() {
	                return $(this.observer.selector).length > 0;
	            }
	        };
	    };
	
	    return Common;
	}(Common || {}));
	
	var TVP = (function() {
	    var dataAttributeParser = function() {
	        var src = $(properties.observer.selector).attr('data-video-id');
	        if(src !== undefined){
	            return {
	                videoId: src.split("/").pop()
	            };
	        }
	
	        return urlForwardParser();
	    };
	
	    var urlForwardParser = function() {
	        var urlMatch = window.location.href.match(/^https?:\/\/.*\.tvp\..*\/(\d{6,})\/.*$/);
	        if(urlMatch && urlMatch[1]){
	            return urlMatch[1];
	        }
	
	        return urlParameterParser();
	    };
	
	    var urlParameterParser = function(){
	        var id = Tool.getUrlParameter('object_id', window.location.href);
	        if(id){
	            return id;
	        }
	
	        throw new Exception(config.error.id, window.location.href);
	    };
	
	    var properties = new Configurator({
	        observer: {
	            selector: '#JS-TVPlayer2-Wrapper, #player2, .news-video__overlay, .player-video-container, #tvplayer'
	        },
	        injection: {
	            class: 'white'
	        },
	        chains: {
	            videos: [
	                new Step({
	                    urlTemplate: 'https://tvp.pl/pub/stat/videofileinfo?video_id=#videoId',
	                    before: function (input) {
	                        return dataAttributeParser();
	                    }
	                }),
	                new Step({
	                    urlTemplate: 'https://vod.tvp.pl/sess/TVPlayer2/api.php?id=#videoId&@method=getTvpConfig' +
	                        '&@callback=callback',
	                    responseType: 'jsonp',
	                    before: function (input) {
	                        return getRealVideoId(input);
	                    },
	                    after: function(input){
	                        return grapVideoData(input);
	                    }
	                })
	            ]
	        }
	    });
	
	    var getRealVideoId = function(json){
	        var videoId = json.copy_of_object_id !== undefined ?
	            json.copy_of_object_id : json.video_id;
	        return {
	            videoId: videoId
	        };
	    };
	
	    var grapVideoData = function(data){
	        var items = [];
	        var subtitlesItems = [];
	        var info = ((data || {}).content || {}).info || {};
	        var files = ((data || {}).content || {}).files || [];
	        var subtitles = ((data || {}).content || {}).subtitles || [];
	        var files = removeUnsupportedVideoFormats(files);
	        if(files.length) {
	            files.forEach(function (file) {
	                var videoDesc = file.quality.bitrate;
	                items.push(Tool.mapDescription({
	                    source: 'TVP',
	                    key: videoDesc,
	                    video: videoDesc,
	                    url: file.url
	                }));
	            });
	            subtitles.forEach(function(subtitle) {
	                var extension = subtitle.type;
	                subtitlesItems.push({
	                    url: 'https:' + subtitle.url,
	                    format: extension,
	                    description: subtitle.lang
	                })
	            });
	
	            return {
	                title: (info.title != null ? info.title : '') + (info.subtitle != null ? ' ' + info.subtitle : ''),
	                cards: {
	                    videos: {items: items},
	                    subtitles: {items: subtitlesItems}
	                }
	            }
	        }
	        throw new Exception(config.error.noSource, window.location.href);
	    };
	
	    var removeUnsupportedVideoFormats = function(files){
	        var result = [];
	        files.forEach(function (file) {
	            if (file['type'] === 'any_native') {
	                result.push(file);
	            }
	        });
	        return result;
	    };
	
	
	    this.setup = function(){
	        Common.run(properties);
	    };
	});
	
	var TVN = (function() {
	    var properties = new Configurator({
	        observer: {
	            anchor: 'body',
	            selector: 'div.cover-buttons > a[href="#"], #player-container, div.custom-alert-inner-wrapper'
	        },
	        injection: {
	            selector: 'div.right-side'
	        },
	        inject: function(){
	            var icon = $('<i>').addClass('fas fa-video');
	            var button = $('<div>')
	                .attr('id', properties.injection.id).attr('title', 'pobierz video')
	                .append(icon).addClass('btn btn-login');
	            return button;
	        },
	        chains: {
	            videos: [
	                new Step({
	                    urlTemplate: 'http://player.pl/api/?platform=ConnectedTV&terminal=Panasonic&format=json' +
	                        '&authKey=064fda5ab26dc1dd936f5c6e84b7d3c2&v=3.1&m=getItem&id=#videoId',
	                    before: function(input){
	                        return idParser();
	                    },
	                    after: function(output) {
	                        return grabVideoData(output);
	                    }
	                })
	            ]
	        },
	    });
	
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
	
	        return serialIdParser();
	    };
	
	    var serialIdParser = function () {
	        var match = window.location.href.match(/odcinki,(\d+)/);
	        if(match && match[1]){
	            throw new Exception(config.error.tvnId, Tool.getRealUrl());
	        }
	
	        return vodIdParser();
	    };
	
	    var vodIdParser = function(){
	        var match = window.location.href.match(/,(\d+)/);
	        if(match && match[1]){
	            return match[1];
	        }
	
	        throw new Exception(config.error.tvnId, Tool.getRealUrl());
	    };
	
	    var grabVideoData = function(data){
	        var items = [];
	        var main = ((data.item || {}).videos || {}).main || {};
	        var video_content = main.video_content || {};
	        if(main.video_content_license_type !== 'WIDEVINE' && video_content && video_content.length > 0){
	            $.each(video_content, function( index, value ) {
	                items.push(Tool.mapDescription({
	                    source: 'TVN',
	                    key: value.profile_name,
	                    video: value.profile_name,
	                    url: value.url
	                }));
	            });
	
	            return {
	                title: getTitle(data),
	                cards: {videos: {items: items}}
	            }
	        }
	        throw new Exception(config.error.noSource, Tool.getRealUrl());
	    };
	
	    var getTitle = function(data){
	        var episode = data.item.episode ? 'E'+Tool.pad(data.item.episode, 2) : '';
	        var season = data.item.season != null ? 'S'+Tool.pad(data.item.season, 2) : '';
	        var serie_title = data.item.serie_title != null ? data.item.serie_title : '';
	        var episodeTitle = data.item.title ? ' ' + data.item.title : '';
	        var seasonAndEpisode = season + episode;
	
	        return serie_title + (seasonAndEpisode !== '' ? ' - ' + seasonAndEpisode : '') +
	            (episodeTitle !== '' ? ' - ' + episodeTitle : '');
	    };
	
	    var inVodFrame = function(){
	        var regexp = new RegExp('https:\/\/player\.pl(.*)');
	        var match = regexp.exec(window.location.href);
	        if(match[1]) {
	            window.sessionStorage.setItem(config.storage.topWindowLocation, 'https://vod.pl' + match[1]);
	        }
	    };
	
	    this.setup = function(){
	        if(!Tool.isTopWindow()) {
	            inVodFrame();
	        }
	
	        Common.run(properties);
	    };
	});
	
	var IPLA = (function() {
	    var properties = new Configurator({
	        observer: {
	            anchor: 'app-root',
	            selector: 'div.player-wrapper, div.promo-box:visible, div.player-error-presentation:visible'
	        },
	        injection: {
	            class: 'small_padding'
	        },
	        chainSelector: function(){
	            return ['videos', 'subtitles'];
	        },
	        chains: {
	            videos: [
	                new Step({
	                    urlTemplateParts: [
	                      'ua=www_iplatv_html5/12345',
	                      'ua=mipla_ios/122'
	                    ],
	                    urlTemplate: 'https://getmedia.redefine.pl/vods/get_vod/?cpid=1&~&media_id=#videoId',
	                    retryErrorCodes: [404],
	                    before: function (input) {
	                        return grabVideoIdFromUrl();
	                    },
	                    after: function(data){
	                        return grabVideoData(data);
	                    }
	                })
	            ],
	            subtitles: [
	                new Step({
	                    urlTemplate: 'https://b2c.redefine.pl/rpc/navigation/',
	                    method: 'POST',
	                    methodParam: function(){
	                        return getParamsForSubtitles();
	                    },
	                    after: Common.grabIplaSubtitlesData
	                })
	            ]
	        }
	    });
	
	    var grabVideoData = function(data){
	        var items = [];
	        var vod = data.vod || {};
	        if(vod.copies && vod.copies.length > 0 && !vod.drm){
	            $.each(vod.copies, function( index, value ) {
	                var videoDesc = value.quality_p + ', ' + value.bitrate;
	                items.push(Tool.mapDescription({
	                    source: 'IPLA',
	                    key: value.quality_p,
	                    video: videoDesc,
	                    url: value.url
	                }));
	            });
	            return {
	                title: vod.title,
	                cards: {videos: {items: items}}
	            }
	        }
	        throw new Exception(config.error.noSource, Tool.getRealUrl());
	    };
	
	    var getParamsForSubtitles = function(){
	        var mediaId = grabVideoIdFromUrl();
	        return {
	            jsonrpc: "2.0",
	            id: 1,
	            method: "prePlayData",
	            params: {
	                userAgentData: {
	                    application: "firefox",
	                    portal: "ipla"
	                },
	                cpid: 1,
	                mediaId: mediaId
	            }
	        }
	    };
	
	    this.setup = function(){
	        Common.run(properties);
	    };
	
	    var matchingId = function(input, failureAction){
	        input = input ? input : '';
	        var match = matchingHexId(input);
	        if(!match){
	            match = matchingDecId(input);
	        }
	        return match ? match : failureAction();
	    };
	
	    var matchingHexId = function(input){
	        var match = input.match(/[0-9a-f]{32}/);
	        if(match && match[0]) {
	            return match[0];
	        }
	
	        return null;
	    };
	
	    var matchingDecId = function(input) {
	        var match = input.match(/([\d]+)?(\?.*)$/);
	        if(match && match[1]) {
	            return match[1];
	        }
	
	        return null;
	    };
	
	    var grabVideoIdFromUrl = function(){
	        return matchingId(location.href, grabVideoIdFromWatchingNowElement);
	    };
	
	    var grabVideoIdFromWatchingNowElement = function(){
	        return matchingId($('div.vod-image-wrapper__overlay').closest('a').attr('href'), grabVideoIdFromHtmlElement);
	    };
	
	    var grabVideoIdFromHtmlElement = function(){
	        var frameSrc = $('app-commercial-wallpaper iframe:first-child').attr('src');
	        if(frameSrc !== undefined) {
	            return Tool.getUrlParameter('vid', frameSrc);
	        }
	        throw new Exception(config.error.id, Tool.getRealUrl());
	    };
	});
	
	var VOD = (function() {
	    var properties = new Configurator({
	        observer: {
	            selector: '#v_videoPlayer'
	        },
	        injection: {
	            class: 'right'
	        },
	        chains: {
	            videos: [
	                new Step({
	                    urlTemplate: 'https://player-api.dreamlab.pl/?body[id]=#videoId&body[jsonrpc]=2.0' +
	                        '&body[method]=get_asset_detail&body[params][ID_Publikacji]=#videoId' +
	                        '&body[params][Service]=vod.onet.pl&content-type=application/jsonp' +
	                        '&x-onet-app=player.front.onetapi.pl&callback=',
	                    before: function (input) {
	                        return idParser();
	                    },
	                    after: function (output) {
	                        return grabVideoData(output);
	                    }
	                })
	            ]
	        }
	    });
	
	    var idParser = function () {
	        var id = $(".mvp").attr('id');
	        if(id !== undefined){
	            return id.match(/mvp:(.+)/)[1];
	        }
	
	        return parseFromJS();
	    };
	
	    var parseFromJS = function(){
	        var scripts = $('script[type="text/javascript"]').filter(':not([src])');
	        for (var i = 0; i < scripts.length; i++) {
	            var match = $(scripts[i]).text().match(/\"mvpId\"\s*:\s*\"(\d+\.\d+)\"/);
	            if(match && match[1]){
	                return match[1];
	            }
	        }
	
	        throw new Exception(config.error.id, Tool.getRealUrl());
	    };
	
	    var grabVideoData = function (data) {
	        var items = [];
	        var subtitlesItems = [];
	        var video = (((data.result || new Array())[0] || {}).formats || {}).wideo || {};
	        var meta = ((data.result || new Array())[0] || {}).meta || {};
	        var subtitles = meta.subtitles || [];
	        var videoData = video['mp4-uhd'] && video['mp4-uhd'].length > 0 ? video['mp4-uhd'] : video['mp4'];
	        if(videoData && videoData.length > 0){
	            videoData.forEach(function(value) {
	                var videoDesc = value.vertical_resolution + ', ' + value.video_bitrate;
	                items.push(Tool.mapDescription({
	                    source: 'VOD',
	                    key: value.vertical_resolution,
	                    video: videoDesc,
	                    url: value.url
	                }));
	            });
	
	            subtitles.forEach(function(subtitle) {
	                var extension = subtitle.name.split('.').pop();
	                subtitlesItems.push({
	                    url: subtitle.url,
	                    format: extension,
	                    description: subtitle.name
	                })
	            });
	
	            return {
	                title: meta.title,
	                cards: {
	                    videos: {items: items},
	                    subtitles: {items: subtitlesItems}
	                }
	            }
	        }
	        throw new Exception(config.error.noSource, Tool.getRealUrl());
	    };
	
	    var iplaDetected = function(){
	        return $('#v_videoPlayer div.pulsembed_embed').length > 0;
	    };
	
	    var workWithSubService = function(){
	        var src = 'https://pulsembed.eu';
	        var frameSelector = 'iframe[src^="' + src + '"]';
	        var properties = Common.createProperties('div.pulsembed_embed', frameSelector);
	
	        ElementDetector.detect(properties, function () {
	            MessageReceiver.postUntilConfirmed({
	                windowReference: $(frameSelector).get(0).contentWindow,
	                origin: src,
	                message: {
	                    location: window.location.href
	                }
	            });
	        });
	    };
	
	    this.setup = function(){
	        if(iplaDetected()) {
	            workWithSubService();
	        }
	        else if(Tool.isTopWindow()){
	            Common.run(properties);
	        }
	    };
	});
	
	var VOD_IPLA = (function() {
	    var properties = new Configurator({
	        observer: {
	            anchor: 'body',
	            selector: '#player-wrapper, #playerContainer'
	        },
	        chainSelector: function(){
	            return ['videos', 'subtitles'];
	        },
	        chains: {
	            videos: [
	                new Step({
	                    urlTemplate: 'https://distro.redefine.pl/partner_api/v1/2yRS5K/media/#media_id/vod/player_data?' +
	                        'dev=pc&os=linux&player=html&app=firefox&build=12345',
	                    before: function (input) {
	                        return {media_id: idParser()};
	                    },
	                    after: function(data){
	                        return grabVideoData(data);
	                    }
	                })
	            ],
	            subtitles: [
	                new Step({
	                    after: function (input) {
	                        return Common.grabIplaSubtitlesData(getJson());
	                    }
	                })
	            ]
	        }
	    });
	
	    var grabVideoData = function(data){
	        var items = [];
	        var displayInfo = (data.mediaItem || {}).displayInfo || {};
	        var mediaSources = ((data.mediaItem || {}).playback || {}).mediaSources || {};
	        var videos = $.grep(mediaSources, function(source) {
	            return source.accessMethod === 'direct';
	        });
	        if(videos && videos.length > 0){
	            $.each(videos, function( index, value ) {
	                items.push(Tool.mapDescription({
	                    source: 'IPLA',
	                    key: value.quality,
	                    video: value.quality,
	                    url: value.url
	                }));
	            });
	            return {
	                title: displayInfo.title,
	                cards: {videos: {items: items}}
	            }
	        }
	        throw new Exception(config.error.noSource, Tool.getRealUrl());
	    };
	
	    var getJson = function(){
	        var match = $('script:not(:empty)').text().match(/(window\.CP\.embedSetup\()(.*)\);/);
	        if(match) {
	            var jsonObject = JSON.parse(match[2]);
	            return JSON.parse(jsonObject[0].media);
	        }
	
	        return {};
	    };
	
	    var idParser = function(){
	        try {
	            if($('#player-wrapper').length > 0) {
	                return (((getJson() || {}).result || {}).mediaItem || {}).id;
	            }
	            else if($('#playerContainer').length > 0){
	                return getMediaId();
	            }
	        }
	        catch(e){
	            throw new Exception(config.error.id, Tool.getRealUrl());
	        }
	    };
	
	    var getMediaId = function(){
	        var match = $('script:not(:empty)').text().match(/mediaId: "(\w+)",/);
	        return match[1];
	    };
	
	    this.setup = function(){
	        var callback = function(data) {
	            window.sessionStorage.setItem(config.storage.topWindowLocation, data.location);
	            Common.run(properties);
	        };
	        MessageReceiver.awaitMessage({
	            origin: 'https://pulsembed.eu',
	            windowReference: window.parent
	        }, callback);
	    };
	});
	
	var WP = (function() {
	    var properties = new Configurator({
	        observer: {
	            anchor: 'body',
	            selector: 'div.npp-container'
	        },
	        injection: {
	            class: 'small_padding white'
	        },
	        chains: {
	            videos: [
	                new Step({
	                    urlTemplate: 'https://wideo.wp.pl/player/mid,#videoId,embed.json',
	                    before: function (input) {
	                        return idParser();
	                    },
	                    after: function (output) {
	                        return grabVideoData(output);
	                    }
	                })
	            ]
	        }
	    });
	
	    var idParser = function () {
	        try {
	            var id = window.location.href.match(/^(.*)-(\d+)v$/)[2];
	            //__NEXT_DATA__ is a variable on page
	            return __NEXT_DATA__.props.initialPWPState.material[id].mid;
	        }
	        catch(e){
	            throw new Exception(config.error.id, window.location.href);
	        }
	    };
	
	    var grabVideoData = function(data){
	        var items = [];
	        var urls = (data.clip || {}).url || {};
	        if(urls && urls.length > 0){
	            $.each(urls, function( index, value ) {
	                if(value.type === 'mp4@avc'){
	                    var videoDesc = value.quality + ', ' + value.resolution;
	                    items.push(Tool.mapDescription({
	                        source: 'WP',
	                        key: value.quality,
	                        video: videoDesc,
	                        url: value.url
	                    }));
	                }
	            });
	            return {
	                title: data.clip.title,
	                cards: {videos: {items: items}}
	            }
	        }
	        throw new Exception(config.error.noSource, window.location.href);
	    };
	
	    this.setup = function(){
	        Common.run(properties);
	    };
	});
	
	var CDA = (function() {
	    var properties = new Configurator({
	        observer: {
	            selector: '.pb-player-content'
	        },
	        injection: {
	            class: 'right'
	        },
	        chains: {
	            videos: [
	                new Step({
	                    before: function(input){
	                        return getDestinationUrl();
	                    },
	                    after: function (input) {
	                        return grabVideoData(input);
	                    }
	                })
	            ]
	        }
	    });
	
	    var getDestinationUrl = function(){
	        var url = $("video.pb-video-player").attr('src');
	        if(url !== undefined){
	            if(!url.match(/blank\.mp4/)){
	                return url;
	            }
	            else if(l !== undefined){
	                return l;
	            }
	        }
	        throw new Exception(config.error.id, window.location.href);
	    };
	
	    var grabVideoData = function(data){
	        var items = [];
	        var title = $('meta[property="og:title"]');
	        var quality = $('.quality-btn-active');
	        var videoDesc = quality.length > 0 ? quality.text() : '-';
	        items.push(Tool.mapDescription({
	            source: 'CDA',
	            key: videoDesc,
	            video: videoDesc,
	            audio: '-',
	            url: data
	        }));
	        return {
	            title: title.length > 0 ? title.attr('content').trim() : 'brak danych',
	            cards: {videos: {items: items}}
	        };
	    };
	
	    this.setup = function(){
	        Common.run(properties);
	    };
	});
	
	var NINATEKA = (function() {
	    var properties = new Configurator({
	        observer: {
	            selector: '#videoPlayer, #player'
	        },
	        injection: {
	            class: 'small_padding'
	        },
	        chains: {
	            videos: [
	                new Step({
	                    before: function(input){
	                        return getVideoUrls();
	                    },
	                    after: function (input) {
	                        return grabVideoData(input);
	                    }
	                })
	            ]
	        }
	    });
	
	    var grabVideoData = function(results){
	        var items = [];
	        var title = $('meta[name="title"]').attr('content').trim();
	        if(results && results.length > 0){
	            $.each(results, function(index, value ) {
	                items.push(Tool.mapDescription({
	                    source: 'NINATEKA',
	                    key: 'def',
	                    url: value
	                }));
	            });
	            return {
	                title: title.length > 0 ? title : 'brak danych',
	                cards: {videos: {items: items}}
	            }
	        }
	        throw new Exception(config.error.noSource, window.location.href);
	    };
	
	    var getVideoUrls = function(){
	        var videoPlayer = $('#videoPlayer').data('player-setup');
	        var sources = (videoPlayer || {}).sources || [];
	        if(sources.length == 0){
	            var scripts = $('script[type="text/javascript"]').filter(':not([src])');
	            for (var i = 0; i < scripts.length; i++) {
	                var match = $(scripts[i]).text().match(/fn_\S+\(playerOptionsWithMainSource,\s*\d+\)\.sources/g);
	                if(match && match[0]){
	                    sources = eval(match[0]);
	                    break;
	                }
	            }
	        }
	        return getMp4Source(sources);
	    };
	
	    var getMp4Source = function(sources){
	        var results = [];
	        for(var i = 0; i < sources.length; i++){
	            if(sources[i].type && sources[i].type.match(/mp4/g)){
	                results.push(sources[i].src);
	            }
	        }
	        if(results.length > 0){
	            return results
	        }
	
	        throw new Exception(config.error.noSource, window.location.href);
	    };
	
	    this.setup = function(){
	        Common.run(properties);
	    };
	});
	
	var ARTE = (function() {
	    var properties = new Configurator({
	        observer: {
	            anchor: 'div.video-thumbnail',
	            selector: 'div.avp-player'
	        },
	        chains: {
	            videos: [
	                new Step({
	                    urlTemplate: 'https://api.arte.tv/api/player/v1/config/#langCode/#videoId',
	                    before: function (input) {
	                        return idParser();
	                    },
	                    after: function (output) {
	                        return grabVideoData(output);
	                    }
	                })
	            ]
	        },
	        formatter: function(data) {
	            data.cards['videos'].items.sort(function (a, b) {
	                return a.index - b.index;
	            });
	
	            var sortingOrder = {'POL': 1};
	            data.cards['videos'].items.sort(function (a, b) {
	                var aLangOrder = sortingOrder[a.langCode] ? sortingOrder[a.langCode] : -1,
	                    bLangOrder = sortingOrder[b.langCode] ? sortingOrder[b.langCode] : -1;
	                return bLangOrder - aLangOrder;
	
	            });
	        }
	    });
	
	    var detectLanguage = function() {
	        var regexp = new RegExp('https:\/\/www.arte\.tv\/(\\w{2})\/');
	        var match = regexp.exec(window.location.href);
	        return match[1];
	    };
	
	    var detectVideoId = function(){
	        var regexp = new RegExp('https:\/\/www.arte\.tv\/\\w{2}\/videos\/([\\w-]+)\/');
	        var match = regexp.exec(window.location.href);
	        return match[1];
	    };
	
	    var idParser = function() {
	        try {
	            return {
	                videoId: detectVideoId(),
	                langCode: detectLanguage()
	            };
	        }
	        catch(e){
	            throw new Exception(config.error.id, window.location.href);
	        }
	    };
	
	    var grabVideoData = function(data){
	        var items = [];
	        var title = (((data || {}).videoJsonPlayer || {}).eStat || {}).streamName || '';
	        var streams = ((data || {}).videoJsonPlayer || {}).VSR || {};
	        if(streams){
	            Object.keys(streams).filter(function(k, i) {
	                return k.startsWith("HTTPS");
	            }).forEach(function(k) {
	                var stream = streams[k];
	                var videoDesc = stream.width + 'x' + stream.height + ', ' + stream.bitrate;
	                items.push(Tool.mapDescription({
	                    source: 'ARTE',
	                    key: stream.bitrate,
	                    video: videoDesc,
	                    langCode: stream.versionShortLibelle,
	                    language: stream.versionLibelle,
	                    url: stream.url
	                }));
	            });
	            return {
	                title: title,
	                cards: {videos: {items: items}}
	            }
	        }
	        throw new Exception(config.error.noSource, window.location.href);
	    };
	
	    this.setup = function(){
	        Common.run(properties);
	    };
	
	});
	
	var TV_TRWAM = (function() {
	    var properties = new Configurator({
	        observer: {
	            anchor: '#ipott',
	            mode: 'removed',
	            selector: 'div[data-name="playerWindowPlace"]'
	        },
	        injection: {
	            class: 'white'
	        },
	        chains: {
	            videos: [
	                new Step({
	                    urlTemplate: 'https://api-trwam.app.insysgo.pl/v1/Tile/GetTiles',
	                    headers: {'Content-Type': 'application/json'},
	                    method: 'POST',
	                    methodParam: function(){
	                        return getParamsForVideo();
	                    },
	                    after: function(json) {
	                        return getCodename(json);
	                    }
	                }),
	                new Step({
	                    urlTemplate: 'https://api-trwam.app.insysgo.pl/v1/Player/AcquireContent?platformCodename=www&' +
	                        'codename=#codename',
	                    after: function(output) {
	                        return grabVideoData(output);
	                    }
	                })
	            ]
	        }
	    });
	
	    var grabVideoIdFromUrl = function(input){
	        var match = input.match(/\/(vod\.[\d]+)$/);
	        if(match && match[1]) {
	            return match[1];
	        }
	
	        throw new Exception(config.error.id, Tool.getRealUrl());
	    };
	
	    var getParamsForVideo = function(){
	        var mediaId = grabVideoIdFromUrl(window.location.href);
	        return {
	            platformCodename: "www",
	            tilesIds:[mediaId]
	        }
	    };
	
	    var getCodename = function(json){
	        var tile = (json.Tiles || [])[0] || {};
	        return {
	            title: tile.Title || {},
	            codename: tile.Codename || {}
	        };
	    };
	
	    var resolveKey = function(value){
	        var match = value.Url.match(/\/[\w]+_([\d]+p)\.mp4$/);
	        if(match && match[1]) {
	            return match[1];
	        }
	
	        return value.VideoBitrate;
	    };
	
	    var grabVideoData = function(data){
	        var items = [];
	        var streams = (((data || {}).MediaFiles || [])[0] || {}).Formats || [];
	        if(streams){
	            $.each(streams, function( index, value ) {
	                if(value.Type === 3){
	                    var key = resolveKey(value);
	                    items.push(Tool.mapDescription({
	                        source: 'TRWAM',
	                        key: key,
	                        video: key,
	                        url: value.Url
	                    }));
	                }
	            });
	            return {
	                cards: {videos: {items: items}}
	            }
	        }
	        throw new Exception(config.error.noSource, window.location.href);
	    };
	
	    this.setup = function(){
	        Common.run(properties);
	    };
	
	});
	
	var VOD_FRAME = (function() {
	    this.setup = function(){
	        var callback = function(data) {
	            var srcArray = ['https://redir.atmcdn.pl', 'https://partner.ipla.tv'];
	            setupDetector(srcArray, data);
	        };
	        MessageReceiver.awaitMessage({
	            origin: 'https://vod.pl',
	            windowReference: window.parent
	        }, callback);
	    };
	
	    var setupDetector = function(srcArray, data){
	        var selectors = createArrySelectors(srcArray);
	        var multiSelector = createMultiSelector(selectors);
	        var properties = Common.createProperties('div.iplaContainer', multiSelector);
	
	        ElementDetector.detect(properties, function() {
	            selectors.forEach(function(element){
	                if($(element.frameSelector).length > 0){
	                    MessageReceiver.postUntilConfirmed({
	                        windowReference: $(element.frameSelector).get(0).contentWindow,
	                        origin: element.src,
	                        message: {
	                            location: data.location
	                        }
	                    });
	                }
	            });
	        });
	    };
	
	    var createArrySelectors = function(srcArray){
	        return jQuery.map(srcArray, function(src) {
	            return {
	                src: src,
	                frameSelector: 'iframe[src^="' + src + '"]'
	            }
	        });
	    };
	
	    var createMultiSelector = function(selectors){
	        return $.map(selectors, function(src){
	            return src.frameSelector
	        }).join(', ');
	    }
	});
	
	var Starter = (function(Starter) {
	    var sources = [
	        {objectName: 'TVP', urlPattern: new RegExp(
	                '^https:\/\/(vod|cyfrowa)\.tvp\.pl\/video\/.*$|' +
	                '^https?:\/\/.*\.tvp\.(pl|info)\/sess\/TVPlayer2\/embed.*$|' +
	                '^https?:\/\/((?!wiadomosci).)*\.tvp\.pl\/\\d{6,}\/.*$|' +
	                '^https?:\/\/w{3}\.tvpparlament\.pl\/sess\/.*'
	            )
	        },
	        {objectName: 'TVN', urlPattern: new RegExp('^https:\/\/(?:w{3}\.)?(?:tvn)?player\.pl\/')},
	        {objectName: 'CDA', urlPattern: new RegExp('^https:\/\/.*\.cda\.pl\/')},
	        {objectName: 'VOD', urlPattern: new RegExp('^https:\/\/vod.pl\/')},
	        {objectName: 'VOD_IPLA', urlPattern: new RegExp(
	                '^https:\/\/partner\.ipla\.tv\/embed\/|' +
	                '^https:\/\/.*\.redcdn\.pl\/file\/o2\/redefine\/partner\/'
	            )
	        },
	        {objectName: 'IPLA', urlPattern: new RegExp('^https:\/\/w{3}\.ipla\.tv\/')},
	        {objectName: 'WP', urlPattern: new RegExp('^https:\/\/wideo\.wp\.pl\/')},
	        {objectName: 'NINATEKA', urlPattern: new RegExp('^https:\/\/ninateka.pl\/')},
	        {objectName: 'ARTE', urlPattern: new RegExp('^https:\/\/w{3}\.arte\.tv\/.*\/videos\/')},
	        {objectName: 'VOD_FRAME', urlPattern: new RegExp('^https:\/\/pulsembed\.eu\/')},
	        {objectName: 'TV_TRWAM', urlPattern: new RegExp('^https:\/\/tv-trwam\.pl\/local-vods\/')}
	    ];
	
	    Starter.start = function() {
	        sources.some(function(source){
	            if(source.urlPattern.exec(location.href)){
	                var object = eval('new ' + source.objectName + '()');
	                console.info('voddownloader: context: ' + source.objectName + ', url: ' + location.href);
	                object.setup();
	                return true;
	            }
	        });
	    };
	
	    return Starter;
	}(Starter || {}));
	
	$(document).ready(function(){
	    DomTamper.injectStyle(window, 'buttons_css');
	    Starter.start();
	});

}).bind(this)(jQuery, platform, Waves);
