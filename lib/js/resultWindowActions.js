(function ResultWindowActions($) {
    'use strict';

    var FocusDetector = (function(FocusDetector) {
        FocusDetector.bind = function(){
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
            console.log('Focus: ' + focus);
        };

        return FocusDetector;
    }(FocusDetector || {}));

    FocusDetector.bind();
}).bind(this)(jQuery);