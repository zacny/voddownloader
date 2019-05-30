var AsyncStep = (function(AsyncStep){
    AsyncStep.setup = function(properties){
        var step = {
            urlTemplate: '',
            /** Will be done before async call. It should return an object ready to use by resolveUrl function. **/
            beforeStep: function(input){return input},
            /** Will be done after async call **/
            afterStep: function (output) {return output},
            resolveUrl: function (input) {
                if(typeof input === 'string'){
                    return url.replace('/\$videoId/g', input);
                }
                else if(typeof input === 'object') {
                    var url = this.urlTemplate;
                    $.each(input, function (key, value) {
                        url = url.replace('/\$' + key + '/g', value);
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