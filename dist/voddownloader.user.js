// ==UserScript==
// @name           Skrypt umożliwiający pobieranie materiałów ze znanych serwisów VOD.
// @version        5.5.2
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
// @grant          GM_getResourceURL
// @grant          GM_xmlhttpRequest
// @grant          GM_download
// @grant          GM_notification
// @grant          GM_setClipboard
// @connect        tvp.pl
// @connect        getmedia.redefine.pl
// @connect        player-api.dreamlab.pl
// @run-at         document-end
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @resource       buttons_css https://raw.githubusercontent.com/zacny/voddownloader/master/dist/voddownloader-buttons.css
// @resource       loader_css https://raw.githubusercontent.com/zacny/voddownloader/master/dist/voddownloader-loader.css
// @resource       content_css https://raw.githubusercontent.com/zacny/voddownloader/master/dist/voddownloader-content.css
// ==/UserScript==

(function vodDownloader($) {
    'use strict';

    function Exception(message, description) {
	    this.message = message;
	    this.description = description;
	}
	
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
	
	
	var AsyncStep = (function(AsyncStep){
	    AsyncStep.setup = function(properties){
	        var step = {
	            urlTemplate: '',
	            beforeStep: function(input){return input},
	            afterStep: function (output) {return output},
	            resolveUrl: function (input) {
	                var url = this.urlTemplate;
	                if(typeof input === 'string'){
	                    return url.replace(new RegExp('#videoId', 'g'), input);
	                }
	                else if(typeof input === 'object') {
	                    $.each(input, function (key, value) {
	                        url = url.replace(new RegExp('#'+key,'g'), value);
	                    });
	                    return url;
	                }
	
	                return '';
	            }
	        };
	
	        return $.extend(true, step, properties);
	    };
	    return AsyncStep;
	}(AsyncStep || {}));
	
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
	        GM_notification({
	            title: 'Rozpoczęto pobieranie pliku',
	            text: name
	        });
	    };
	
	    return Tool;
	}(Tool || {}));
	
	var DomTamper = (function(DomTamper){
	
	    DomTamper.injectStyle = function(w, name){
	        var head = $(w.document.head);
	        if(!head.find('style[name="' + name + '"]').length){
	            var styleElement = $('<style>').attr('type', 'text/css')
	                .attr('name', name).text((GM_getResourceText(name)));
	            head.append(styleElement);
	        }
	    };
	
	    var injectFont = function(w) {
	        var head = $(w.document.head);
	
	        if(!head.find('style[name="font-awesome"]').length){
	            var font = $('<link>').attr('name', 'font-awesome').attr('type', 'text/css').attr('rel', 'stylesheet')
	                .attr('href', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');
	            head.append(font);
	        }
	    };
	
	    var prepareHead = function(w, name){
	        DomTamper.injectStyle(w, 'loader_css');
	        DomTamper.injectStyle(w, 'content_css');
	        injectFont(w);
	    };
	
	
	    var createBugReportLink = function(pageContent){
	        return $('<a>').attr('href', "https://github.com/zacny/voddownloader/issues")
	            .attr('id', 'bug-report').addClass('fa fa-bug tooltip')
	            .append(createTooltipText('tooltip-left', 'Zgłoś błąd'));
	    };
	
	    var prepareBody = function(w, pageContent) {
	        var body = $(w.document.body);
	        if(body.children().length > 0){
	            body.children(":first").replaceWith(pageContent);
	        }
	        else {
	            body.append(pageContent);
	        }
	    };
	
	    DomTamper.handleError = function(exception, w){
	        if(w === undefined){
	            w = window.open();
	        }
	
	        prepareHead(w, 'content_css');
	        var pageContent = $('<div>').addClass('page-content');
	        var container = $('<div>').addClass('container');
	        var cause = $('<div>').addClass('cause').text(exception.message);
	        container.append(cause);
	        if(exception.description !== undefined){
	            container.append($('<div>').text(exception.description));
	        }
	
	        pageContent.append(container).append(createBugReportLink());
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
	        DomTamper.injectStyle(w, 'loader_css');
	        injectFont(w);
	        var pageContent = $('<div>').addClass('page-content');
	        var container = $('<div>').addClass('container');
	        var loaderContent = $('<div>').addClass('loader-content');
	        var loaderText = $('<div>').addClass('loader-text').text('Trwa przetwarzanie...');
	        var loaderRing = $('<div>').addClass('loader-ring');
	
	        container.append(loaderContent.append(loaderText).append(loaderRing));
	        pageContent.append(container);
	
	        prepareBody(w, pageContent);
	    };
	
	    var createTooltipText = function(tooltipClass, tooltipMessage){
	      return $('<div>').addClass('tooltiptext').addClass(tooltipClass).text(tooltipMessage);
	    };
	
	    var createAction = function(iconClass, tooltipMessage){
	        return $('<a>').addClass('fa ' + iconClass + ' fa-2x margin tooltip').attr('href', '#')
	            .append(createTooltipText('tooltip-up', tooltipMessage));
	    };
	
	    var downloadActionClick = function (event) {
	        var data = event.data;
	        Tool.downloadFile(data.value.url, data.title);
	    };
	
	    var copyActionClick = function (data, w) {
	        var snackbar = $(w.document.body).find('#snackbar');
	        GM_setClipboard(data.value.url);
	        snackbar.text('Skopiowano do schowka.');
	        snackbar.addClass('animate');
	        setTimeout(function(){ snackbar.removeClass('animate'); }, 3000);
	    };
	
	    var createRow = function(data, rowClass, w){
	        var row = $('<tr>').addClass(rowClass);
	        var params = {title: data.title, value: data.value};
	        var actions = $('<td>').addClass('actions');
	        actions.append(createAction('fa-save', 'Zapisz').click(params, downloadActionClick));
	        actions.append(createAction('fa-clone', 'Kopiuj').click(
	            function() {
	                copyActionClick(data, w);
	            })
	        );
	        actions.append(
	            createAction('fa-film', 'Otwórz').attr('href', data.value.url)
	                .attr('rel', 'noopener').attr('target', '_blank')
	        );
	
	        var descriptionText = data.value.quality == undefined ?
	            'Bitrate: ' + data.value.bitrate :
	            'Bitrate: ' + data.value.bitrate + ', Jakość: '+ data.value.quality;
	        var description = $('<td>').text(descriptionText);
	
	        row.append(actions);
	        row.append(description);
	
	        return row;
	    };
	
	    var createTable = function(data, w){
	        var tbody = $('<tbody>');
	        var table = $('<table>').append(tbody);
	        var header = $('<tr>').append($('<th>').attr('colspan', 2).text(data.title));
	        tbody.append(header);
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
	
	        prepareHead(w, 'content_css');
	        setWindowTitle(data, w);
	        var pageContent = $('<div>').addClass('page-content');
	        pageContent.append(createTable(data, w));
	        pageContent.append($('<div>').attr('id', 'snackbar'));
	        pageContent.append(createBugReportLink());
	
	        prepareBody(w, pageContent);
	    };
	
	    return DomTamper;
	}(DomTamper || {}));
	
	var Executor = (function(Executor){
	    var executeAsync = function(service, stepIndex, w, input){
	        var asyncStep = service.asyncSteps[stepIndex];
	        var url = asyncStep.resolveUrl(asyncStep.beforeStep(input));
	        var requestParams = {
	            method: 'GET',
	            url: url,
	            responseType: 'json',
	            onload: function(data) {
	                asyncCallback(service, stepIndex, w, data.response);
	            },
	            onerror: function(){
	                DomTamper.handleError(new Exception(CONFIG.get('call_error')), w);
	            },
	            ontimeout: function(){
	                DomTamper.handleError(new Exception(CONFIG.get('timeout_error')), w);
	            }
	        };
	        GM_xmlhttpRequest(requestParams);
	    };
	
	    var asyncCallback = function(service, stepIndex, w, response){
	        try {
	            var currentStep = service.asyncSteps[stepIndex];
	            var nextStep = service.asyncSteps[stepIndex+1];
	            var output = currentStep.afterStep(response);
	            if(nextStep !== undefined) {
	                return Promise.resolve().then(
	                    Executor.asyncChain(service, stepIndex+1, output, w)
	                );
	            }
	            else {
	                return Promise.resolve().then(
	                    service.onDone(output, w)
	                );
	            }
	        }
	        catch(e){
	            DomTamper.handleError(new Exception(CONFIG.get('api_error'),
	                'Błąd przetwarzania odpowiedzi asynchronicznej.'), w);
	        }
	    };
	
	    Executor.asyncChain = function(service, stepIndex, input, w){
	        try {
	            if(w === undefined){
	                w = window.open();
	                DomTamper.createLoader(w);
	            }
	
	            executeAsync(service, stepIndex, w, input);
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
	                    Executor.asyncChain(service, 0);
	                }
	            },
	            asyncSteps: [],
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
	            return Promise.resolve().then(videoChangeCallback);
	        }
	        else {
	            return Promise.resolve().then(
	                setTimeout(checkVideoChange, CONFIG.get('attempt_timeout'), oldSrc, videoChangeCallback)
	            );
	        }
	    };
	
	    ChangeVideoDetector.run = function(videoChangeCallback){
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
	                setTimeout(checkWrapperExist, CONFIG.get('attempt_timeout'), attempt, properties)
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
	        checkWrapperExist(CONFIG.get('attempts'), properties);
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
	        asyncSteps: [
	            AsyncStep.setup({
	                urlTemplate: 'https://tvp.pl/pub/stat/videofileinfo?video_id=#videoId',
	                beforeStep: function(input){
	                   return idParser();
	                }
	            }),
	            AsyncStep.setup({
	                urlTemplate: 'https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=#videoId',
	                beforeStep: function(json){
	                    return getRealVideoId(json);
	                },
	                afterStep: function(output) {
	                    return VOD_TVP.grabVideoFormats(output);
	                }
	            })
	        ],
	    });
	
	    var idParser = function(){
	        var src = properties.wrapper.get().attr('data-id');
	        var videoId = src.split("/").pop();
	
	        if(videoId === null)
	            throw new Exception(CONFIG.get('id_error', 'Źródło: ' + src));
	
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
	        asyncSteps: [
	            AsyncStep.setup({
	                urlTemplate: 'https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=#videoId',
	                beforeStep: function(input){
	                    return idParser();
	                },
	                afterStep: function(output) {
	                    return VOD_TVP.grabVideoFormats(output);
	                }
	            })
	        ]
	    });
	
	    var idParser = function(){
	        try {
	            var src = $('iframe#JS-TVPlayer').attr('src');
	            return src.split("/").pop();
	        }
	        catch(e){
	            throw new Exception(CONFIG.get('id_error', 'Źródło: ' + src));
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
	        asyncSteps: [
	            AsyncStep.setup({
	                urlTemplate: 'https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=#videoId',
	                beforeStep: function(input){
	                    return idParser();
	                },
	                afterStep: function(output) {
	                    return VOD_TVP.grabVideoFormats(output);
	                }
	            })
	        ]
	    });
	
	    var idParser = function(){
	        try {
	            return $('div.js-video').attr('data-object-id');
	        }
	        catch(e){
	            throw new Exception(CONFIG.get('id_error', 'Źródło: ' + $('div.js-video').get(0)));
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
	        asyncSteps: [
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
	        ]
	    });
	
	    var idParser = function(){
	        var pageURL = $('.watching-now').closest('.embed-responsive').find('.embed-responsive-item').attr('href');
	        if(!pageURL){
	            pageURL = window.location.href;
	        }
	
	        var lastComma = pageURL.lastIndexOf(",");
	        if (lastComma > - 1) {
	            return pageURL.substring(lastComma+1);
	        }
	
	        throw new Exception(CONFIG.get('id_error', 'Źródło: ' + pageURL));
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
	        asyncSteps: [
	            AsyncStep.setup({
	                urlTemplate: 'https://getmedia.redefine.pl/vods/get_vod/?cpid=1' +
	                    '&ua=www_iplatv_html5/12345&media_id=#videoId',
	                beforeStep: function(input){
	                    return idParser();
	                },
	                afterStep: function(output) {
	                    return IPLA.grabVideoFormats(output);
	                }
	            })
	        ]
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
	            throw new Exception(CONFIG.get('id_error', 'Źródło: ' + frameSrc));
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
	        asyncSteps: [
	            AsyncStep.setup({
	                urlTemplate: 'https://player-api.dreamlab.pl/?body[id]=#videoId&body[jsonrpc]=2.0' +
	                    '&body[method]=get_asset_detail&body[params][ID_Publikacji]=#videoId' +
	                    '&body[params][Service]=vod.onet.pl&content-type=application/jsonp' +
	                    '&x-onet-app=player.front.onetapi.pl&callback=',
	                beforeStep: function(input){
	                    return idParser();
	                },
	                afterStep: function(output) {
	                    return formatParser(output);
	                }
	            })
	        ]
	    });
	
	    var idParser = function () {
	        try {
	            var id = $(".mvp").attr('id');
	            return id.match(/mvp:(.+)/)[1];
	        }
	        catch(e){
	            throw new Exception(CONFIG.get('id_error', 'Źródło: ' + id));
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
	        asyncSteps: [
	            AsyncStep.setup({
	                urlTemplate: 'https://getmedia.redefine.pl/vods/get_vod/?cpid=1&ua=www_iplatv_html5/12345' +
	                    '&media_id=#videoId',
	                beforeStep: function(input){
	                    return idParser();
	                },
	                afterStep: function(output) {
	                    return IPLA.grabVideoFormats(output);
	                }
	            })
	        ]
	    });
	
	    var idParser = function(){
	        try {
	            var match = $('script:not(:empty)').text().match(/(window\.CP\.embedSetup\()(.*)\);/);
	            var jsonObject = JSON.parse(match[2]);
	            return JSON.parse(jsonObject[0].media).result.mediaItem.id;
	        }
	        catch(e){
	            throw new Exception(CONFIG.get('id_error', 'Źródło: ' + match));
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
	        asyncSteps: [
	            AsyncStep.setup({
	                urlTemplate: 'https://video.wp.pl/player/mid,#videoId,embed.json',
	                beforeStep: function(input){
	                    return idParser();
	                },
	                afterStep: function(output) {
	                    return grabVideoFormats(output);
	                }
	            })
	        ]
	    });
	
	    var idParser = function () {
	        try {
	            var pageURL = window.location.href;
	            var regexp = new RegExp('mid,(\\d+),cid');
	            var match = regexp.exec(pageURL);
	            return match[1];
	        }
	        catch(e){
	            throw new Exception(CONFIG.get('id_error', 'Źródło: ' + pageURL));
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
	                    throw new Exception(CONFIG.get('call_error'), 'Upewnij się, że html5 player jest włączony.');
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
	        {action: TVP_REG.waitOnWrapper, pattern: new RegExp('^https:\/\/' + tvZones.join('|') + '\.tvp\.pl\/\d{6,}\/')},
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
	    console.info('jQuery: ' + $().jquery);
	    DomTamper.injectStyle(window, 'buttons_css');
	    Starter.start();
	});

}).bind(this)(jQuery);
