// ==UserScript==
// @name         downloadMedia
// @namespace    https://bitbucket.org/fzawicki/mediadownloader/src/master/
// @include      http*://vod.tvp.pl/*
// @include      http*://www.ipla.tv/*
// @include      http*://player.pl/*
// @include      http*://vod.pl/*
// @include      http*://www.cda.pl/*
// @version      1.1.0
// @description  Skrypt umożliwiający pobieranie materiałów ze znanych serwisów VOD. Działa tylko z rozszerzeniem Tampermonkey.
//               Cześć kodu pochodzi z:
//               https://greasyfork.org/pl/scripts/6049-skrypt-umo%C5%BCliwiaj%C4%85cy-pobieranie-materia%C5%82%C3%B3w-ze-znanych-serwis%C3%B3w-vod
//               miniskrypt.blogspot.com,
//               miniskrypt.hubaiitv.pl
// @author       fab
// @grant        none
// @noframes
// @run-at document-end
// @require https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// ==/UserScript==

(function downloadMedia() {
    'use strict';

    var $ = window.jQuery.noConflict(true);

    var ATTEMPTS = 20;
    var ATTEMPT_TIMEOUT = 1500;
    var NO_ID_ERROR_MESSAGE = 'Nie udało się pobrać idetyfikatora.';
    var API_ERROR_MESSAGE = 'Brak informacji o wybranym materiale.'
    var CALL_ERROR_MESSAGE = 'Błąd pobierania informacji o materiale.';

    var CDA = (function(CDA) {
        var wrapper = '#player';
        var properties = {
            getWrapper: function(){
                return $(wrapper);
            },
            isWrapperOnPage: function(){
                return $(wrapper).length > 0;
            },
            button: {
                id: 'btnCda',
                style: 'position: absolute; left: 0px; top: 0px; padding: 6px 12px; z-index: 5001;'
            },
            clickAction: function(){
                openVideoUrl();
            }
        };

        CDA.waitOnWrapper = function(){
            DownloadMedia.checkWrapperExist(ATTEMPTS, properties);
        };

        var openVideoUrl = function(){
            var w = window.open();
            var url = $(".pb-video-player").attr('src');
            if(url !== undefined){
                w.location.href = url;
            }
            else {
                DownloadMedia.handleError(NO_ID_ERROR_MESSAGE, w);
            }
        };

        return CDA;
    }(CDA || {}));

    var VOD = (function(VOD) {
        var wrapper = '#v_videoPlayer';
        var properties = {
            getWrapper: function(){
                return $(wrapper);
            },
            isWrapperOnPage: function(){
                return $(wrapper).length > 0;
            },
            button: {
                id: 'btnVod',
                style: 'position: absolute; left: 0px; top: 0px; background-color: #2fd6ff; color: #000000; text-transform: uppercase;' +
                       'font-weight: bold; white-space: nowrap; font-size: 18px; line-height: 26px; z-index: 100; padding: 0px 10px;'
            },
            clickAction: function(){
                grabVideoId();
            }
        };

        VOD.waitOnWrapper = function(){
            DownloadMedia.checkWrapperExist(ATTEMPTS, properties);
        };

        var grabVideoId = function(){
            var idn = grabVideoIdAlgorithm();
            var url = 'https://player-api.dreamlab.pl/?body[id]='+idn+'&body[jsonrpc]=2.0&body[method]=get_asset_detail&body[params][ID_Publikacji]=' + idn +
                '&body[params][Service]=vod.onet.pl&content-type=application/jsonp&x-onet-app=player.front.onetapi.pl&callback=';
            DownloadMedia.getVideoData(url, grabVideoFormats, tryDifferentUrl);
        };

        var tryDifferentUrl = function(){
            var idn = grabVideoIdAlgorithm();
            var url = 'https://qi.ckm.onetapi.pl/?body[id]=22D4B3BC014A3C200BCA14CDFF3AC018&body[jsonrpc]=2.0&body[method]=get_asset_detail&body[params][ID_Publikacji]=' + idn +
                '&body[params][Service]=vod.onet.pl&content-type=application/jsonp&x-onet-app=player.front.onetapi.pl&_=1487536996333';
            DownloadMedia.getVideoData(url, grabVideoFormats);
        }

        var grabVideoFormats = function(data, w){
            var formats = [];
            if(data.result[0].formats.wideo.mp4 !== undefined && data.result[0].formats.wideo.mp4.length > 0){
                $.each(data.result[0].formats.wideo.mp4, function( index, value ) {
                    formats.push({
                        quality: value.vertical_resolution,
                        bitrate: value.video_bitrate,
                        url: value.url
                    });
                });
                DownloadMedia.numberModeSort(formats);
                DownloadMedia.createDocument(w, data.result[0].meta.title, formats);
            }
            else {
                DownloadMedia.handleError(API_ERROR_MESSAGE, w);
            }
        };

        var grabVideoIdAlgorithm = function(){
            try {
                var id = $(".mvp").attr('id')
                return id.match(/mvp:(.+)/)[1];
            }
            catch(e){
                DownloadMedia.handleError(NO_ID_ERROR_MESSAGE);
            }
        }

        return VOD;
    }(VOD || {}));

    var TVN = (function(TVN) {
        var wrapper = '#player-container';
        var properties = {
            getWrapper: function(){
                return $(wrapper);
            },
            isWrapperOnPage: function(){
                return $(wrapper).length > 0;
            },
            button: {
                id: 'btnTVN',
                style: 'position:absolute; z-index: 100; font-size: 14px; font-weight: bold; padding: 10px 15px',
                class: 'btn btn-primary'
            },
            clickAction: function(){
                grabVideoId();
            }
        };

        TVN.waitOnWrapper = function(){
            DownloadMedia.checkWrapperExist(ATTEMPTS, properties);
        };

        var grabVideoId = function(){
            try {
                var idn = grabVideoIdAlgorithm();
                var url = '/api/?platform=ConnectedTV&terminal=Panasonic&format=json&authKey=064fda5ab26dc1dd936f5c6e84b7d3c2&v=3.1&m=getItem&id=' + idn;
                DownloadMedia.getVideoData(url, grabVideoFormats);
            }
            catch(e) {
                DownloadMedia.handleError(e);
            }
        };

        var grabVideoFormats = function(data, w){
            var formats = [];
            console.log(data);
            if(data.item.videos.main.video_content !== undefined && data.item.videos.main.video_content.length > 0){
                $.each(data.item.videos.main.video_content, function( index, value ) {
                    var lastPartOfUrl = DownloadMedia.deleteParametersFromUrl(value.url).split("/").pop();
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
                DownloadMedia.numberModeSort(formats);
                DownloadMedia.createDocument(w, title, formats);
            }
            else {
                DownloadMedia.handleError(API_ERROR_MESSAGE, w);
            }
        };

        var grabVideoIdAlgorithm = function(){
            try {
                var url = $('#quarticon-event-image').attr('src');
                var dataParam = DownloadMedia.getUrlParameter('data', url);
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
        var wrapper = '#JS-TVPlayer-Wrapper';
        var properties = {
            getWrapper: function(){
                return $(wrapper);
            },
            isWrapperOnPage: function(){
                return $(wrapper).length > 0;
            },
            button: {
                id: 'btnTvp',
                style: 'position:absolute; z-index: 1; text-transform: uppercase; margin-top: 0px !important; ' +
                       'width: auto !important; height: 30px !important; padding: 0px 15px',
                class: 'video-block__btn'
            },
            clickAction: function(){
                grabVideoId();
            }
        };

        TVP.waitOnWrapper = function(){
            DownloadMedia.checkWrapperExist(ATTEMPTS, properties);
        };

        var grabVideoId = function(){
            try {
                var src = properties.getWrapper().attr('data-src');
                var lastPartOfUrl = src.split("/").pop();
                var url = 'https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=' + lastPartOfUrl;
                DownloadMedia.getVideoData(url, grabVideoFormats);
            }
            catch(e) {
                DownloadMedia.handleError(NO_ID_ERROR_MESSAGE);
            }
        };

        var grabVideoFormats = function(data, w){
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
                DownloadMedia.numberModeSort(formats);
                DownloadMedia.createDocument(w, data.title, formats);
            }
            else {
                DownloadMedia.handleError(API_ERROR_MESSAGE, w);
            }
        };

        return TVP;
    }(TVP || {}));

    var IPLA = (function(IPLA) {
        var wrapper = 'div.player-wrapper:visible, div.promo-box:visible';
        var frame = 'app-commercial-wallpaper iframe:first-child';
        var properties = {
            getWrapper: function(){
                return $(wrapper).first();
            },
            isWrapperOnPage: function(){
                return $(wrapper).length > 0;
            },
            button: {
                id: 'btnIpla',
                style: 'position: absolute; top: 0px; left: 0px; z-index: 1; border: 0px; text-transform: uppercase; padding: 6px 10px; '+
                       'font: bold 13px Montserrat, sans-serif; color: #000; background-color: #fff; cursor: pointer',
            },
            clickAction: function(){
                grabVideoId();
            }
        };

        var onVideoChange = function(){
            DownloadMedia.createButton(properties);
            detectVideoChange();
        };

        var checkVideoChange = function(oldSrc) {
            var src = $('app-commercial-wallpaper iframe:first-child').attr('src');
            if(src !== undefined && oldSrc !== src){
                return Promise.resolve().then(onVideoChange);
            }
            else {
                return Promise.resolve().then(setTimeout(checkVideoChange, ATTEMPT_TIMEOUT, oldSrc));
            }
        };

        var detectVideoChange = function(){
            var src = $(frame).attr('src');
            checkVideoChange(src);
        }

        IPLA.waitOnWrapper = function(){
            DownloadMedia.checkWrapperExist(ATTEMPTS, properties, detectVideoChange);
        };

        var grabVideoFormats = function(data, w){
            var formats = [];
            if(data.vod.copies != null){
                $.each(data.vod.copies, function( index, value ) {
                    formats.push({
                        bitrate: value.bitrate,
                        url: value.url,
                        quality: value.quality_p
                    });
                });
                DownloadMedia.numberModeSort(formats);
                DownloadMedia.createDocument(w, data.vod.title, formats);
            }
            else {
                DownloadMedia.handleError(API_ERROR_MESSAGE, w);
            }
        };

        var grabVideoId = function(){
            try {
                var idn = grabVideoIdAlgorithm();
                var url = 'https://getmedia.redefine.pl/vods/get_vod/?cpid=1&ua=www_iplatv_html5/12345&media_id=' + idn;
                DownloadMedia.getVideoData(url, grabVideoFormats);
            }
            catch(e){
                DownloadMedia.handleError(e);
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
                var src = $(frame).attr('src');
                return DownloadMedia.getUrlParameter('vid', src);
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

    var DownloadMedia = (function(DownloadMedia) {
        DownloadMedia.start = function() {
            if(location.href.match(/^http[s]?:\/\/vod\.tvp\.pl\/[\d]{0,8}/)){
                TVP.waitOnWrapper();
            }
            else if(location.href.match(/^http[s]?:\/\/www\.ipla\.tv\//)){
               IPLA.waitOnWrapper();
            }
            else if(location.href.match(/^http[s]?:\/\/(?:w{3}\.)?(?:tvn)?player\.pl\//)){
                TVN.waitOnWrapper();
            }
            else if(location.href.match(/^http[s]?:\/\/vod\.pl\//)){
                VOD.waitOnWrapper();
            }
            else if(location.href.match(/^http[s]?:\/\/www\.cda\.pl\//)){
                CDA.waitOnWrapper();
            }
        };

        DownloadMedia.checkWrapperExist = function(attempt, properties, then) {
            //console.log('check: ' + properties.isWrapperOnPage() + ', [' + attempt + ']');
            if (properties.isWrapperOnPage() || attempt < 1) {
                return Promise.resolve().then(finalCheckStep(properties, then));
            } else {
                attempt--;
                return Promise.resolve().then(setTimeout(DownloadMedia.checkWrapperExist, ATTEMPT_TIMEOUT, attempt, properties, then));
            }
        };

        var finalCheckStep = function(properties, then){
            if(properties.isWrapperOnPage()) {
                DownloadMedia.createButton(properties);
                then();
            }
            else {
                console.info("Nic mam nic do zrobienia");
            }
        };

        DownloadMedia.getVideoData = function(url, successAction, errorAction, w){
            w = (w === undefined) ? window.open(): w;

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
                        DownloadMedia.handleError(CALL_ERROR_MESSAGE, w);
                    }
                }
            });
        };

        var prepareContentDiv = function(){
            return $('<div>').attr('style', 'padding: 0px 15px; background-color: #ecf0f1; display:inline-block; border: 1px solid #999;');
        };

        DownloadMedia.handleError = function(message, w){
            if(w === undefined){
                w = window.open();
            }
            var par = $('<p>').attr('style', 'color: #903;').text(message);
            $(w.document.body).append(prepareContentDiv().append(par));
        };

        DownloadMedia.createDocument = function(w, title, formats){
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

        var openerButtonClick = function(body, par){
            body.find('[id^=contentPar] > input').each(function(){
                $(this).css("background-color", "#ccc");
            });
            par.find("input").css("background-color", "#f90");
            copyToClipboard(par.find("a").text());
        };

        var copyToClipboard = function(element) {
            var $temp = $("<input>");
            $("body").append($temp);
            $temp.val(element).select();
            document.execCommand("copy");
            $temp.remove();
        };

        DownloadMedia.numberModeSort = function(formats){
            formats.sort(function (a, b) {
                    return b.bitrate - a.bitrate;
            });
        };

        DownloadMedia.createButton = function(properties){
            properties.getWrapper().find('#'+properties.button.id).remove();
            var button = $('<input>').attr('id', properties.button.id).attr('type', 'button').attr('style', properties.button.style).attr('value', 'Pobierz video').addClass(properties.button.class);
            button.click(properties.clickAction);
            properties.getWrapper().append(button);
        };

        DownloadMedia.deleteParametersFromUrl = function(url){
            return decodeURIComponent(url.replace(/\?.*/,''));
        }

        DownloadMedia.getUrlParameter = function(paramName, url){
            var results = new RegExp('[\?&]' + paramName + '=([^&#]*)').exec(url);
            if (results==null) {
                return null;
            }
            return decodeURIComponent(results[1]) || 0;
        };

       return DownloadMedia;
    }(DownloadMedia || {}));

    $(document).ready(function(){
        console.info('START with jquery: ' + $().jquery);
        DownloadMedia.start();
    });
})();