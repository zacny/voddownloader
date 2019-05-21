var DomTamper = (function(DomTamper){

    var injectStyle = function(w){
        $(w.document.head).append(GM_addStyle(GM_getResourceText('css')));
    };

    var prepareContent = function(w){
        injectStyle(w);
        return $('<div>').addClass('download_content');
    };

    DomTamper.handleError = function(message, w){
        if(w === undefined){
            w = window.open();
        }
        injectStyle(w);
        var par = $('<p>').addClass('download_error_message').text(message);
        $(w.document.body).append(prepareContent(w).append(par));
    };

    DomTamper.createButton = function(properties){
        properties.wrapper.get().find('#'+properties.button.id).remove();
        var button = $('<input>').attr('id', properties.button.id).attr('type', 'button')
            .attr('style', properties.button.style).attr('value', 'Pobierz video').addClass(properties.button.class);
        button.bind('click', properties.button.click);
        properties.wrapper.get().append(button);
    };

    var clearPreviousClick = function(body){
        body.find('[id^=contentPar] > input').each(function(event){
            $(this).removeClass('link_copy_click');
        });
        $('#copyTitle', body).removeClass('title_copy_click');
    };

    var videoLinkCopyButtonClick = function(body, par){
        clearPreviousClick(body);

        Tool.copyToClipboard(par.find("a").text());
        par.find("input").addClass('link_copy_click');
    };

    var titleCopyButtonClick = function(body){
        clearPreviousClick(body);

        Tool.copyToClipboard($('#title', body).text());
        $('#copyTitle', body).addClass('title_copy_click');
    };

    var prepareContentActions = function(w, content){
        var body = $(w.document.body);
        body.append(content);

        $(w.document).ready(function() {
            body.find('[id^=contentPar]').each(function(event){
                var par = $(this);
                $(this).find("input").click(function(event){
                    videoLinkCopyButtonClick(body, par);
                });
            });
            $('#copyTitle', body).click(function(){
                titleCopyButtonClick(body);
            })
        });
    };

    DomTamper.createDocument = function(data, w){
        Tool.numberModeSort(data.formats);

        var content = prepareContent(w);
        var titlePar = $('<p>');
        $('<span>').text('Tytuł: ').appendTo(titlePar);
        $('<span>').attr('id', 'title').text(data.title).appendTo(titlePar);
        $('<input>').attr('id', 'copyTitle').attr('value', 'Kopiuj tytuł').attr('type', 'button')
            .addClass('title_copy_button').appendTo(titlePar);
        titlePar.appendTo(content);
        $.each(data.formats, function( index, value ) {
            var par = $('<p>').attr('id', 'contentPar'+ index).text('Bitrate: ' + value.bitrate);
            if(value.quality !== undefined){
                par.append(", Jakość: " + value.quality);
            }
            par.append('<br/>').append('Link do materiału:');
            $('<input>').attr('value', 'Kopiuj').attr('type', 'button')
                .addClass('link_copy_button').appendTo(par);
            par.append('<br/>');
            var link = $('<a>').attr('target', '_blank').attr('href', value.url).text(value.url);
            index === 0 ? link.addClass('best_quility_link_color') : link.addClass('link_color');
            link.appendTo(par);
            par.appendTo(content);
        });

        prepareContentActions(w, content);
    };

    return DomTamper;
}(DomTamper || {}));
