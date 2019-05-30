// ==UserScript==
// @name           voddownloader
// @version        5.3.3-develop
// @description    Skrypt służący do pobierania materiałów ze znanych serwisów VOD.
//                 Działa poprawnie tylko z rozszerzeniem Tampermonkey.
//                 Cześć kodu pochodzi z:
//                 miniskrypt.blogspot.com,
//                 miniskrypt.hubaiitv.pl
// @author         Przmus, zacny
// @namespace      http://www.ipla.tv/
// @match          https://*.tvp.pl/*
// @include        https://vod.tvp.pl/video/*
// @include        https://cyfrowa.tvp.pl/video/*
// @include        http://www.tvp.pl/*
// @include        https://www.ipla.tv/*
// @include        https://player.pl/*
// @include        https://www.cda.pl/*
// @include        https://vod.pl/filmy*
// @include        https://vod.pl/programy-onetu/*
// @include        https://vod.pl/da-vinci/*
// @include        https://vod.pl/seriale/*
// @include        https://vod.pl/programy-tv/*
// @include        https://redir.atmcdn.pl/*
// @include        https://*.redcdn.pl/file/o2/redefine/partner/*
// @include        https://video.wp.pl/*
// @exclude        http://www.tvp.pl/sess/*
// @exclude        https://www.cda.pl/iframe/*
// @grant          GM_getResourceText
// @grant          GM_addStyle
// @grant          GM_xmlhttpRequest
// @connect        tvp.pl
// @run-at         document-end
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @resource       css http://localhost:5011/dist/voddownloader.css
// ==/UserScript==

