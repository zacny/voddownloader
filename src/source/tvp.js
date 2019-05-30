var TVP = (function(TVP) {
    var properties = Configurator.setup({
        wrapper: {
            selector: '#playerBoxContainer-x'
        },
        button: {
            class: 'tvp_downlaod_button'
        },
        asyncSteps: [
            AsyncStep.setup({
                urlTemplate: 'https://www.tvp.pl/shared/cdn/tokenizer_v2.php?object_id=$videoId',
                beforeStep: function(input){
                    return idParser();
                },
                afterStep: function(output) {
                    return VOD_TVP.grabVideoFormats(output);
                }
            })
        ]
    });

    var idParser = function(){
        try {
            var src = $('input[name="recommended_url"]').val();
            return src.split("/").pop();
        }
        catch(e){
            throw CONST.id_error;
        }
    };

    TVP.waitOnWrapper = function(){
        WrapperDetector.run(properties);
    };

    return TVP;
}(TVP || {}));
