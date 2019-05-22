# voddownloader

This is a script for [Tampermonkey](https://tampermonkey.net/index.php ). 
Creates a button in top right corner of video, that you can use to download a content of it.

#### currently supported vod services
- [vod.tvp.pl](https://vod.tvp.pl/)
- [cyfrowa.tvp.pl](https://cyfrowa.tvp.pl)
- [tvp.pl](http://www.tvp.pl)
- [polish local tv](https://regiony.tvp.pl/)
- [player.pl](https://player.pl/)
- [cda.pl](https://www.cda.pl)
- [vod.pl](https://vod.pl/)
- [vod.pl - ipla bridge](https://vod.pl/cyfrowy-polsat-iplatv)
- [ipla.tv](https://www.ipla.tv)
- [video.wp.pl](https://video.wp.pl)

## Installation

If you have already [tampermonkey](https://tampermonkey.net/index.php ) installed. Just click [here](https://github.com/zacny/voddownloader/raw/master/dist/voddownloader.user.js). Tampermonkey should add this script to his library.

## Development

This script needs [node.js](https://nodejs.org/en/) and [gulp](https://gulpjs.com/).
Gulp require node.js, so install [node.js](https://nodejs.org/en/download/) first.
How to install gulp you can read on [gulp quick start page](https://gulpjs.com/docs/en/getting-started/quick-start).

The next step is to install the required dependencies:
```javascript
npm install
```
Now run:
```javascript
npm-scripts-info
```
to see available commands
```raw
build:
  Build project.
dev:
  Build project with some development features.
start:
  Run development server.
clean:
  Clean temporary files.
```
To build script use:
```javascript
npm run build
```

#### contact

[slack channel](https://zacny.slack.com/messages/CEJJWS6HK)

[script homepage](https://greasyfork.org/pl/scripts/6049-skrypt-umo%C5%BCliwiaj%C4%85cy-pobieranie-materia%C5%82%C3%B3w-ze-znanych-serwis%C3%B3w-vod/feedback)