(function vodDownloader($) {
    'use strict';

    function Exception(message, name) {
	    this.message = message;
	    this.name = name;
	}
	var CONST = {
	    attempts: 10,
	    attempt_timeout: 1500,
	    id_error: new Exception('Nie udało się odnaleźć idetyfikatora.', 'ID_ERROR'),
	    api_error: new Exception('Nie odnaleziono adresów do strumieni.', 'API_ERROR'),
	    call_error: new Exception('Błąd pobierania informacji o materiale.', 'CALL_ERROR'),
	    drm_error: new Exception('Materiał posiada DRM. ' +
	        'Ten skrypt służy do pobierania darmowych, niezabezpieczonych materiałów.', 'DRM_ERROR')
	};
	
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
	
	var DomTamper = (function(DomTamper){
	
	    DomTamper.injectStyle = function(w, name){
	        var head = $(w.document.head);
	        if(!head.find('style[name="' + name + '"]').length){
	            var styleElement = $('<style>').attr('type', 'text/css')
	                .attr('name', name).text((GM_getResourceText(name)));
	            head.append(styleElement);
	        }
	    };
	
	    var prepareContent = function(w){
	        DomTamper.injectStyle(w, 'css');
	        return $('<div>').addClass('download_content');
	    };
	
	    DomTamper.handleError = function(exception, vod, w){
	        if(w === undefined){
	            w = window.open();
	        }
	        DomTamper.injectStyle(w, 'css');
	        var div = $('<div>').addClass('download_error_message').text(exception.message);
	        vod.grabber.errorHandler(exception, div);
	        var par = $('<p>').append(div);
	        $(w.document.body).replaceWith(prepareContent(w).append(par));
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
	        body.replaceWith(content);
	
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
	
	    DomTamper.createIframe = function(vod, url, w){
	        DomTamper.injectStyle(w, 'css');
	        var body = $(w.document.body);
	        var iframe = $('<iframe/>').attr('id', 'api').attr('scrolling', 'no')
	            .attr('seamless', 'seamless').attr('src', url);
	        body.append(iframe);
	        vod.grabber.storeCallback(w);
	        // setTimeout(function(){
	        //     var item = w.sessionStorage.getItem('voddownloader.tvp.videoid');
	        //     console.log('LocalStorage vidoeId: ' + item);
	        //     iframe.show();
	        // }, 1000);
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
	
	var VideoGrabber = (function(VideoGrabber){
	    var getVideoData = function(vod, templateIndex, w){
	        var url = getUrl(vod, templateIndex, w);
	
	        console.log("GET: " + url);
	        return $.ajax({
	            method: 'GET',
	            dataType: 'json',
	            url: url
	        });
	    };
	
	    var tryNextUrl = function(vod, templateIndex, w, error){
	        var templates = vod.grabber.urlTemplates;
	        if(templates[templateIndex+1] !== undefined) {
	            VideoGrabber.grabVideoDataAsync(vod, templateIndex+1, w);
	        }
	        else {
	            throw error;
	        }
	    };
	
	    var getUrl = function(vod,templateIndex, w) {
	        var idn = vod.grabber.idParser();
	        vod.grabber.store(idn, w);
	        var templates = vod.grabber.urlTemplates;
	        return templates[templateIndex].replace(/\$idn/g, idn);
	    };
	
	    VideoGrabber.grabVideoDataFromJson = function(vod, templateIndex, w){
	        w = (w === undefined) ? window.open(): w;
	        var url = getUrl(vod, templateIndex, w);
	        StorageUtil.waitUntil(vod.grabber.storageKey, w, function(){
	            VideoGrabber.grabVideoDataAsync(vod, 1, w);
	        });
	        return DomTamper.createIframe(vod, url, w);
	    };
	
	    VideoGrabber.grabVideoDataAsync = function(vod, templateIndex, w){
	        try {
	            w = (w === undefined) ? window.open(): w;
	            getVideoData(vod, templateIndex, w).then(function(data){
	                try {
	                    var formatData = vod.grabber.formatParser(data);
	                    if(formatData && formatData.formats.length == 0){
	                        tryNextUrl(vod, templateIndex, w, CONST.api_error);
	                    }
	                    else {
	                        DomTamper.createDocument(formatData, w);
	                    }
	                }
	                catch(e){
	                    DomTamper.handleError(e, vod, w);
	                }
	            }, function(data){
	                try {
	                    tryNextUrl(vod, templateIndex, w, CONST.call_error);
	                }
	                catch(e){
	                    DomTamper.handleError(e, vod, w);
	                }
	            });
	        }
	        catch(e){
	            DomTamper.handleError(e, vod, w);
	        }
	    };
	    return VideoGrabber;
	}(VideoGrabber || {}));
	
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
	                    VideoGrabber.grabVideoDataAsync(settings, 0);
	                }
	            },
	            grabber: {
	                urlTemplates: [],
	                idParser: function(){return null},
	                formatParser: function(data){return {title: null, formats: new Array()}},
	                errorHandler: function(exception, div){},
	                store: function(value, w){},
	                storeCallback: function(w){}
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
	            console.log("checkVideoChange: " + oldSrc + " -> " + src);
	            return Promise.resolve().then(videoChangeCallback);
	        }
	        else {
	            return Promise.resolve().then(
	                setTimeout(checkVideoChange, CONST.attempt_timeout, oldSrc, videoChangeCallback)
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
	        console.log('check: ' + properties.wrapper.exist() + ', [' + attempt + ']');
	        if (properties.wrapper.exist() || attempt == 0) {
	            return Promise.resolve().then(onWrapperExist(properties));
	        } else {
	            attempt = (attempt > 0) ? attempt-1 : attempt;
	            return Promise.resolve().then(
	                setTimeout(checkWrapperExist, CONST.attempt_timeout, attempt, properties)
	            );
	        }
	    };
	
	    WrapperDetector.run = function(properties, videoChangeCallback) {
	        checkWrapperExist(CONST.attempts, properties);
	        if(typeof videoChangeCallback === "function"){
	            ChangeVideoDetector.run(videoChangeCallback);
	        }
	    };
	    return WrapperDetector;
	}(WrapperDetector || {}));
	
	var StorageUtil = (function(StorageUtil) {
	    var checkStorage = function(key, w, callback) {
	        var value = w.localStorage.getItem(key);
	        if(value !== undefined && value !== null){
	            console.log('SessionStorage hit: [' + key + '=' + value + ']');
	            w.localStorage.removeItem(key);
	            return Promise.resolve().then(callback);
	        }
	        else {
	            return Promise.resolve().then(
	                setTimeout(checkStorage, 250, key, w, callback)
	            );
	        }
	    };
	
	    StorageUtil.put = function(key, value, w) {
	        w.localStorage.setItem(key, value);
	    };
	
	    StorageUtil.waitUntil = function(key, w, callback){
	        console.log('SesstionStorage init: [' + key + ']');
	        checkStorage(key, w, callback);
	    };
	
	    return StorageUtil;
	}(StorageUtil || {}));
	var VOD_TVP = (function(VOD_TVP) {
	    var properties = Configurator.setup({
	        wrapper: {
	            selector: 'div.playerContainer'
	        },
	        button: {
	            class: 'video-block__btn tvp_vod_downlaod_button',
	            click: function(){
	                // VideoGrabber.grabVideoDataFromJson(properties, 0);
	                var properties = {
	                    method: 'GET',
	                    username: 'api',
	                    password: 'vod',
	                    url: 'https://apivod.tvp.pl/tv/video/42549669',
	                    responseType: 'json',
	                    onload: function(data) {
	                        console.log(data.response);
	                    }
	                };
	                GM_xmlhttpRequest(properties);
	            }
	        },
	        grabber: {
	            storageKey: 'voddownloader.tvp.videoid',
	            urlTemplates: [
	                'https://tvp.pl/pub/stat/videofileinfo?video_id=$idn',
	                'https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=$idn'
	            ],
	            idParser: function(){
	                var src = properties.wrapper.get().attr('data-id');
	                return src.split("/").pop();
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
	                    throw CONST.id_error;
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
	                    throw CONST.id_error;
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
	                    throw CONST.id_error;
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
	                if(!pageURL){
	                    pageURL = window.location.href;
	                }
	
	                var lastComma = pageURL.lastIndexOf(",");
	                if (lastComma > - 1) {
	                    return pageURL.substring(lastComma+1);
	                }
	
	                throw CONST.id_error;
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
	            throw CONST.id_error;
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
	                    throw(CONST.id_error);
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
	                    throw(CONST.id_error);
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
	                    throw CONST.id_error;
	                }
	            },
	            formatParser: function(data){
	                return grabVideoFormats(data);
	            }
	        }
	    });
	
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
	            if (url !== undefined) {
	                w.location.href = url;
	            } else {
	                throw CONST.id_error;
	            }
	        }catch(e){
	            DomTamper.handleError(e, properties, w);
	        }
	    };
	
	    CDA.waitOnWrapper = function(){
	        WrapperDetector.run(properties);
	    };
	
	    return CDA;
	}(CDA || {}));
	
	var TVP_VIDEOINFO = (function(TVP_VIDEOINFO) {
	    var properties = Configurator.setup({
	        wrapper: 'body',
	        storageKey: 'voddownloader.tvp.videoid'
	    });
	
	    var getJsonContent = function(){
	        var content = $(properties.wrapper).html();
	        return JSON.parse(content);
	    };
	
	    TVP_VIDEOINFO.parseJson = function() {
	        try {
	            var json = getJsonContent();
	            var videoId = json.copy_of_object_id !== undefined ? json.copy_of_object_id : json.video_id;
	            console.log('videoId: ' + videoId);
	            StorageUtil.put(properties.storageKey, videoId, window);
	        }
	        catch(e){
	            DomTamper.handleError(e, properties, window);
	        }
	    };
	
	    return TVP_VIDEOINFO;
	}(TVP_VIDEOINFO || {}));
	
	var Starter = (function(Starter) {
	    var matcher = [
	        {action: TVP_VIDEOINFO.parseJson, pattern: /^https:\/\/tvp\.pl\/pub\/stat\//},
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
	    DomTamper.injectStyle(window, 'css');
	    Starter.start();
	});

}).bind(this)(jQuery);
