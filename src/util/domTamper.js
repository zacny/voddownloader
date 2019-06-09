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

    var injectStylesheet = function(w, name) {
        var head = $(w.document.head);
        if(!head.find('link[name="' + name + '"]').length){
            var stylesheet = $('<link>').attr('name', name).attr('type', 'text/css').attr('rel', 'stylesheet')
                .attr('href',  GM_getResourceURL(name));
            head.append(stylesheet);
        }
    };

    var injectFont = function (w, name) {
        var head = $(w.document.head);
        if(!head.find('link[name="' + name + '"]').length){
            var stylesheet = $('<link>').attr('name', name).attr('type', 'text/css').attr('rel', 'stylesheet')
                .attr('href',  config.get('fontUrl'));
            head.append(stylesheet);
        }
    };

    var prepareHead = function(w){
        injectFont(w, 'fontawesome');
        injectStylesheet(w, 'bootstrap_css');
        // injectStylesheet(w, 'mdb_css');
        DomTamper.injectStyle(w, 'content_css');
    };

    var createBugReportLink = function(w, additionalClass){
        var button = $('<button>').attr('type', 'button').addClass('btn btn-sm m-0').addClass(additionalClass)
            .append($('<i>').addClass('fas fa-bug'));
        button.click(function(){
            w.open('https://github.com/zacny/voddownloader/issues');
        });
        return $('<div>').addClass('bug-report-position').append(button);
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

        prepareHead(w);
        var pageContent = $('<div>').addClass('page-content');
        var card = $('<div>').addClass('card text-white bg-danger mb-3');
        var cardHeader = $('<div>').addClass('card-header')
            .text('Niestety natrafiono na problem, który uniemożliwił dalsze działanie');
        var cardBody = $('<div>').addClass('card-body')
            .append($('<h5>').addClass('card-title').text(exception.message));
        if(exception.description !== undefined){
            cardBody.append($('<div>').addClass('card-text text-white').text(exception.description));
        }

        pageContent.append(card.append(cardHeader).append(cardBody))
            .append(createBugReportLink(w, 'btn-danger'));
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
        prepareHead(w);
        var pageContent = $('<div>').addClass('page-content');
        var card = $('<div>').addClass('card text-white bg-dark');
        var cardHeader = $('<div>').addClass('card-header').text('Poczekaj trwa wczytywanie danych...');
        var cardBody = $('<div>').addClass('card-body');
        var bodyContainer = $('<div>').addClass('d-flex justify-content-center m-3');
        var spinner = $('<div>').addClass('spinner-border spinner-size').attr('role', 'status')
            .append($('<span>').addClass('sr-only').text('Loading...'));
        cardBody.append(bodyContainer.append(spinner));
        card.append(cardHeader).append(cardBody);
        pageContent.append(card);
        prepareBody(w, pageContent);
    };

    var createAction = function(iconClass, label){
        return $('<button>').attr('type', 'button').addClass('btn btn-dark btn-sm m-1 pl-3 pr-3')
            .append($('<i>').addClass('fas pr-1').addClass(iconClass)).append(label);
    };

    var downloadActionClick = function (event) {
        var data = event.data;
        Tool.downloadFile(data.value.url, data.title);
    };

    var copyActionClick = function (data, w) {
        var snackbar = $(w.document.body).find('#snackbar');
        GM_setClipboard(data.value.url);
        snackbar.text('Skopiowano do schowka.');
        snackbar.addClass('animate');
        setTimeout(function(){ snackbar.removeClass('animate'); }, 3000);
    };

    var createRow = function(data, rowClass, w){
        var params = {title: data.title, value: data.value};
        var actions = $('<td>').attr('scope', 'row').addClass('actions-row');
        actions.append(createAction('fa-save', 'Zapisz').click(params, downloadActionClick));
        actions.append(createAction('fa-clone', 'Kopiuj').click(
            function() {
                copyActionClick(data, w);
            })
        );
        actions.append(
            createAction('fa-film', 'Otwórz').attr('href', data.value.url)
                .attr('rel', 'noopener').attr('target', '_blank')
        );

        var descriptionText = data.value.quality == undefined ?
            'Bitrate: ' + data.value.bitrate :
            'Bitrate: ' + data.value.bitrate + ', Jakość: '+ data.value.quality;
        var description = $('<td>').text(descriptionText);

        return $('<tr>').append(actions).append(description);
    };

    var createTable = function(data, w){
        var table = $('<table>').addClass('table table-bordered table-striped btn-table')
            .append($('<thead>').addClass('black white-text')
                .append($('<tr>').append($('<th>').attr('scope', 'col').attr('colspan', 2).text(data.title)))
            );
        var tbody = $('<tbody>');
        table.append(tbody);
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

        prepareHead(w);
        setWindowTitle(data, w);
        var pageContent = $('<div>').addClass('page-content');
        pageContent.append(createTable(data, w));
        pageContent.append(createBugReportLink(w, 'special-color white-text'));

        prepareBody(w, pageContent);
    };

    return DomTamper;
}(DomTamper || {}));
