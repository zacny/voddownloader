var Accordion = (function(Accordion) {
    Accordion.create = function(w, data){
        var mainCardTitle = $('<div>').addClass('card-header').text(data.title);

        var accordion = $('<div>').addClass('accordion md-accordion').attr('id', 'accordion')
            .attr('role', 'tablist').attr('aria-multiselectable', 'true');

        createCards(accordion, data);

        var mainCardBody = $('<div>').addClass('card-body p-0').append(accordion);
        return $('<div>').addClass('card').append(mainCardTitle).append(mainCardBody);
    };

    var createCards = function(accordion, data) {
        for(var key in data.cards) {
            var card = createCard({
                card: data.cards[key],
                key: key,
                title: data.title
            });
            accordion.append(card);
        }
    };

    var createCard = function(data){
        var accordionCard = $('<div>').addClass('border border-top-0');
        var content = $('<div>').addClass('card-body pt-0');

        var badgeClass = 'badge-light';
        var textMuted = 'text-muted';
        if(data.card.items.length > 0){
            badgeClass = 'badge-danger';
            textMuted = 'text-dark';
            content.append(createCardContent(data));
        }

        var icon = $('<i>').addClass('fas').addClass(data.card.icon).addClass('pr-2');
        var badge = $('<span>').addClass('badge mr-3 float-right').addClass(badgeClass)
            .text(data.card.items.length);
        var cardTitle = $('<h6>').addClass('mb-0').addClass(textMuted).append(icon).append(badge)
            .append($('<span>').text(data.card.label));
        var link = $('<a>').append(cardTitle);
        var cardHeader = $('<div>').addClass('ml-3 p-2').attr('role', 'tab').attr('id', data.key).append(link);

        var cardBody = $('<div>').addClass('collapse').attr('role', 'tabpanel')
            .attr('aria-labelledby', data.key).append(content);
        if(data.card.collapse){
            cardBody.addClass('show');
        }

        accordionCard.append(cardHeader);
        accordionCard.append(cardBody);
        return accordionCard;
    };

    var createCardContent = function(data){
        var table = $('<table>').addClass('table table-bordered table-striped btn-table');
        var tbody = $('<tbody>');
        table.append(tbody);
        createRows(tbody, data);

        return table;
    };

    var createRows = function(tableBody, data){
        data.card.items.forEach(function(item) {
            tableBody.append(createRow({
                item: item,
                info: data.card.info,
                title: data.title,
                actions: data.card.actions
            }));
        });
    };

    var createRow = function(data){
        var actions = $('<td>').attr('scope', 'row').addClass('action-row-' + data.actions.length);
        data.actions.forEach(function(action){
            actions.append(createButton(action, data));
        });

        var description = $('<td>').html(createDescriptionHtml(data));
        return $('<tr>').append(actions).append(description);
    };

    var createDescriptionHtml = function(data){
        var descriptionHtml = $('<div>');

        createDescription(data).forEach(function(item, idx, array){
            descriptionHtml.append($('<b>').text(item.desc + ': '))
                .append($('<span>').text(item.value));
            if(idx !== array.length - 1) {//not last
                descriptionHtml.append($('<span>').text(', '));
            }
        });
        return descriptionHtml;
    };

    var itemExist = function(data, info){
        return data.item.hasOwnProperty(info.name) && data.item[info.name] != null
    };

    var createDescription = function(data){
        var description = [];
        data.info.forEach(function(info){
            if (itemExist(data, info)) {
                description.push({
                    desc: info.desc,
                    value: data.item[info.name]
                });
            }
        });
        return description;
    };

    var createButton = function(action, data){
        return $('<button>').attr('type', 'button').attr('data-url', data.item.url).attr('data-title', data.title)
            .addClass('btn btn-dark btn-sm m-1 pl-3 pr-3')
            .append($('<i>').addClass('fas pr-1').addClass(action.icon)).append(action.label);
    };

    Accordion.bindActions = function(w, data){
        cardActions(w, data);
        buttonActions(w);
    };

    var cardActions = function(w, data){
        for(var key in data.cards) {
            var cardHeader = $(w.document.body).find('#' + key);
            var disabled = cardHeader.find('h6.text-muted');
            if(disabled.length){
                disabled.addClass('cursor-normal');
                return;
            }

            $(w.document.body).find('#' + key).click(function() {
                var id = $(this).attr('id');
                $(w.document.body).find('div[aria-labelledby="' + id + '"]').toggle();
            });
        }
    };

    var buttonActions = function(w){
        getButton(w, '.fa-clone').click(function(){ copyActionClick($(this), w) });
        getButton(w, '.fa-film').click(function(){ openActionClick($(this), w) });
        getButton(w, '.fa-download').click(function(){ downloadActionClick($(this), w) });
    };

    var getButton = function(w, iconClass){
        return $(w.document.body).find(iconClass).parent();
    };

    var downloadActionClick = function (element, w) {
        var options = {title: 'Rozpoczęto pobieranie pliku', content: element.attr('data-title')};
        Tool.downloadFile(element.attr('data-url'), element.attr('data-title'));
        Notification.show(options, w);
    };

    var copyActionClick = function (element, w) {
        GM_setClipboard(element.attr('data-url'));
        var options = {title: 'Kopiowanie', content: 'Skopiowano do schowka'};
        Notification.show(options, w);
    };

    var openActionClick = function (element, w) {
        w.open(element.attr('data-url'));
    };

    return Accordion;
}(Accordion || {}));
