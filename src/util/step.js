function Step(properties){
    var step = {
        urlTemplate: '',
        /** Will be done before call. It should return an object ready to use by resolveUrl function. **/
        beforeStep: function(input){return input},
        /** Will be done after call **/
        afterStep: function (output) {return output},
        /** Processing parameters of url before step */
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
        },
        /** Is this step async? */
        isAsync: function(){
            return step.urlTemplate;
        },
        /** Method of async step */
        method: 'GET',
        /** Method parameters function of async step */
        methodParam: function(){return {}}
    };

    return $.extend(true, step, properties);
}
