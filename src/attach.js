$(document).ready(function(){
    console.info('jQuery: ' + $().jquery);
    GM_addStyle(GM_getResourceText('css'));
    Starter.start();
});