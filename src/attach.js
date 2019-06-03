$(document).ready(function(){
    console.info('jQuery: ' + $().jquery);
    DomTamper.injectStyle(window, 'buttons_css');
    Starter.start();
});