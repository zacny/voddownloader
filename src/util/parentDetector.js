var ParentDetector = (function(ParentDetector) {
    var window;

    ParentDetector.init = function(w){
        window = w;
        bind();
    };

    var bind = function(){
        $(window).on("blur focus", function(e) {
            var prevType = $(this).data("prevType");

            if (prevType != e.type) {//  reduce double fire issues
                switch (e.type) {
                    case "blur":
                        check(false);
                        break;
                    case "focus":
                        check(true);
                        break;
                }
            }

            $(this).data("prevType", e.type);
        });
    };

    var check = function(focus){
        window.console.log('focus: ' + focus + '; opener: ' + (window.opener !== null));
        if(focus && window.opener === null){
            $('#parentExist', window.document.body).addClass('do-not-display');
            $('#parentNotExist', window.document.body).removeClass('do-not-display');
        }
    };

    return ParentDetector;
}(ParentDetector || {}));
