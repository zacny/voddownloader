// ==UserScript==
// @name         VOD Downloader
// @namespace    https://bitbucket.org/fzawicki/mediadownloader/src/master/
// @include      https://vod.tvp.pl/video/*
// @include      https://www.ipla.tv/*
// @include      https://player.pl/*
// @include      https://www.cda.pl/*
// @exclude      https://www.cda.pl/iframe/*
// @include      https://vod.pl/filmy/*
// @include      https://vod.pl/programy-onetu/*
// @include      https://vod.pl/da-vinci/*
// @include      https://vod.pl/seriale/*
// @include      https://vod.pl/programy-tv/*
// @include      https://redir.atmcdn.pl/*
// @include      https://*.redcdn.pl/file/o2/redefine/partner/*
// @version      1.3.2
// @description  Skrypt umożliwiający pobieranie materiałów ze znanych serwisów VOD. Działa tylko z rozszerzeniem Tampermonkey.
//               Cześć kodu pochodzi z:
//               https://greasyfork.org/pl/scripts/6049-skrypt-umo%C5%BCliwiaj%C4%85cy-pobieranie-materia%C5%82%C3%B3w-ze-znanych-serwis%C3%B3w-vod
//               miniskrypt.blogspot.com,
//               miniskrypt.hubaiitv.pl
// @author       fab
// @grant        none
// @run-at document-end
// @require https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// ==/UserScript==

