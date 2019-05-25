var APIVOD_TVP = (function(APIVOD_TVP) {
    var properties = Configurator.setup({
        wrapper: 'pre.data, pre',
        grabber: {
            formatParser: function(data){
                return grabVideoFormats(data);
            }
        }
    });

    var grabVideoFormats = function(json){
        var formats = [];
        var data = ((json.data || new Array())[0] || {});
        if(json.success === 1 && data.formats !== undefined){
            $.each(data.formats, function( index, value ) {
                if(value.adaptive == false){
                    formats.push({
                        bitrate: value.totalBitrate,
                        url: value.url
                    });
                }
            });
        }

        return {
            title: data.title,
            formats: formats
        };
    };

    APIVOD_TVP.parseJson = function() {
        try {
            var content = $(properties.wrapper).html();
            var contentJson = JSON.parse(content);
            var formats = properties.grabber.formatParser(contentJson);
            if(formats && formats.formats.length > 0){
                $(window.document.body).html('');
                DomTamper.createDocument(formats, window);
            }
            else {
                throw CONST.api_error;
            }
        }
        catch(e){
            DomTamper.handleError(e, properties, window);
        }
    };

    return APIVOD_TVP;
}(APIVOD_TVP || {}));
