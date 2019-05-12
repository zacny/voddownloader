// ==UserScript==
// @name         Skrypt umożliwiający pobieranie materiałów ze znanych serwisów VOD.
// @namespace    http://www.ipla.tv/
// @include      https://vod.tvp.pl/video/*
// @include      https://cyfrowa.tvp.pl/video/*
// @exclude      http://www.tvp.pl/sess/*
// @include      http://www.tvp.pl/*
// @match        https://*.tvp.pl/*
// @include      https://www.ipla.tv/*
// @include      https://player.pl/*
// @include      https://www.cda.pl/*
// @exclude      https://www.cda.pl/iframe/*
// @include      https://vod.pl/filmy*
// @include      https://vod.pl/programy-onetu/*
// @include      https://vod.pl/da-vinci/*
// @include      https://vod.pl/seriale/*
// @include      https://vod.pl/programy-tv/*
// @include      https://redir.atmcdn.pl/*
// @include      https://*.redcdn.pl/file/o2/redefine/partner/*
// @include      https://video.wp.pl/*
// @version      5.2.6
// @description  Skrypt umożliwiający pobieranie materiałów ze znanych serwisów VOD. Działa poprawnie tylko z rozszerzeniem Tampermonkey.
//               Cześć kodu pochodzi z:
//               miniskrypt.blogspot.com,
//               miniskrypt.hubaiitv.pl
// @author       Przmus, zacny
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @run-at document-end
// @require https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @resource css https://raw.githubusercontent.com/zacny/voddownloader/master/voddownloader.css
// ==/UserScript==

