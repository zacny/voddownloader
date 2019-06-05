$(document).ready(function(){
    console.info('jQuery: ' + $().jquery);
    DomTamper.injectStyle(window, 'buttons_css');
    Starter.start();
    //Download type detection
    // console.log(GM_info.downloadMode);
});