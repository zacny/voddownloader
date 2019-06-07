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
                var urlParams = {};
                $.each(input, function (key, value) {
                    url = url.replace(new RegExp('#'+key,'g'), value);
                    urlParams[key] = value;
                });

                return {
                    url: url,
                    urlParams: urlParams
                };
            }
        };

        return $.extend(true, step, properties);
    };
    return AsyncStep;
}(AsyncStep || {}));
