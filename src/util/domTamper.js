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

    var prepareHead = function(w){
        injectStylesheet(w, config.include.fontawesome);
        injectStylesheet(w, config.include.bootstrap);
        injectStylesheet(w, config.include.mdb);
        DomTamper.injectStyle(w, 'content_css');
    };

    var createLinks = function(w, additionalClass){
        var links = [
            {
                url: 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=RWX4EUR77CMKU',
                icon: 'fa-hand-holding-usd',
                tooltip: 'dotacje'
            },
            {
                url: 'https://greasyfork.org/pl/scripts/6049-skrypt-umo%C5%BCliwiaj%C4%85cy-pobieranie-' +
                    'materia%C5%82%C3%B3w-ze-znanych-serwis%C3%B3w-vod/feedback',
                icon: 'fa-comments',
                tooltip: 'problemy, komentarze'
            },
            {
                url: 'https://github.com/zacny/voddownloader/issues',
                icon: 'fa-bug',
                tooltip: 'zgłoś błąd'
            }
        ];
        var container = $('<div>').addClass('links-position');
        links.forEach(function(link){
            var button = $('<button>').attr('type', 'button').attr('title', link.tooltip)
                .addClass('btn btn-sm m-1 p-2').addClass(additionalClass)
                .append($('<i>').addClass('fas').addClass(link.icon).addClass('fa-2x'));
            button.click(function(){
                w.open(link.url);
            });
            container.append(button);
        });
        return container;
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
        var errorData = getErrorData(exception);
        var pageContent = $('<div>').addClass('page-content');
        pageContent.append(createErrorContent(errorData));
        pageContent.append(createLinks(w, errorData.type === 'error' ?
            'btn-danger' : 'special-color white-text'));
        prepareBody(w, pageContent);
    };

    var getErrorData = function(exception){
        var type = 'error';
        var caption = 'Niespodziewany błąd';
        var message = 'Natrafiono na niespodziewany błąd: ' + exception;
        if(exception.error){
            message = exception.error.template.apply(this, exception.templateParams).replace(/\n/g, '<br/>');
            caption = exception.error.caption;
            type = exception.error.type !== undefined ? exception.error.type : 'error';
        }

        return {
            message: linkify(message),
            caption: caption,
            type: type
        }
    };

    var linkify = function(text) {
        var linkDetectionRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
        return text.replace(linkDetectionRegex, function(url) {
            return '<u><a class="text-white" href="' + url + '">' + url + '</a></u>';
        });
    };

    var createErrorContent = function(errorData){
        var typeClass = errorData.type === 'error' ? 'bg-danger' : 'bg-dark';
        var card = $('<div>').addClass('card text-white mb-3').addClass(typeClass);
        var cardHeader = $('<div>').addClass('card-header')
            .text('Niestety natrafiono na problem, który uniemożliwił dalsze działanie');
        var cardBody = $('<div>').addClass('card-body')
            .append($('<h5>').addClass('card-title').text(errorData.caption))
            .append($('<div>').addClass('card-text text-white mb-3').append(errorData.message))
            .append($('<div>').addClass('card-text text-white')
                .append('Informacje o systemie: ').append(platform.description))
            .append($('<div>').addClass('card-text text-white')
                .append('Wersja pluginu: ').append(GM_info.version))
            .append($('<div>').addClass('card-text text-white')
                .append('Wersja skryptu: ').append(GM_info.script.version));
        card.append(cardHeader).append(cardBody);
        return card;
    };

    DomTamper.createButton = function(properties){
        properties.observer.get().find('#'+properties.button.id).remove();
        var button = $('<input>').attr('id', properties.button.id).attr('type', 'button')
            .attr('style', properties.button.style).attr('value', 'Pobierz video').addClass(properties.button.class);
        button.bind('click', properties.button.click);
        properties.observer.get().append(button);
    };

    DomTamper.createLoader = function(w){
        prepareHead(w);
        var pageContent = $('<div>').addClass('page-content');
        pageContent.append(createLoaderContent());
        pageContent.append(createLinks(w, 'special-color white-text'));
        prepareBody(w, pageContent);
        Unloader.init(w);
    };

    var createLoaderContent = function(){
        var card = $('<div>').addClass('card text-white bg-dark');
        var cardHeader = $('<div>').addClass('card-header').text('Poczekaj trwa wczytywanie danych...');
        var cardBody = $('<div>').addClass('card-body');
        var bodyContainer = $('<div>').addClass('d-flex justify-content-center m-3');
        var spinner = $('<div>').addClass('spinner-border spinner-size').attr('role', 'status')
            .append($('<span>').addClass('sr-only').text('Loading...'));
        cardBody.append(bodyContainer.append(spinner));
        card.append(cardHeader).append(cardBody);

        return card;
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
        prepareHead(w);
        setWindowTitle(data, w);
        var pageContent = $('<div>').addClass('page-content');
        pageContent.append(Accordion.create(w, data));
        pageContent.append(createLinks(w, 'special-color white-text'));
        pageContent.append(createNotificationContainer());
        prepareBody(w, pageContent, true);
        Unloader.init(w);
        Accordion.bindActions(w, data);
    };

    var createNotificationContainer = function(){
        return $('<div>').attr('id', 'notification-container')
            .attr('aria-live', 'polite').attr('aria-atomic', 'true').addClass('notification-container');
    };

    return DomTamper;
}(DomTamper || {}));