(function vodDownloader() {
    'use strict';

    var $ = window.jQuery.noConflict(true);
    var cssText = GM_getResourceText('css');
    GM_addStyle(cssText);

    var ATTEMPTS = 10;
    var ATTEMPT_TIMEOUT = 1500;
    var NO_ID_ERROR_MESSAGE = 'Nie udało się pobrać idetyfikatora.';
    var INVALID_JSON_STRUCTURE = 'Nie odnaleziono adresów do strumieni.';
    var CALL_ERROR_MESSAGE = 'Błąd pobierania informacji o materiale. Prawdopodobnie materiał jest zabezpieczony DRM. Ten skrypt służy tylko do pobierania darmowych, niezabezpieczonych materiałów. Prosimy nie zgłaszać problemów po wystąpieniu tego błędu.';

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
        var checkVideoChange = function(oldSrc, videoChangeCallback) {
            var src = window.location.href;
            if(src !== undefined && oldSrc !== src){
                return Promise.resolve().then(videoChangeCallback);
            }
            else {
                return Promise.resolve().then(setTimeout(checkVideoChange, ATTEMPT_TIMEOUT, oldSrc, videoChangeCallback));
            }
        };

        ChangeVideoDetector.run = function(videoChangeCallback){
            var src = window.location.href;
            checkVideoChange(src, videoChangeCallback);
        };
        return ChangeVideoDetector;
    }(ChangeVideoDetector || {}));

    var WrapperDetector = (function(WrapperDetector){
        var onWrapperExist = function(properties, videoChangeCallback){
            if(properties.wrapper.exist()) {
                DomTamper.createButton(properties);
            }
            else {
                console.info("Nie mam nic do zrobienia");
            }
        };

        var checkWrapperExist = function(attempt, properties, videoChangeCallback){
            //console.log('check: ' + properties.wrapper.exist() + ', [' + attempt + ']');
            if (properties.wrapper.exist() || attempt == 0) {
                return Promise.resolve().then(onWrapperExist(properties, videoChangeCallback));
            } else {
                attempt = (attempt > 0) ? attempt-1 : attempt;
                return Promise.resolve().then(setTimeout(checkWrapperExist, ATTEMPT_TIMEOUT, attempt, properties, videoChangeCallback));
            }
        };

        WrapperDetector.run = function(properties, videoChangeCallback) {
            checkWrapperExist(ATTEMPTS, properties, videoChangeCallback);
            if(typeof videoChangeCallback === "function"){
                ChangeVideoDetector.run(videoChangeCallback);
            }
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
                        if(formatData && formatData.formats.length == 0){
                            throw INVALID_JSON_STRUCTURE;
                        }
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
        var cssFileContent = cssText;

        var injectStyle = function(w){
            var style = $('<style>').text(cssFileContent);
            $(w.document.head).append(style);
        };

        var prepareContent = function(w){
            injectStyle(w);
            return $('<div>').addClass('download_content');
        };

        DomTamper.handleError = function(message, w){
            if(w === undefined){
                w = window.open();
            }
            injectStyle(w);
            var par = $('<p>').addClass('download_error_message').text(message);
            $(w.document.body).append(prepareContent(w).append(par));
        };

        DomTamper.createButton = function(properties){
            properties.wrapper.get().find('#'+properties.button.id).remove();
            var button = $('<input>').attr('id', properties.button.id).attr('type', 'button')
                .attr('style', properties.button.style).attr('value', 'Pobierz video').addClass(properties.button.class);
            button.bind('click', properties.button.click);
            properties.wrapper.get().append(button);
        };

        var clearPreviousClick = function(body){
            body.find('[id^=contentPar] > input').each(function(event){
                $(this).removeClass('link_copy_click');
            });
            $('#copyTitle', body).removeClass('title_copy_click');
        };

        var videoLinkCopyButtonClick = function(body, par){
            clearPreviousClick(body);

            Tool.copyToClipboard(par.find("a").text());
            par.find("input").addClass('link_copy_click');
        };

        var titleCopyButtonClick = function(body){
            clearPreviousClick(body);

            Tool.copyToClipboard($('#title', body).text());
            $('#copyTitle', body).addClass('title_copy_click');
        };

        var prepareContentActions = function(w, content){
            var body = $(w.document.body);
            body.append(content);

            $(w.document).ready(function() {
                body.find('[id^=contentPar]').each(function(event){
                    var par = $(this);
                    $(this).find("input").click(function(event){
                        videoLinkCopyButtonClick(body, par);
                    });
                });
                $('#copyTitle', body).click(function(){
                    titleCopyButtonClick(body);
                })
            });
        };

        DomTamper.createDocument = function(data, w){
            Tool.numberModeSort(data.formats);

            var content = prepareContent(w);
            var titlePar = $('<p>');
            $('<span>').text('Tytuł: ').appendTo(titlePar);
            $('<span>').attr('id', 'title').text(data.title).appendTo(titlePar);
            $('<input>').attr('id', 'copyTitle').attr('value', 'Kopiuj tytuł').attr('type', 'button')
                .addClass('title_copy_button').appendTo(titlePar);
            titlePar.appendTo(content);
            $.each(data.formats, function( index, value ) {
                var par = $('<p>').attr('id', 'contentPar'+ index).text('Bitrate: ' + value.bitrate);
                if(value.quality !== undefined){
                    par.append(", Jakość: " + value.quality);
                }
                par.append('<br/>').append('Link do materiału:');
                $('<input>').attr('value', 'Kopiuj').attr('type', 'button')
                    .addClass('link_copy_button').appendTo(par);
                par.append('<br/>');
                var link = $('<a>').attr('target', '_blank').attr('href', value.url).text(value.url);
                index === 0 ? link.addClass('best_quility_link_color') : link.addClass('link_color');
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

        return Tool;
    }(Tool || {}));

    var CDA = (function(CDA) {
        var properties = Configurator.setup({
            wrapper: {
                selector: '#player'
            },
            button: {
                class: 'cda_download_button',
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
            WrapperDetector.run(properties);
        };

        return CDA;
    }(CDA || {}));

    var VOD = (function(VOD) {
        var properties = Configurator.setup({
            wrapper: {
                selector: '#v_videoPlayer'
            },
            button: {
                class: 'vod_download_button'
            },
            grabber: {
                urlTemplates: [
                    'https://player-api.dreamlab.pl/?body[id]=$idn&body[jsonrpc]=2.0&body[method]=get_asset_detail&body[params][ID_Publikacji]=$idn' +
                    '&body[params][Service]=vod.onet.pl&content-type=application/jsonp&x-onet-app=player.front.onetapi.pl&callback=',
                ],
                idParser: function(){
                    try {
                        var id = $(".mvp").attr('id');
                        return id.match(/mvp:(.+)/)[1];
                    }
                    catch(e){
                        throw(NO_ID_ERROR_MESSAGE);
                    }
                },
                formatParser: function(data){
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
            grabber: {
                urlTemplates: ['https://getmedia.redefine.pl/vods/get_vod/?cpid=1&ua=www_iplatv_html5/12345&media_id=$idn'],
                idParser: function(){
                    try {
                        var match = $('script:not(:empty)').text().match(/(window\.CP\.embedSetup\()(.*)\);/);
                        var jsonObject = JSON.parse(match[2]);
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
            WrapperDetector.run(properties);
        };

        return VOD_IPLA;
    }(VOD_IPLA || {}));

    var TVN = (function(TVN) {
        var properties = Configurator.setup({
            wrapper: {
                selector: '#player-container'
            },
            button: {
                class: 'btn btn-primary tvn_download_button'
            },
            grabber: {
                urlTemplates: ['/api/?platform=ConnectedTV&terminal=Panasonic&format=json&authKey=064fda5ab26dc1dd936f5c6e84b7d3c2&v=3.1&m=getItem&id=$idn'],
                idParser: function(){
                    var pageURL = $('.watching-now').closest('.embed-responsive').find('.embed-responsive-item').attr('href');
                    var lastComma = pageURL.lastIndexOf(",");
                    if (lastComma > - 1) {
                        return pageURL.substring(lastComma+1);
                    }

                    throw NO_ID_ERROR_MESSAGE;
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

        TVN.waitOnWrapper = function(){
            WrapperDetector.run(properties, TVN.waitOnWrapper);
        };

        return TVN;
    }(TVN || {}));

    var VOD_TVP = (function(VOD_TVP) {
        var properties = Configurator.setup({
            wrapper: {
                selector: 'div.playerContainer'
            },
            button: {
                class: 'video-block__btn tvp_vod_downlaod_button'
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
                    return VOD_TVP.grabVideoFormats(data);
                }
            }
        });

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
            grabber: {
                urlTemplates: ['https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=$idn'],
                idParser: function(){
                    try {
                        var src = $('iframe#JS-TVPlayer').attr('src');
                        return src.split("/").pop();
                    }
                    catch(e){
                        throw NO_ID_ERROR_MESSAGE;
                    }
                },
                formatParser: function(data){
                    return VOD_TVP.grabVideoFormats(data);
                }
            }
        });

        CYF_TVP.waitOnWrapper = function(){
            WrapperDetector.run(properties);
        };

        return CYF_TVP;
    }(CYF_TVP || {}));

    var TVP = (function(TVP) {
        var properties = Configurator.setup({
            wrapper: {
                selector: '#playerBoxContainer-x'
            },
            button: {
                class: 'tvp_downlaod_button'
            },
            grabber: {
                urlTemplates: ['https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=$idn'],
                idParser: function(){
                    try {
                        var src = $('input[name="recommended_url"]').val();
                        return src.split("/").pop();
                    }
                    catch(e){
                        throw NO_ID_ERROR_MESSAGE;
                    }
                },
                formatParser: function(data){
                    return VOD_TVP.grabVideoFormats(data);
                }
            }
        });

        TVP.waitOnWrapper = function(){
            WrapperDetector.run(properties);
        };

        return TVP;
    }(TVP || {}));

    var TVP_REG = (function(TVP_REG) {
        var properties = Configurator.setup({
            wrapper: {
                selector: 'div.js-video'
            },
            button: {
                class: 'tvp_reg_download_button'
            },
            grabber: {
                urlTemplates: ['https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=$idn'],
                idParser: function(){
                    try {
                        return $('div.js-video').attr('data-object-id');
                    }
                    catch(e){
                        throw NO_ID_ERROR_MESSAGE;
                    }
                },
                formatParser: function(data){
                    return VOD_TVP.grabVideoFormats(data);
                }
            }
        });

        TVP_REG.waitOnWrapper = function(){
            WrapperDetector.run(properties);
        };

        return TVP_REG;
    }(TVP_REG || {}));

    var IPLA = (function(IPLA) {
        var properties = Configurator.setup({
            wrapper: {
                selector: 'div.player-wrapper:visible:first-child, div.promo-box:visible:first-child,' +
                    ' div.player-error-presentation:visible:first-child'
            },
            button: {
                class: 'ipla_download_button'
            },
            grabber: {
                urlTemplates: ['https://getmedia.redefine.pl/vods/get_vod/?cpid=1&ua=www_iplatv_html5/12345&media_id=$idn'],
                idParser: function(){
                    if(location.href.match(/[\a-z\d]{32}/) !== null){
                        return window.location.href.match(/[\a-z\d]{32}/)[0];
                    }

                    return grabVideoIdFromWatchingNowElement();
                },
                formatParser: function(data){
                    return IPLA.grabVideoFormats(data);
                }
            }
        });

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
                console.log(href);
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
                throw NO_ID_ERROR_MESSAGE;
            }
        };

        return IPLA;
    }(IPLA || {}));

    var WP = (function(WP) {
        var properties = Configurator.setup({
            wrapper: {
                selector: '#mainPlayer'
            },
            button: {
                class: 'material__category wp_download_button'
            },
            grabber: {
                urlTemplates: ['https://video.wp.pl/player/mid,$idn,embed.json'],
                idParser: function(){
                    try {
                        var pageURL = window.location.href;
                        var regexp = new RegExp('mid,(\\d+),cid');
                        var match = regexp.exec(pageURL);
                        return match[1];
                    }
                    catch(e){
                        throw NO_ID_ERROR_MESSAGE;
                    }
                },
                formatParser: function(data){
                    return WP.grabVideoFormats(data);
                }
            }
        });

        WP.grabVideoFormats = function(data){
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

    var Starter = (function(Starter) {
        var matcher = [
            {action: VOD_TVP.waitOnWrapper, pattern: /^https:\/\/vod\.tvp\.pl\//},
            {action: CYF_TVP.waitOnWrapper, pattern: /^https:\/\/cyfrowa\.tvp\.pl\//},
            {action: TVP.waitOnWrapper, pattern: /^http:\/\/www\.tvp\.pl\//},
            {action: TVP_REG.waitOnWrapper,
                pattern: /^https:\/\/(bialystok|katowice|lodz|rzeszow|bydgoszcz|kielce|olsztyn|szczecin|gdansk|krakow|opole|warszawa|gorzow|lublin|poznan|wroclaw)\.tvp\.pl\//},
            {action: TVN.waitOnWrapper, pattern: /^https:\/\/(?:w{3}\.)?(?:tvn)?player\.pl\//},
            {action: CDA.waitOnWrapper, pattern: /^https:\/\/www\.cda\.pl\//},
            {action: VOD.waitOnWrapper, pattern: /^https:\/\/vod\.pl\//},
            {action: VOD_IPLA.waitOnWrapper, pattern: /^https:\/\/.*\.redcdn.pl\/file\/o2\/redefine\/partner\//},
            {action: IPLA.waitOnWrapper, pattern: /^https:\/\/www\.ipla\.tv\//},
            {action: WP.waitOnWrapper, patter: /^https:\/\/video\.wp\.pl\//}
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
