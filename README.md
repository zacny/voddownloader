# voddownloader (The script is no longer supported)

This is a script for [Tampermonkey](https://tampermonkey.net/index.php ). 
Creates an icon in top corner of video or somewhere else on the page (depends on the service). You can use it to download informations about video, content or subtitles.

#### currently supported vod services
- [ipla.tv](https://www.ipla.tv)
- [player.pl](https://player.pl/)
- [vod.pl](https://vod.pl/)
- [vod.pl - ipla bridge](https://vod.pl/cyfrowy-polsat-iplatv)
- [vod.pl - player bridge](https://vod.pl/playerpl-promocja)
- [vod.tvp.pl](https://vod.tvp.pl/)
- [polish regional tv](https://regiony.tvp.pl/)
- [cyfrowa.tvp.pl](https://cyfrowa.tvp.pl)
- [tvp sport](https://sport.tvp.pl)
- [tvpis](https://wiadomosci.tvp.pl)
- [tvp polonia](polonia.tvp.pl)
- [tvp info](https://www.tvp.info)
- [tvp parlament](https://www.tvpparlament.pl)
- [other tvp subdomains](https://koronakrolow.vod.tvp.pl)
- [arte.tv](https://www.arte.tv)
- [ninateka.pl](http://ninateka.pl)
- [video.wp.pl](https://video.wp.pl)
- [cda.pl](https://www.cda.pl)
- [trwam](https://tv-trwam.pl/local-vods)

### Screenshots
![vod](screenshots/vod.png?raw=true "vod")
![ipla](screenshots/ipla.png?raw=true "ipla")
![tvn](screenshots/tvn.png?raw=true "tvn")
![info](screenshots/info.png?raw=true "info")

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
