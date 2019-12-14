var Step = (function(properties){
    var step = {
        urlTemplateParts: [],
        urlTemplate: '',
        /** Will be done before call. It should return an object ready to use by resolveUrl function. **/
        beforeStep: function(input){return input},
        /** Will be done after call **/
        afterStep: function (output) {return output},
        /** Processing parameters of url before step */
        resultUrlParams: function (input, template) {
            var urlParams = {};
            $.each(input, function (key, value) {
                template = template.replace(new RegExp('#'+key,'g'), value);
                urlParams[key] = value;
            });

            return {
                url: template,
                urlParams: urlParams
            };
        },
        /** Processing the url template */
        resolveUrl: function (input, partIndex) {
            return this.resultUrlParams(input, this.resolveUrlParts(partIndex));
        },
        /** Is this step remote? */
        isRemote: function(){
            return this.urlTemplate.length > 0;
        },
        /** Method of async step */
        method: 'GET',
        retryErrorCodes: [],
        /** Method parameters function of async step */
        methodParam: function(){return {}},
        /** Processing url dynamic parts */
        resolveUrlParts: function(partIndex){
            if(this.urlTemplateParts.length){
                return this.urlTemplate.replace('@', this.urlTemplateParts[partIndex]);
            }

            return this.urlTemplate;
        }
    };

    return $.extend(true, step, properties);
});
