'use strict';

var http = require('http');
var fs = require('fs');
var pkg = require('../package.json');

var config = {
    cssPath: '/dist/' + pkg.config.cssName,
    scriptPath: '/dist/' + pkg.config.scriptName,
    prefix: '.',
    port: pkg.config.serverPort,
    cssFile: function(){
        return this.prefix + this.cssPath;
    },
    scriptFile: function(){
        return this.prefix + this.scriptPath;
    }
};

http.createServer(function (req, res) {
    if (req.url === config.cssPath) {
        fs.readFile(config.cssFile(), function(err, page) {
            res.writeHead(200, {'Content-Type': 'text/css'});
            res.write(page);
            res.end();
        });
    }
    else if(req.url === config.scriptPath) {
        fs.readFile(config.scriptFile(), function(err, page) {
            res.writeHead(200, {'Content-Type': 'application/javascript'});
            res.write(page);
            res.end();
        });
    }
}).listen(config.port);