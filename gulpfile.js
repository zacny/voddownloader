var gulp = require('gulp');
var order = require("gulp-order");
var concat = require('gulp-concat');
var replace = require('gulp-replace-task');
var rename = require("gulp-rename");
var header = require('gulp-header');
var clean = require('gulp-clean');
var headerData = require('./src/static/headers');
var fs = require('fs');

const CONFIG = {
    tmp_dir: 'tmp',
    dist_dir: 'dist',
    css_dir: 'src/css',
    src_dir: 'src',
    source_dir: 'src/source',
    static_dir: 'src/static',
    util_dir: 'src/util'
};

function cleanTmpFiles() {
    return gulp.src(CONFIG.tmp_dir, {read: false}).pipe(clean());
}

function utilPartAttach() {
    return gulp.src(CONFIG.util_dir + '/*.js')
        .pipe(order([
            'const.js', 'tool.js', 'domTamper.js', 'videoGrabber.js',
            'configurator.js', 'changeVideoDetector.js', 'wrapperDetector.js'
        ]))
        .pipe(concat('utils.js'))
        .pipe(gulp.dest(CONFIG.tmp_dir));
}

function sourcePartAttach() {
    return gulp.src(CONFIG.source_dir + '/*.js')
        .pipe(order([
            'tvp_vod.js', 'tvp_cyf.js', 'tvp_reg.js', 'tvp.js', 'tvn.js',
            'ipla.js', 'vod.js', 'vod_ipla.js', 'wp.js', 'cda.js'
        ]))
        .pipe(concat('sources.js'))
        .pipe(gulp.dest(CONFIG.tmp_dir));
}

function runPartAttach() {
    return gulp.src(CONFIG.src_dir + '/*.js')
        .pipe(order([
            'starter.js', 'attach.js'
        ]))
        .pipe(concat('execute.js'))
        .pipe(gulp.dest(CONFIG.tmp_dir));
}

function joinScriptParts() {
    return gulp.src(CONFIG.tmp_dir + '/*.js')
        .pipe(order([
            'utils.js', 'sources.js', 'execute.js'
        ]))
        .pipe(concat('content.js'))
        .pipe(gulp.dest(CONFIG.tmp_dir));
}

function joinCssFiles(){
    return gulp.src(CONFIG.css_dir + '/*.css')
        .pipe(order([
            'download.css', "buttons.css", "sources.css"
        ]))
        .pipe(concat('voddownloader.css'))
        .pipe(gulp.dest(CONFIG.dist_dir));
}

function addTabulators(){
    return gulp.src(CONFIG.tmp_dir + '/content.js')
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
        .pipe(gulp.dest(CONFIG.tmp_dir))
}

function fillTemplate() {
    return gulp.src(CONFIG.static_dir + '/template.js')
        .pipe(replace({
            patterns: [
                {
                    match: '//include',
                    replacement: fs.readFileSync(CONFIG.tmp_dir + '/content.js', 'utf8')
                }
            ],
            usePrefix: false
        }))
        .pipe(gulp.dest(CONFIG.tmp_dir));
}

function addHeader(){
    return gulp.src(CONFIG.tmp_dir + '/template.js')
        .pipe(rename("voddownloader.user.js"))
        .pipe(header(fs.readFileSync(CONFIG.static_dir + '/header.txt', 'utf8'), { data : headerData } ))
        .pipe(gulp.dest(CONFIG.dist_dir))
}

exports.clean = cleanTmpFiles;
exports.default = gulp.series(
    cleanTmpFiles,
    gulp.parallel(utilPartAttach, sourcePartAttach, runPartAttach),
    joinScriptParts,
    gulp.parallel(joinCssFiles,
        gulp.series(addTabulators, fillTemplate, addHeader))
);