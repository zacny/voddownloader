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

    var removeNotAllowedFileNameChars = function(input){
        var regexp = new RegExp('[\/:*?"<>|]+', 'g');
        return input.replace(regexp, '').replace(/\s+/g, ' ');
    };

    Tool.downloadFile = function(fileUrl, title){
        var extension = Tool.deleteParametersFromUrl(fileUrl.split('.').pop());
        var movieTitle = (title !== undefined && title !== '' ) ? title : 'nieznany';
        var name = removeNotAllowedFileNameChars(movieTitle) + '.' + extension;
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
        var defaults = $.extend({}, config.description.defaults);
        var sourceDescriptions = config.description.sources[data.source] || {};
        var descriptionVariant = sourceDescriptions[data.key] || {};
        return $.extend(true, defaults, data, descriptionVariant);
    };

    return Tool;
}(Tool || {}));
