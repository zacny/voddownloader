// ==UserScript==
// @name         VOD Downloader
// @namespace    https://bitbucket.org/fzawicki/mediadownloader/src/master/
// @include      https://vod.tvp.pl/video/*
// @include      https://www.ipla.tv/wideo/*
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
// @version      1.2.2
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

    var Downloader = (function(Downloader) {
        Downloader.setup = function(properties){
            return $.extend(true, {
                wrapperSelector: '',
                button: {
                    id: 'direct-download',
                    style: '',
                    class: ''
                },
                getWrapper: function(){
                    return $(this.wrapperSelector);
                },
                isWrapperOnPage: function(){
                    return $(this.wrapperSelector).length > 0;
                },
                clickAction: function(){}
            }, properties);
        };

        Downloader.deleteParametersFromUrl = function(url){
            return decodeURIComponent(url.replace(/\?.*/,''));
        }

        Downloader.getUrlParameter = function(paramName, url){
            var results = new RegExp('[\?&]' + paramName + '=([^&#]*)').exec(url);
            if (results==null) {
                return null;
            }
            return decodeURIComponent(results[1]) || 0;
        };

        Downloader.numberModeSort = function(formats){
            formats.sort(function (a, b) {
                return b.bitrate - a.bitrate;
            });
        };

        Downloader.createButton = function(properties){
            //console.log(properties);
            properties.getWrapper().find('#'+properties.button.id).remove();
            var button = $('<input>').attr('id', properties.button.id).attr('type', 'button')
                         .attr('style', properties.button.style).attr('value', 'Pobierz video').addClass(properties.button.class);
            button.bind('click', properties.clickAction);
            properties.getWrapper().append(button);
        };

        var prepareContentDiv = function(){
            return $('<div>').attr('style', 'padding: 0px 15px; background-color: #ecf0f1; display:inline-block; border: 1px solid #999;');
        };

        Downloader.handleError = function(message, w){
            if(w === undefined){
                w = window.open();
            }
            var par = $('<p>').attr('style', 'color: #903;').text(message);
            $(w.document.body).append(prepareContentDiv().append(par));
        };

        var copyToClipboard = function(element) {
            var $temp = $("<input>");
            $("body").append($temp);
            $temp.val(element).select();
            document.execCommand("copy");
            $temp.remove();
        };

        var openerButtonClick = function(body, par){
            body.find('[id^=contentPar] > input').each(function(){
                $(this).css("background-color", "#ccc");
            });
            par.find("input").css("background-color", "#f90");
            copyToClipboard(par.find("a").text());
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

        Downloader.createDocument = function(w, title, formats){
            Downloader.numberModeSort(formats);
            var content = prepareContentDiv();
            $('<p>').text('Tytuł: ' + title).appendTo(content);
            $.each(formats, function( index, value ) {
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

        var getVideoData = function(url, successAction, errorAction, w){
            $.ajax({
                url: url,
                method: 'GET',
                dataType: 'json',
                success: function (data) {
                    successAction(data, w);
                },
                error: function (data) {
                    if(errorAction !== undefined){
                        errorAction(w);
                    }
                    else {
                        Downloader.handleError(CALL_ERROR_MESSAGE, w);
                    }
                }
            });
        };

        var finalCheckStep = function(properties, then){
            if(properties.isWrapperOnPage()) {
                Downloader.createButton(properties);
                if(then !== undefined){
                    then();
                }
            }
            else {
                console.info("Nic mam nic do zrobienia");
            }
        };

        Downloader.checkWrapperExist = function(attempt, properties, then) {
            //console.log('check: ' + properties.isWrapperOnPage() + ', [' + attempt + ']');
            if (properties.isWrapperOnPage() || attempt == 0) {
                return Promise.resolve().then(finalCheckStep(properties, then));
            } else {
                attempt = (attempt > 0) ? attempt-1 : attempt;
                return Promise.resolve().then(setTimeout(Downloader.checkWrapperExist, ATTEMPT_TIMEOUT, attempt, properties, then));
            }
        };

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

        Downloader.detectVideoChange = function(){
            var src = window.location.href;
            checkVideoChange(src);
        };

        Downloader.grabVideoData = function(vod, urlTemplate, errorAction, w){
            try {
                var idn = vod.grabVideoIdAlgorithm();
                var url = urlTemplate.replace(/\$idn/g, idn); //replace: $idn
                w = (w === undefined) ? window.open(): w;
                getVideoData(url, vod.grabVideoFormats, errorAction, w);
            }
            catch(e){
                Downloader.handleError(e, w);
            }
        };

        return Downloader;
    }(Downloader || {}));

    var CDA = (function(CDA) {
        var properties = Downloader.setup({
            wrapperSelector: '#player',
            button: {
                style: 'position: absolute; left: 0px; top: 0px; padding: 6px 12px; z-index: 5001;'
            },
            clickAction: function(){
                openVideoUrl();
            }
        });

        CDA.waitOnWrapper = function(){
            Downloader.checkWrapperExist(ATTEMPTS, properties);
        };

        var openVideoUrl = function(){
            var w = window.open();
            var url = $("video.pb-video-player").attr('src');
            if(url !== undefined){
                w.location.href = url;
            }
            else {
                Downloader.handleError(NO_ID_ERROR_MESSAGE, w);
            }
        };

        return CDA;
    }(CDA || {}));

    var VOD = (function(VOD) {
        var properties = Downloader.setup({
            wrapperSelector: '#v_videoPlayer',
            button: {
                style: 'position: absolute; left: 0px; top: 0px; background-color: #2fd6ff; color: #000000; text-transform: uppercase;  cursor: pointer; ' +
                       'white-space: nowrap; font: bold 16px Arial, sans-serif; line-height: 24px; z-index: 100; padding: 0px 10px; border: none;'
            },
            clickAction: function(){
                Downloader.grabVideoData(VOD, 'https://player-api.dreamlab.pl/?body[id]=$idn&body[jsonrpc]=2.0&body[method]=get_asset_detail&body[params][ID_Publikacji]=$idn' +
                '&body[params][Service]=vod.onet.pl&content-type=application/jsonp&x-onet-app=player.front.onetapi.pl&callback=', VOD.tryDifferentUrl);
            }
        });

        VOD.waitOnWrapper = function(){
            if(isTopWindow() && !iplaSectionDetected()){
                Downloader.checkWrapperExist(ATTEMPTS, properties);
            }
        };

        var isTopWindow = function(){
            return window.top === window.self;
        };

        var iplaSectionDetected = function(){
            return $('#v_videoPlayer div.pulsembed_embed').length > 0;
        };

        var iplaWrapperDetected = function(){
            return $('#player-wrapper').length > 0;
        };

        VOD.tryDifferentUrl = function(w){
            Downloader.grabVideoData(VOD, 'https://qi.ckm.onetapi.pl/?body[id]=$idn&body[jsonrpc]=2.0&body[method]=get_asset_detail&body[params][ID_Publikacji]=$idn' +
                '&body[params][Service]=vod.onet.pl&content-type=application/jsonp&x-onet-app=player.front.onetapi.pl&_=1487536996333', undefined, w);
        }

        VOD.grabVideoFormats = function(data, w){
            var formats = [];
            var wideo = ((((data.result || new Array())[0] || {}).formats || {}).wideo || {});
            if(wideo.mp4 && wideo.mp4.length > 0){
                $.each(wideo.mp4, function( index, value ) {
                    formats.push({
                        quality: value.vertical_resolution,
                        bitrate: value.video_bitrate,
                        url: value.url
                    });
                });
                Downloader.createDocument(w, data.result[0].meta.title, formats);
            }
            else {
                Downloader.handleError(API_ERROR_MESSAGE, w);
            }
        };

        VOD.grabVideoIdAlgorithm = function(){
            try {
                var id = $(".mvp").attr('id')
                return id.match(/mvp:(.+)/)[1];
            }
            catch(e){
                Downloader.handleError(NO_ID_ERROR_MESSAGE);
            }
        }

        return VOD;
    }(VOD || {}));

    var VOD_IPLA = (function(VOD_IPLA) {
        var properties = Downloader.setup({
            wrapperSelector: '#player-wrapper',
            button: {
                style: 'position: absolute; left: 0px; top: 0px; background-color: #2fd6ff; color: #000000; text-transform: uppercase;  cursor: pointer; ' +
                       'white-space: nowrap; font: bold 16px Arial, sans-serif; line-height: 24px; z-index: 100; padding: 0px 10px; border: none;'
            },
            clickAction: function(){
                Downloader.grabVideoData(VOD_IPLA, 'https://getmedia.redefine.pl/vods/get_vod/?cpid=1&ua=www_iplatv_html5/12345&media_id=$idn');
            }
        });

        VOD_IPLA.waitOnWrapper = function(){
            Downloader.checkWrapperExist(ATTEMPTS, properties);
        };

        VOD_IPLA.grabVideoIdAlgorithm = function(){
            try {
                var script = $('script:last-child').text();
                var match = script.match(/(window\.CP\.embedSetup\()(.*)\);/);
                var jsonObject = JSON.parse(match[2]);
                return JSON.parse(jsonObject[0].media).result.mediaItem.id;
            }
            catch(e){
                Downloader.handleError(NO_ID_ERROR_MESSAGE);
            }
        };

        VOD_IPLA.grabVideoFormats = function(data, w){
            IPLA.grabVideoFormats(data, w);
        };

        return VOD_IPLA;
    }(VOD_IPLA || {}));

    var TVN = (function(TVN) {
        var properties = Downloader.setup({
            wrapperSelector: '#player-container',
            button: {
                style: 'position:absolute; z-index: 100; font-size: 14px; padding: 12px 18px;',
                class: 'btn btn-primary'
            },
            clickAction: function(){
                Downloader.grabVideoData(TVN, '/api/?platform=ConnectedTV&terminal=Panasonic&format=json&authKey=064fda5ab26dc1dd936f5c6e84b7d3c2&v=3.1&m=getItem&id=$idn');
            }
        });

        TVN.waitOnWrapper = function(){
            Downloader.checkWrapperExist(UNLIMITED_ATTEMPTS, properties, Downloader.detectVideoChange);
        };

        TVN.grabVideoFormats = function(data, w){
            var formats = [];
            var video_content = (((data.item || {}).videos || {}).main || {}).video_content || {};
            if(video_content && video_content.length > 0){
                $.each(video_content, function( index, value ) {
                    var lastPartOfUrl = Downloader.deleteParametersFromUrl(value.url).split("/").pop();
                    var bitrate = lastPartOfUrl.match(/\d{2,}/g);
                    formats.push({
                        quality: value.profile_name,
                        bitrate: bitrate,
                        url: value.url
                    });
                });
                var title = data.item.episode != null ? 'E'+data.item.episode : '';
                title = data.item.season != null ? 'S'+data.item.season + title : title;
                if(data.item.serie_title != null){
                    title = data.item.serie_title + (title != '' ? ' - ' + title : '');
                }
                Downloader.createDocument(w, title, formats);
            }
            else {
                Downloader.handleError(API_ERROR_MESSAGE, w);
            }
        };

        TVN.grabVideoIdAlgorithm = function(){
            try {
                var url = $('#quarticon-event-image').attr('src');
                var dataParam = Downloader.getUrlParameter('data', url);
                var data = JSON.parse(dataParam);
                return data.articleId;
            }
            catch(e){
                return grabVideoIdFromUrl();
            }
        }

        var grabVideoIdFromUrl = function(){
            var pageURL = window.location.href;
            var lastComma = pageURL.lastIndexOf(",");
            if (lastComma > - 1) {
                return pageURL.substring(lastComma+1);
            }

            throw NO_ID_ERROR_MESSAGE;
        }

        return TVN;
    }(TVN || {}));

    var TVP = (function(TVP) {
        var properties = Downloader.setup({
            wrapperSelector: '#JS-TVPlayer-Wrapper',
            button: {
                style: 'position:absolute; z-index: 1; text-transform: uppercase; margin-top: 0px !important; ' +
                       'width: auto !important; height: 30px !important; padding: 0px 15px',
                class: 'video-block__btn'
            },
            clickAction: function(){
                Downloader.grabVideoData(TVP, 'https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=$idn');
            }
        });

        TVP.waitOnWrapper = function(){
            Downloader.checkWrapperExist(ATTEMPTS, properties);
        };

        TVP.grabVideoIdAlgorithm = function(){
            try {
                var src = properties.getWrapper().attr('data-src');
                return src.split("/").pop();
            }
            catch(e){
                throw NO_ID_ERROR_MESSAGE;
            }
        }

        TVP.grabVideoFormats = function(data, w){
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

            if(formats.length > 0){
                Downloader.createDocument(w, data.title, formats);
            }
            else {
                Downloader.handleError(API_ERROR_MESSAGE, w);
            }
        };

        return TVP;
    }(TVP || {}));

    var IPLA = (function(IPLA) {
        var properties = Downloader.setup({
            frameSelector: 'app-commercial-wallpaper iframe:first-child',
            wrapperSelector: 'div.player-wrapper:visible, div.promo-box:visible',
            button: {
                style: 'position: absolute; top: 0px; left: 0px; z-index: 1; border: 0px; text-transform: uppercase; padding: 6px 10px; '+
                       'font: bold 13px Montserrat, sans-serif; color: #000; background-color: #fff; cursor: pointer'
            },
            clickAction: function(){
                Downloader.grabVideoData(IPLA, 'https://getmedia.redefine.pl/vods/get_vod/?cpid=1&ua=www_iplatv_html5/12345&media_id=$idn');
            }
        });

        var getFrameSource = function(){
            return $(properties.frameSelector).attr('src');
        }

        IPLA.waitOnWrapper = function(){
            Downloader.checkWrapperExist(UNLIMITED_ATTEMPTS, properties, Downloader.detectVideoChange);
        };

        IPLA.grabVideoFormats = function(data, w){
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
                Downloader.createDocument(w, data.vod.title, formats);
            }
            else {
                Downloader.handleError(API_ERROR_MESSAGE, w);
            }
        };

        IPLA.grabVideoIdAlgorithm = function(){
            if(location.href.match(/[\a-z\d]{32}/) !== null){
                return window.location.href.match(/[\a-z\d]{32}/)[0];
            }

            return grabVideoIdFromHtmlElement();
        };

        var grabVideoIdFromHtmlElement = function(){
            try{
                return Downloader.getUrlParameter('vid', getFrameSource());
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
        console.info('START with jquery: ' + $().jquery);
        Starter.start();
    });

})();
