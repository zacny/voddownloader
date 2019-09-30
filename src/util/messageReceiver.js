var MessageReceiver = (function(MessageReceiver) {
    var win;
    var origin;
    var callbackFunction;
    var alreadyConfirmed = false;
    var alreadyPosted = false;

    var receiveMessage = function(event, callback){
        if (event.origin !== origin) {
            return;
        }

        var data = JSON.parse(event.data);
        /** confirmation for the sender */
        if(data.confirmation){
            alreadyConfirmed = true;
        }
        /** message for the recipient */
        else {
            data.confirmation = true;
            if(!alreadyPosted) {
                window.removeEventListener('message', callbackFunction);
                alreadyPosted = true;
                postMessage(data);
                callback(data);
            }
        }
    };

    var postMessage = function(data){
        data = JSON.stringify(data);
        win.postMessage(data, '*');
    };

    MessageReceiver.awaitMessage = function(object, callback){
        initCommunication(object, callback);
    };

    var initCommunication = function(object, callback){
        callbackFunction = function(e){
            receiveMessage(e, callback);
        };
        window.addEventListener('message', callbackFunction);
        win = getProperty(object, 'windowReference');
        origin = getProperty(object, 'origin');
    };

    var getProperty = function(object, prop){
        if(object.hasOwnProperty(prop)){
            return object[prop];
        }
    };

    MessageReceiver.postUntilConfirmed = function(object){
        initCommunication(object);
        isMessageConfirmed(config.attempts, getProperty(object, 'message'))
    };

    var isMessageConfirmed = function(attempt, message){
        if (alreadyConfirmed || attempt <= 0) {
            return Promise.resolve().then(function(){
                window.removeEventListener('message', callbackFunction);
                if(attempt <= 0){
                    console.warn("Nie udało się przekazać adresu z okna głównego.");
                }
            });
        } else if(attempt > 0){
            attempt = attempt-1;
            postMessage(message);
            return Promise.resolve().then(
                setTimeout(isMessageConfirmed, config.attemptTimeout, attempt, message)
            );
        }
    };

    return MessageReceiver;
}(MessageReceiver || {}));
