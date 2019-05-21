var TVN = (function(TVN) {
    var properties = Configurator.setup({
        wrapper: {
            selector: '#player-container'
        },
        button: {
            class: 'btn btn-primary tvn_download_button'
        },
        grabber: {
            urlTemplates: ['/api/?platform=ConnectedTV&terminal=Panasonic&format=json&authKey=064fda5ab26dc1dd936f5c6e84b7d3c2&v=3.1&m=getItem&id=$idn'],
            idParser: function(){
                var pageURL = $('.watching-now').closest('.embed-responsive').find('.embed-responsive-item').attr('href');
                if(!pageURL){
                    pageURL = window.location.href;
                }

                var lastComma = pageURL.lastIndexOf(",");
                if (lastComma > - 1) {
                    return pageURL.substring(lastComma+1);
                }

                throw CONST.video_id_error;
            }
        }
    });

    properties.grabber.formatParser = function(data, w){
        var formats = [];
        var title;
        var video_content = (((data.item || {}).videos || {}).main || {}).video_content || {};
        if(video_content && video_content.length > 0){
            $.each(video_content, function( index, value ) {
                var lastPartOfUrl = Tool.deleteParametersFromUrl(value.url).split("/").pop();
                var bitrate = lastPartOfUrl.match(/\d{2,}/g);
                formats.push({
                    quality: value.profile_name,
                    bitrate: bitrate,
                    url: value.url
                });
            });
            title = data.item.episode != null ? 'E'+data.item.episode : '';
            title = data.item.season != null ? 'S'+data.item.season + title : title;
            if(data.item.serie_title != null){
                title = data.item.serie_title + (title != '' ? ' - ' + title : '');
            }
        }
        return {
            title: title,
            formats: formats
        }
    };

    TVN.waitOnWrapper = function(){
        WrapperDetector.run(properties, TVN.waitOnWrapper);
    };

    return TVN;
}(TVN || {}));
