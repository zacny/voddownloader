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

    var injectStylesheet = function (w, setting) {
        var head = $(w.document.head);
        if(!head.find('link[name="' + setting.id + '"]').length){
            var stylesheet = $('<link>').attr('name', setting.id).attr('type', 'text/css').attr('rel', 'stylesheet')
                .attr('href', setting.css);
            head.append(stylesheet);
        }
    };

    var injectScript = function (w, setting) {
        var head = $(w.document.head);
        if(!head.find('script[name="' + setting.id + '"]').length){
            var stylesheet = $('<script>').attr('name', setting.id).attr('type', 'text/javascript')
                .attr('src', setting.js);
            head.append(stylesheet);
        }
    };

    var prepareHead = function(w){
        injectStylesheet(w, config.include.fontawesome);
        injectStylesheet(w, config.include.bootstrap);
        injectStylesheet(w, config.include.mdb);
        DomTamper.injectStyle(w, 'content_css');
        injectScript(w, config.include.jquery);
        injectScript(w, config.include.resultWindowScript);
    };

    var createBugReportLink = function(w, additionalClass){
        var button = $('<button>').attr('type', 'button').addClass('btn btn-sm m-0').addClass(additionalClass)
            .append($('<i>').addClass('fas fa-bug'));
        button.click(function(){
            w.open('https://github.com/zacny/voddownloader/issues');
        });
        return $('<div>').addClass('bug-report-position').append(button);
    };

    var prepareBody = function(w, pageContent, detection) {
        appendOrReplace(w, pageContent);
        attachWaveEffect(w, pageContent);
        if(detection) {
            PluginSettingsDetector.detect(w);
        }
    };

    var appendOrReplace = function (w, pageContent) {
        var body = $(w.document.body);
        if(body.children().length > 0){
            body.children(":first").replaceWith(pageContent);
        }
        else {
            body.append(pageContent);
        }
    };

    var attachWaveEffect = function(w, pageContent){
        var buttons = pageContent.find('.btn:not(.btn-flat), .btn-floating');
        Waves.attach(buttons, ['waves-light']);
        Waves.init({}, w);
    };

    DomTamper.handleError = function(exception, w){
        if(w === undefined){
            w = window.open();
        }

        prepareHead(w);
        var pageContent = $('<div>').addClass('page-content');
        pageContent.append(createErrorContent(exception));
        pageContent.append(createBugReportLink(w, type === 'error' ? 'btn-danger' : 'special-color white-text'));
        prepareBody(w, pageContent);
    };

    var createErrorContent = function(exception){
        var type = 'error';
        var caption = 'Niespodziewany błąd';
        var message = 'Natrafiono na niespodziewany błąd: ' + exception;
        if(exception.error){
            message = exception.error.template.apply(this, exception.templateParams).replace(/\n/g, '<br/>');
            caption = exception.error.caption;
            type = exception.error.type !== undefined ? exception.error.type : 'error';
        }
        var typeClass = type === 'error' ? 'bg-danger' : 'bg-dark';
        var card = $('<div>').addClass('card text-white mb-3').addClass(typeClass);
        var cardHeader = $('<div>').addClass('card-header')
            .text('Niestety natrafiono na problem, który uniemożliwił dalsze działanie');
        var cardBody = $('<div>').addClass('card-body')
            .append($('<h5>').addClass('card-title').text(caption))
            .append($('<div>').addClass('card-text text-white mb-3').append(message))
            .append($('<div>').addClass('card-text text-white')
                .append('Informacje o systemie: ').append(platform.description))
            .append($('<div>').addClass('card-text text-white')
                .append('Wersja pluginu: ').append(GM_info.version));
        card.append(cardHeader).append(cardBody);
        return card;
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

    var downloadActionClick = function (data, w) {
        var options = {title: 'Rozpoczęto pobieranie pliku', content: data.title};
        Tool.downloadFile(data.value.url, data.title);
        Notification.show(options, w);
    };

    var copyActionClick = function (data, w) {
        GM_setClipboard(data.value.url);
        var options = {title: 'Kopiowanie', content: 'Skopiowano do schowka'};
        Notification.show(options, w);
    };

    var openActionClick = function (data, w) {
        w.open(data.value.url);
    };

    var createRow = function(data, rowClass, w){
        var actions = $('<td>').attr('scope', 'row').addClass('actions-row');
        actions.append(createAction('fa-save', 'Zapisz').click(
            function(){downloadActionClick(data, w)})
        );
        actions.append(createAction('fa-clone', 'Kopiuj').click(
            function() {copyActionClick(data, w)})
        );
        actions.append(createAction('fa-film', 'Otwórz').click(
            function() {openActionClick(data, w)})
        );

        var descriptionHtml = $('<div>').append($('<b>').text('bitrate: ')).append($('<span>').text(data.value.bitrate));
        if(data.value.quality) {
            descriptionHtml.append($('<span>').text(', ')).append($('<b>').text('rozdzielczość: '))
                .append($('<span>').text(data.value.quality));
        }
        if(data.value.langDesc){
            descriptionHtml.append($('<span>').text(', ')).append($('<b>').text('wersja językowa: '))
                .append($('<span>').text(data.value.langDesc));
        }
        var description = $('<td>').html(descriptionHtml);

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

    DomTamper.createDocument = function(service, data, w){
        service.formatter(data);

        prepareHead(w);
        setWindowTitle(data, w);
        var pageContent = $('<div>').addClass('page-content');
        var parentExist = $('<div>').attr('id', 'parentExist').append(createTable(data, w));
        var parentNotExist = $('<div>').attr('id', 'parentNotExist').append(
            createErrorContent(new Exception(config.error.noParent, window.location.href))
        ).addClass('do-not-display');
        pageContent.append(parentNotExist);
        pageContent.append(parentExist);
        pageContent.append(createBugReportLink(w, 'special-color white-text'));
        pageContent.append(createNotificationContainer());
        prepareBody(w, pageContent, true);
        Tool.bindWindowFocus(w, onResultWindowFocus);
    };

    var onResultWindowFocus = function(isFocused){
        alert('Focus: ' + isFocused);
    };

    var createNotificationContainer = function(){
        return $('<div>').attr('id', 'notification-container')
            .attr('aria-live', 'polite').attr('aria-atomic', 'true').addClass('notification-container');
    };

    return DomTamper;
}(DomTamper || {}));
