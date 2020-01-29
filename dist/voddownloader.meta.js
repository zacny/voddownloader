// ==UserScript==
// @name           voddownloader
// @version        6.10.1-develop
// @updateURL      http://localhost:5011/dist/voddownloader.meta.js
// @downloadURL    http://localhost:5011/dist/voddownloader.user.js
// @description    Skrypt służący do pobierania materiałów ze znanych serwisów VOD.
//                 Działa poprawnie tylko z rozszerzeniem Tampermonkey.
//                 Cześć kodu pochodzi z:
//                 miniskrypt.blogspot.com,
//                 miniskrypt.hubaiitv.pl
// @author         Przmus, zacny
// @namespace      http://www.ipla.tv/
// @source         https://github.com/zacny/voddownloader
// @include        https://vod.tvp.pl/video/*
// @include        /^https?://.*\.tvp.pl/sess/TVPlayer2/embed.*$/
// @include        https://cyfrowa.tvp.pl/video/*
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
// @run-at         document-end
// @require        https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @require        https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.3.1/js/bootstrap.min.js
// @require        https://cdnjs.cloudflare.com/ajax/libs/platform/1.3.5/platform.min.js
// @require        https://gitcdn.xyz/cdn/zacny/voddownloader/4b17a120f521eaddf476d6e8fe3be152d506f244/lib/js/mdb-with-waves-patch.js
// @require        https://gitcdn.xyz/cdn/kapetan/jquery-observe/master/jquery-observe.js
// @resource       buttons_css http://localhost:5011/lib/css/voddownloader-buttons.css
// @resource       content_css http://localhost:5011/lib/css/voddownloader-content.css
// ==/UserScript==

