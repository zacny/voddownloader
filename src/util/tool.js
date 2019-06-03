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

    Tool.copyToClipboard = function(text) {
        var $temp = $("<input>");
        $("body").append($temp);
        $temp.val(text).select();
        document.execCommand("copy");
        $temp.remove();
    };

    Tool.downloadFile = function(fileUrl, title){
        var extension = Tool.deleteParametersFromUrl(fileUrl.split('.').pop());
        var title = (title !== undefined && title !== '' ) ? title : 'nieznany';
        var name = title + '.' + extension;
        GM_download({
            url: fileUrl,
            name: name,
            onerror: function(response){
                downloadErrorCallback(response);
            }
        });
        GM_notification({
            title: 'Rozpoczęto pobieranie pliku',
            text: name
        });
    };

    var downloadErrorCallback = function (response) {
        console.info(response.error + ' ' + response.details);
    };

    return Tool;
}(Tool || {}));
