var Notification = (function(Notification) {
    var create = function(title, bodyContent, special) {
        var specialContentClasses = special ? ' special-color white-text' : '';
        var content = $('<div>').addClass('toast notification' + specialContentClasses).attr('role', 'alert')
            .attr('aria-live', 'assertive').attr('aria-atomic', 'true')
            .attr('name', special ? 'special' : 'normal').attr('data-delay', '5000');
        var header = $('<div>').addClass('toast-header special-color-dark white-text');
        var warnIcon = $('<i>').addClass('fas fa-exclamation-triangle pr-2');
        var notificationTitle = $('<strong>').addClass('mr-auto').text(title);
        var time = $('<small>').text(new Date().toLocaleTimeString());
        var close = $('<button>').attr('type', 'button').addClass('ml-2 mb-1 close white-text')
            .attr('data-dismiss', 'toast').attr('aria-label', 'Close')
            .append($('<span>').attr('aria-hidden', 'true').text('\u00D7'));

        if(special){
            header.append(warnIcon);
            content.attr('data-autohide', 'false');
        }
        header.append(notificationTitle).append(time).append(close);
        var body = $('<div>').addClass('toast-body notification-body').append(bodyContent);

        content.append(header).append(body);
        return content;
    };

    Notification.show = function(options, w){
        options = options || {};
        var special = false;
        if (options.hasOwnProperty('special')) {
            special = options.special;
        }
        if(!options.hasOwnProperty('title') || !options.hasOwnProperty('content')){
            return;
        }

        var rootElement = $(w.document.body);
        var notification = create(options.title, options.content, special);
        $('#notification-container', rootElement).append(notification);
        $('.toast', rootElement).toast('show');
        $('.toast', rootElement).on('hidden.bs.toast', function (){
            $.each($(this), function(index, value) {
                var element = $(value);
                element.remove();
            });
        })
    };

    return Notification;
}(Notification || {}));
