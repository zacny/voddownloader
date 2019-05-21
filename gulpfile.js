var gulp = require('gulp'),
    order = require("gulp-order"),
    concat = require('gulp-concat'),
    replace = require('gulp-replace-task'),
    rename = require("gulp-rename"),
    header = require('gulp-header'),
    clean = require('gulp-clean'),
    server = require( 'gulp-develop-server'),
    livereload = require('gulp-livereload'),
    pkg = require('./package');
    fs = require('fs');

var config = {
    tmp_dir: 'tmp',
    dist_dir: 'dist',
    css_dir: 'src/css',
    src_dir: 'src',
    source_dir: 'src/source',
    static_dir: 'src/static',
    util_dir: 'src/util',
    script_name: pkg.config.scriptName,
    css_name: pkg.config.cssName,
    server: {
        options: {
            path: './app/server.js'
        },
        files: [
            './app/server.js',
            pkg.config.cssName,
            pkg.config.scriptName
        ]
    },
    developement: false
};

function detectDevelopmentFlag(cb){
    if (process.argv.indexOf('--development') > -1) {
        config.developement = true;
    }
    cb();
}

function cleanTmpFiles() {
    return gulp.src(config.tmp_dir + "/*", {read: false}).pipe(clean());
}

function utilPartAttach() {
    return gulp.src(config.util_dir + '/*.js')
        .pipe(order([
            'const.js', 'tool.js', 'domTamper.js', 'videoGrabber.js',
            'configurator.js', 'changeVideoDetector.js', 'wrapperDetector.js'
        ]))
        .pipe(concat('utils.js'))
        .pipe(gulp.dest(config.tmp_dir));
}

function sourcePartAttach() {
    return gulp.src(config.source_dir + '/*.js')
        .pipe(order([
            'tvp_vod.js', 'tvp_cyf.js', 'tvp_reg.js', 'tvp.js', 'tvn.js',
            'ipla.js', 'vod.js', 'vod_ipla.js', 'wp.js', 'cda.js'
        ]))
        .pipe(concat('sources.js'))
        .pipe(gulp.dest(config.tmp_dir));
}

function runPartAttach() {
    return gulp.src(config.src_dir + '/*.js')
        .pipe(order([
            'starter.js', 'attach.js'
        ]))
        .pipe(concat('execute.js'))
        .pipe(gulp.dest(config.tmp_dir));
}

function joinScriptParts() {
    return gulp.src(config.tmp_dir + '/*.js')
        .pipe(order([
            'utils.js', 'sources.js', 'execute.js'
        ]))
        .pipe(concat('content.js'))
        .pipe(gulp.dest(config.tmp_dir));
}

function joinCssFiles(){
    return gulp.src(config.css_dir + '/*.css')
        .pipe(order([
            'download.css', "buttons.css", "sources.css"
        ]))
        .pipe(concat(config.css_name))
        .pipe(gulp.dest(config.dist_dir));
}

function addTabulators(){
    return gulp.src(config.tmp_dir + '/content.js')
        .pipe(replace({
            patterns: [
                {//linux
                    match: /(?:\n)/g,
                    replacement: '\n\t'
                },
                {//windows
                    match: /(?:\r\n)/g,
                    replacement: '\r\n\t'
                }
            ]
        }))
        .pipe(gulp.dest(config.tmp_dir))
}

function fillTemplate() {
    return gulp.src(config.static_dir + '/template.js')
        .pipe(replace({
            patterns: [
                {
                    match: '//include',
                    replacement: fs.readFileSync(config.tmp_dir + '/content.js', 'utf8')
                }
            ],
            usePrefix: false
        }))
        .pipe(gulp.dest(config.tmp_dir));
}

function addHeader(){
    return gulp.src(config.tmp_dir + '/template.js')
        .pipe(rename(config.script_name))
        .pipe(header(fs.readFileSync(config.static_dir + '/header.txt', 'utf8'), { data : pkg } ))
        .pipe(gulp.dest(config.dist_dir))
}

function startServer(cb){
    server.listen(config.server.options, livereload.listen );
    function restart(file) {
        server.changed( function( error ) {
            if( ! error ) livereload.changed( file.path );
        });
    }
    gulp.watch(config.server.files).on( 'change', restart );
    cb();
}

exports.clean = cleanTmpFiles;
exports.clean.description = "clean temporary files";
exports.server = startServer;
exports.server.description = "run development server";
exports.default = gulp.series(
    detectDevelopmentFlag,
    cleanTmpFiles,
    gulp.parallel(utilPartAttach, sourcePartAttach, runPartAttach),
    joinScriptParts,
    gulp.parallel(joinCssFiles,
        gulp.series(addTabulators, fillTemplate, addHeader))
);
exports.default.description = "build project";
exports.default.flags = {
    '--development': "add some development features to script"
};