(function vodDownloader() {
    'use strict';

    var $ = window.jQuery.noConflict(true);

    var ATTEMPTS = 20;
    var UNLIMITED_ATTEMPTS = -1;
    var ATTEMPT_TIMEOUT = 1500;
    var NO_ID_ERROR_MESSAGE = 'Nie udało się pobrać idetyfikatora.';
    var API_ERROR_MESSAGE = 'Brak informacji o wybranym materiale.'
    var CALL_ERROR_MESSAGE = 'Błąd pobierania informacji o materiale.';

    var Configurator = (function(Configurator){
        Configurator.setup = function(properties){
            var settings = {
                wrapper: {
                    selector: '',
                    get: function(){
                        return $(settings.wrapper.selector);
                    },
                    exist: function(){
                        return $(settings.wrapper.selector).length > 0;
                    }
                },
                button: {
                    id: 'direct-download',
                    style: '',
                    class: '',
                    click: function(){
                        VideoGrabber.grabVideoData(settings, 0);
                    }
                },
                grabber: {
                    urlTemplates: [],
                    idParser: function(){return null},
                    formatParser: function(data){return {title: null, formats: new Array()}}
                }
            };

            return $.extend(true, settings, properties);
        };
        return Configurator;
    }(Configurator || {}));

    var ChangeVideoDetector = (function(ChangeVideoDetector){
        var onVideoChange = function(){
            Starter.start();
        };

        var checkVideoChange = function(oldSrc) {
            var src = window.location.href;
            if(src !== undefined && oldSrc !== src){
                return Promise.resolve().then(onVideoChange);
            }
            else {
                return Promise.resolve().then(setTimeout(checkVideoChange, ATTEMPT_TIMEOUT, oldSrc));
            }
        };

        ChangeVideoDetector.run = function(){
            var src = window.location.href;
            checkVideoChange(src);
        };
        return ChangeVideoDetector;
    }(ChangeVideoDetector || {}));

    var WrapperDetector = (function(WrapperDetector){
        var onWrapperExist = function(properties, runChangeVideoDecetor){
            if(properties.wrapper.exist()) {
                DomTamper.createButton(properties);
                if(runChangeVideoDecetor){
                    ChangeVideoDetector.run();
                }
            }
            else {
                console.info("Nic mam nic do zrobienia");
            }
        };

        var checkWrapperExist = function(attempt, properties, runChangeVideoDecetor){
            //console.log('check: ' + properties.wrapper.exist() + ', [' + attempt + ']');
            if (properties.wrapper.exist() || attempt == 0) {
                return Promise.resolve().then(onWrapperExist(properties, runChangeVideoDecetor));
            } else {
                attempt = (attempt > 0) ? attempt-1 : attempt;
                return Promise.resolve().then(setTimeout(checkWrapperExist, ATTEMPT_TIMEOUT, attempt, properties, runChangeVideoDecetor));
            }
        };

        WrapperDetector.run = function(attempt, properties, runChangeVideoDecetor = false) {
            checkWrapperExist(attempt, properties, runChangeVideoDecetor);
        };
     return WrapperDetector;
    }(WrapperDetector || {}));

    var VideoGrabber = (function(VideoGrabber){
        var getVideoData = function(url, w){
            return $.ajax({
                url: url,
                method: 'GET',
                dataType: 'json'
            });
        };

        VideoGrabber.grabVideoData = function(vod, templateIndex, w){
            try {
                var idn = vod.grabber.idParser();
                var templates = vod.grabber.urlTemplates;
                var url = templates[templateIndex].replace(/\$idn/g, idn);
                w = (w === undefined) ? window.open(): w;
                //console.log(url);
                getVideoData(url, w).then(function(data){
                    try {
                        var formatData = vod.grabber.formatParser(data);
                        DomTamper.createDocument(formatData, w);
                    }
                    catch(e){
                        DomTamper.handleError(e, w);
                    }
                }, function(data){
                    if(templates[templateIndex+1] !== undefined) {
                        VideoGrabber.grabVideoData(vod, templateIndex+1, w);
                    }
                    else {
                        DomTamper.handleError(CALL_ERROR_MESSAGE, w);
                    }
                });
            }
            catch(e){
                DomTamper.handleError(e, w);
            }
        };
        return VideoGrabber;
    }(VideoGrabber || {}));

    var DomTamper = (function(DomTamper){
        var prepareContentDiv = function(){
            return $('<div>').attr('style', 'padding: 0px 15px; background-color: #ecf0f1; display:inline-block; border: 1px solid #999;');
        };

        DomTamper.handleError = function(message, w){
            if(w === undefined){
                w = window.open();
            }
            var par = $('<p>').attr('style', 'color: #903;').text(message);
            $(w.document.body).append(prepareContentDiv().append(par));
        };

        DomTamper.createButton = function(properties){
            properties.wrapper.get().find('#'+properties.button.id).remove();
            var button = $('<input>').attr('id', properties.button.id).attr('type', 'button')
                         .attr('style', properties.button.style).attr('value', 'Pobierz video').addClass(properties.button.class);
            button.bind('click', properties.button.click);
            properties.wrapper.get().append(button);
        };

        var openerButtonClick = function(body, par){
            body.find('[id^=contentPar] > input').each(function(){
                $(this).css("background-color", "#ccc");
            });
            par.find("input").css("background-color", "#f90");
            Tool.copyToClipboard(par.find("a").text());
        };

        var prepareContentActions = function(w, content){
            var body = $(w.document.body);
            body.append(content);

            $(w.document).ready(function() {
                body.find('[id^=contentPar]').each(function(event){
                    var par = $(this)
                    $(this).find("input").click(function(event){
                        openerButtonClick(body, par);
                    });
                });
            });
        };

        DomTamper.createDocument = function(data, w){
            Tool.numberModeSort(data.formats);

            var content = prepareContentDiv();
            $('<p>').text('Tytuł: ' + data.title).appendTo(content);
            $.each(data.formats, function( index, value ) {
                var par = $('<p>').attr('id', 'contentPar'+ index).text('Bitrate: ' + value.bitrate)
                if(value.quality !== undefined){
                    par.append(", Jakość: " + value.quality);
                }
                par.append('<br/>').append('Link do materiału: ');
                $('<input>').attr('value', 'Kopiuj').attr('type', 'button')
                    .attr('style', 'border: none; outline:none; padding: 4px 10px; background-color: #ccc; color: #000').appendTo(par);
                par.append('<br/>');
                var link = $('<a>').attr('target', '_blank').attr('href', value.url).text(value.url)
                if(index === 0){
                    link.attr('style', 'color: #903');
                }
                link.appendTo(par);
                par.appendTo(content);
            });

            prepareContentActions(w, content);
        };

        return DomTamper;
    }(DomTamper || {}));

    var Tool = (function(Tool) {
        Tool.copyToClipboard = function(text) {
            var $temp = $("<input>");
            $("body").append($temp);
            $temp.val(text).select();
            document.execCommand("copy");
            $temp.remove();
        };

        Tool.deleteParametersFromUrl = function(url){
            return decodeURIComponent(url.replace(/\?.*/,''));
        }

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

        return Tool;
    }(Tool || {}));

    var CDA = (function(CDA) {
        var properties = Configurator.setup({
            wrapper: {
                selector: '#player'
            },
            button: {
                style: 'position: absolute; left: 0px; top: 0px; padding: 6px 12px; z-index: 5001;',
                click: function(){
                    var url = $("video.pb-video-player").attr('src');
                    if(url !== undefined){
                        var w = window.open();
                        w.location.href = url;
                    }
                    else {
                        DomTamper.handleError(NO_ID_ERROR_MESSAGE, w);
                    }
                }
            }
        });

        CDA.waitOnWrapper = function(){
            WrapperDetector.run(ATTEMPTS, properties);
        };

        return CDA;
    }(CDA || {}));

    var VOD = (function(VOD) {
        var properties = Configurator.setup({
            wrapper: {
                selector: '#v_videoPlayer'
            },
            button: {
                style: 'position: absolute; left: 0px; top: 0px; background-color: #2fd6ff; color: #000000; text-transform: uppercase;  cursor: pointer; ' +
                       'white-space: nowrap; font: bold 16px Arial, sans-serif; line-height: 24px; z-index: 100; padding: 0px 10px; border: none;'
            },
            grabber: {
                urlTemplates: [
                    'https://player-api.dreamlab.pl/?body[id]=$idn&body[jsonrpc]=2.0&body[method]=get_asset_detail&body[params][ID_Publikacji]=$idn' +
                    '&body[params][Service]=vod.onet.pl&content-type=application/jsonp&x-onet-app=player.front.onetapi.pl&callback=',
                    'https://qi.ckm.onetapi.pl/?body[id]=$idn&body[jsonrpc]=2.0&body[method]=get_asset_detail&body[params][ID_Publikacji]=$idn' +
                    '&body[params][Service]=vod.onet.pl&content-type=application/jsonp&x-onet-app=player.front.onetapi.pl&_=1487536996333'
                ],
                idParser: function(){
                    try {
                        var id = $(".mvp").attr('id')
                        return id.match(/mvp:(.+)/)[1];
                    }
                    catch(e){
                        throw(NO_ID_ERROR_MESSAGE);
                    }
                },
                formatParser: function(data){
                    var formats = [];
                    var wideo = (((data.result || new Array())[0] || {}).formats || {}).wideo || {};
                    var meta = ((data.result || new Array())[0] || {}).meta || {};
                    if(wideo.mp4 && wideo.mp4.length > 0){
                        $.each(wideo.mp4, function( index, value ) {
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
                }
            }
        });

        var isTopWindow = function(){
            return window.top === window.self;
        };

        var iplaSectionDetected = function(){
            return $('#v_videoPlayer div.pulsembed_embed').length > 0;
        };

        VOD.waitOnWrapper = function(){
            if(isTopWindow() && !iplaSectionDetected()){
                WrapperDetector.run(ATTEMPTS, properties);
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
                style: 'position: absolute; left: 0px; top: 0px; background-color: #2fd6ff; color: #000000; text-transform: uppercase;  cursor: pointer; ' +
                       'white-space: nowrap; font: bold 16px Arial, sans-serif; line-height: 24px; z-index: 100; padding: 0px 10px; border: none;'
            },
            grabber: {
                urlTemplates: ['https://getmedia.redefine.pl/vods/get_vod/?cpid=1&ua=www_iplatv_html5/12345&media_id=$idn'],
                idParser: function(){
                    try {
                        var jsonObject;
                        $('script').get().some(function(item){
                            var scriptText = item.text || '';
                            var match = scriptText.match(/(window\.CP\.embedSetup\()(.*)\);/);
                            if(match){
                                jsonObject = JSON.parse(match[2]);
                                return true;
                            }
                        });
                        return JSON.parse(jsonObject[0].media).result.mediaItem.id;
                    }
                    catch(e){
                        throw(NO_ID_ERROR_MESSAGE);
                    }
                },
                formatParser: function(data){
                    return IPLA.grabVideoFormats(data);
                }
            }
        });

        VOD_IPLA.waitOnWrapper = function(){
            WrapperDetector.run(ATTEMPTS, properties);
        };

        return VOD_IPLA;
    }(VOD_IPLA || {}));

    var TVN = (function(TVN) {
        var properties = Configurator.setup({
            wrapper: {
                selector: '#player-container'
            },
            button: {
                style: 'position:absolute; z-index: 100; font-size: 14px; padding: 12px 18px;',
                class: 'btn btn-primary'
            },
            grabber: {
                urlTemplates: ['/api/?platform=ConnectedTV&terminal=Panasonic&format=json&authKey=064fda5ab26dc1dd936f5c6e84b7d3c2&v=3.1&m=getItem&id=$idn'],
                idParser: function(){
                    try {
                        var url = $('#quarticon-event-image').attr('src');
                        var dataParam = Tool.getUrlParameter('data', url);
                        var data = JSON.parse(dataParam);
                        return data.articleId;
                    }
                    catch(e){
                        return grabVideoIdFromUrl();
                    }
                }
            }
        });

        properties.grabber.formatParser = function(data, w){
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

        var grabVideoIdFromUrl = function(){
            var pageURL = window.location.href;
            var lastComma = pageURL.lastIndexOf(",");
            if (lastComma > - 1) {
                return pageURL.substring(lastComma+1);
            }

            throw NO_ID_ERROR_MESSAGE;
        };

        TVN.waitOnWrapper = function(){
            WrapperDetector.run(UNLIMITED_ATTEMPTS, properties, true);
        };

        return TVN;
    }(TVN || {}));

    var TVP = (function(TVP) {
        var properties = Configurator.setup({
            wrapper: {
                selector: '#JS-TVPlayer-Wrapper'
            },
            button: {
                style: 'position:absolute; z-index: 1; text-transform: uppercase; margin-top: 0px !important; ' +
                'width: auto !important; height: 30px !important; padding: 0px 15px',
                class: 'video-block__btn'
            },
            grabber: {
                urlTemplates: ['https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=$idn'],
                idParser: function(){
                    try {
                        var src = properties.wrapper.get().attr('data-src');
                        return src.split("/").pop();
                    }
                    catch(e){
                        throw NO_ID_ERROR_MESSAGE;
                    }
                },
                formatParser: function(data){
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
                }
            }
        });

        TVP.waitOnWrapper = function(){
            WrapperDetector.run(ATTEMPTS, properties);
        };

        return TVP;
    }(TVP || {}));

    var IPLA = (function(IPLA) {
        var properties = Configurator.setup({
            wrapper: {
                selector: 'div.player-wrapper:visible:first-child, div.promo-box:visible:first-child'
            },
            button: {
                style: 'position: absolute; top: 0px; left: 0px; z-index: 1; border: 0px; text-transform: uppercase; padding: 6px 10px; '+
                       'font: bold 13px Montserrat, sans-serif; color: #000; background-color: #fff; cursor: pointer'
            },
            grabber: {
                urlTemplates: ['https://getmedia.redefine.pl/vods/get_vod/?cpid=1&ua=www_iplatv_html5/12345&media_id=$idn'],
                idParser: function(){
                    if(location.href.match(/[\a-z\d]{32}/) !== null){
                        return window.location.href.match(/[\a-z\d]{32}/)[0];
                    }

                    return grabVideoIdFromHtmlElement();
                },
                formatParser: function(data){
                    return IPLA.grabVideoFormats(data);
                }
            }
        });

        IPLA.waitOnWrapper = function(){
            WrapperDetector.run(UNLIMITED_ATTEMPTS, properties, true);
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

        var grabVideoIdAlgorithm = function(){
            if(location.href.match(/[\a-z\d]{32}/) !== null){
                return window.location.href.match(/[\a-z\d]{32}/)[0];
            }

            return grabVideoIdFromHtmlElement();
        };

        var grabVideoIdFromHtmlElement = function(){
            try{
                var frameSrc = $('app-commercial-wallpaper iframe:first-child').attr('src');
                return Tool.getUrlParameter('vid', frameSrc);
            }
            catch(e){
                return grabVideoIdFromUrl();
            }
        };

        var grabVideoIdFromUrl = function(){
            var pageURL = location.href.split("?")[0];
            var pageURLTemp = pageURL.substring(0, pageURL.length - 3);
            var lastSlash = pageURLTemp.lastIndexOf("/");
            if (lastSlash > - 1) {
                return pageURL.substring(lastSlash+1);
            }

            throw NO_ID_ERROR_MESSAGE;
        };

        return IPLA;
    }(IPLA || {}));

    var Starter = (function(Starter) {
        var matcher = [
            {action: TVP.waitOnWrapper, pattern: /^https:\/\/vod\.tvp\.pl\//},
            {action: TVN.waitOnWrapper, pattern: /^https:\/\/(?:w{3}\.)?(?:tvn)?player\.pl\//},
            {action: CDA.waitOnWrapper, pattern: /^https:\/\/www\.cda\.pl\//},
            {action: VOD.waitOnWrapper, pattern: /^https:\/\/vod\.pl\//},
            {action: VOD_IPLA.waitOnWrapper, pattern: /^https:\/\/.*\.redcdn.pl\/file\/o2\/redefine\/partner\//},
            {action: IPLA.waitOnWrapper, pattern: /^https:\/\/www\.ipla\.tv\//}
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
        Starter.start();
    });

})();
