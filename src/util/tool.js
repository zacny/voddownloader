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
        var extension = fileUrl.split('.').pop();
        var title = (title !== undefined && title !== '' ) ? title : 'nieznany';
        var details = {
            url: fileUrl,
            name: title + '.' + extension,
            saveAs: true,
            onerror: function(response){
                downloadErrorCallback(response);
            }
        };

        GM_download(details);
    };

    var downloadErrorCallback = function (response) {
        console.log(response.error + ' ' + response.details);
    };

    return Tool;
}(Tool || {}));
