function Format(data) {
    this.bitrate = null;
    this.format = null;
    this.playable = true;
    $.extend(true, this, data);
}
