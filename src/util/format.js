function Format(data) {
    if('bitrate' in data){
        this.bitrate = data.bitrate;
    }
    else {
        this.bitrate = 'brak danych';
    }
    if('url' in data){
        this.url = data.url;
    }
    if('quality' in data){
        this.quality = data.quality;
    }
    if('playable' in data){
        this.playable = data.playable
    }
    else {
        this.playable = true;
    }
}
