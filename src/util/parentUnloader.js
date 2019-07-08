var ParentUnloader = (function(ParentUnloader) {

    ParentUnloader.init = function(){
        $(window).bind('beforeunload', function(){
            var w = window.open('', 'voddownloader-results');
            $('#parent-exist', w.document.body).addClass('do-not-display');
            $('#parent-not-exist', w.document.body).removeClass('do-not-display');
            $('#bug-report-button', w.document.body).removeClass('special-color white-text').addClass('btn-danger');
        });
    };

    return ParentUnloader;
}(ParentUnloader || {}));
