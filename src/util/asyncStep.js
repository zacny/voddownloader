var AsyncStep = (function(AsyncStep){
    AsyncStep.setup = function(properties){
        var step = {
            urlTemplate: '',
            /** Will be done before async call. It should return an object ready to use by resolveUrl function. **/
            beforeStep: function(input){return input},
            /** Will be done after async call **/
            afterStep: function (output) {return output},
            resolveUrl: function (input) {
                var url = this.urlTemplate;
                if(typeof input === 'string' || typeof input == 'number'){
                    return url.replace(new RegExp('#videoId', 'g'), input);
                }
                else if(typeof input === 'object') {
                    $.each(input, function (key, value) {
                        url = url.replace(new RegExp('#'+key,'g'), value);
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
