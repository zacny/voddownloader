var Step = (function(properties){
    var step = {
        urlTemplateBase: '',
        urlTemplateDynamicParts: [],
        urlTemplates: [],
        /** Will be done before call. It should return an object ready to use by resolveUrl function. **/
        beforeStep: function(input){return input},
        /** Will be done after call **/
        afterStep: function (output) {return output},
        /** Processing parameters of url before step */
        resolveUrl: function (input, templateIndex) {
            var url = this.urlTemplates.length ? this.urlTemplates[templateIndex] : '';
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
        /** Is this step remote? */
        isRemote: function(){
            return this.urlTemplates.length > 0;
        },
        /** Method of async step */
        method: 'GET',
        retryErrorCodes: [],
        /** Method parameters function of async step */
        methodParam: function(){return {}},
        /** Initialization */
        init: function(){
            if(this.urlTemplateDynamicParts.length){
                var that = this;
                that.urlTemplateDynamicParts.forEach(function(part) {
                    that.urlTemplates.push(that.urlTemplateBase.replace('@', part));
                });
            }
        }
    };

    var extendedStep = $.extend(true, step, properties);
    extendedStep.init();

    return extendedStep;
});
