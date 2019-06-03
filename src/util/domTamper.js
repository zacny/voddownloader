/** Icons preview: https://fontawesome.com/v4.7.0/icons **/
var DomTamper = (function(DomTamper){

    DomTamper.injectStyle = function(w, name){
        var head = $(w.document.head);
        if(!head.find('style[name="' + name + '"]').length){
            var styleElement = $('<style>').attr('type', 'text/css')
                .attr('name', name).text((GM_getResourceText(name)));
            head.append(styleElement);
        }
    };

    var injectFont = function(w) {
        var head = $(w.document.head);

        if(!head.find('style[name="font-awesome"]').length){
            var font = $('<link>').attr('name', 'font-awesome').attr('type', 'text/css').attr('rel', 'stylesheet')
                .attr('href', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');
            head.append(font);
        }
    };

    var prepareHead = function(w, name){
        DomTamper.injectStyle(w, 'loader_css');
        DomTamper.injectStyle(w, 'content_css');
        injectFont(w);
    };


    var createBugReportLink = function(pageContent){
        return $('<a>').attr('href', "https://github.com/zacny/voddownloader/issues")
            .attr('id', 'bug-report').addClass('fa fa-bug tooltip')
            .append(createTooltipText('tooltip-left', 'Zgłoś błąd'));
    };

    var prepareBody = function(w, pageContent) {
        var body = $(w.document.body);
        if(body.children().length > 0){
            body.children(":first").replaceWith(pageContent);
        }
        else {
            body.append(pageContent);
        }
    };

    DomTamper.handleError = function(exception, w){
        if(w === undefined){
            w = window.open();
        }

        prepareHead(w, 'content_css');
        var pageContent = $('<div>').addClass('page-content');
        var container = $('<div>').addClass('container');
        var cause = $('<div>').addClass('cause').text(exception.message);
        container.append(cause);
        if(exception.description !== undefined){
            container.append($('<div>').text(exception.description));
        }

        pageContent.append(container).append(createBugReportLink());
        prepareBody(w, pageContent);
    };

    DomTamper.createButton = function(properties){
        properties.wrapper.get().find('#'+properties.button.id).remove();
        var button = $('<input>').attr('id', properties.button.id).attr('type', 'button')
            .attr('style', properties.button.style).attr('value', 'Pobierz video').addClass(properties.button.class);
        button.bind('click', properties.button.click);
        properties.wrapper.get().append(button);
    };

    DomTamper.createLoader = function(w){
        var body = $(w.document.body);
        DomTamper.injectStyle(w, 'loader_css');
        injectFont(w);
        var pageContent = $('<div>').addClass('page-content');
        var container = $('<div>').addClass('container');
        var loaderContent = $('<div>').addClass('loader-content');
        var loaderText = $('<div>').addClass('loader-text').text('Trwa przetwarzanie...');
        var loaderRing = $('<div>').addClass('loader-ring');

        container.append(loaderContent.append(loaderText).append(loaderRing));
        pageContent.append(container);

        prepareBody(w, pageContent);
    };

    var createTooltipText = function(tooltipClass, tooltipMessage){
      return $('<div>').addClass('tooltiptext').addClass(tooltipClass).text(tooltipMessage);
    };

    var createAction = function(iconClass, tooltipMessage){
        return $('<a>').addClass('fa ' + iconClass + ' fa-2x margin tooltip').attr('href', '#')
            .append(createTooltipText('tooltip-up', tooltipMessage));
    };

    var downloadActionClick = function (event) {
        var data = event.data;
        var fileName = Tool.downloadFile(data.value.url, data.title);
        GM_notification({
            title: 'Rozpoczęto pobieranie pliku',
            text: fileName
        });
    };

    var copyActionClick = function (data, w) {
        var snackbar = $(w.document.body).find('#snackbar');
        Tool.copyToClipboard(data.value.url);
        snackbar.text('Skopiowano do schowka.');
        snackbar.addClass('animate');
        setTimeout(function(){ snackbar.removeClass('animate'); }, 3000);
    };

    var openActionClick = function (event) {
        window.open(event.data.value.url);
    };

    var createRow = function(data, rowClass, w){
        var row = $('<tr>').addClass(rowClass);
        var params = {title: data.title, value: data.value};
        var actions = $('<td>').addClass('actions');
        actions.append(createAction('fa-save', 'Zapisz').click(params, downloadActionClick));
        actions.append(createAction('fa-clone', 'Kopiuj').click(
            function () {
                copyActionClick(data, w);
            })
        );
        actions.append(createAction('fa-film', 'Otwórz').click(params, openActionClick));

        var descriptionText = data.value.quality == undefined ?
            'Bitrate: ' + data.value.bitrate :
            'Bitrate: ' + data.value.bitrate + ', Jakość: '+ data.value.quality;
        var description = $('<td>').text(descriptionText);

        row.append(actions);
        row.append(description);

        return row;
    };

    var createTable = function(data, w){
        var tbody = $('<tbody>');
        var table = $('<table>').append(tbody);
        var header = $('<tr>').append($('<th>').attr('colspan', 2).text(data.title));
        tbody.append(header);
        $.each(data.formats, function(index, value) {
            var rowClass = index === 0 ? 'best-quality' : '';
            var params = {
                value: value,
                title: data.title
            };
            tbody.append(createRow(params, rowClass, w));
        });

        return table;
    };

    var setWindowTitle = function(data, w){
        var head = $(w.document.head);
        var title = head.find('title');
        if(title.length) {
            title.text(data.title);
        }
        else {
            head.append($('<title>').text(data.title));
        }
    };

    DomTamper.createDocument = function(data, w){
        Tool.numberModeSort(data.formats);

        prepareHead(w, 'content_css');
        setWindowTitle(data, w);
        var body = $(w.document.body);

        var pageContent = $('<div>').addClass('page-content');
        pageContent.append(createTable(data, w));
        pageContent.append($('<div>').attr('id', 'snackbar'));
        pageContent.append(createBugReportLink());

        prepareBody(w, pageContent);
    };

    return DomTamper;
}(DomTamper || {}));
