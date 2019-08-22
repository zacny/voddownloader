var gulp = require('gulp'),
    order = require('gulp-order'),
    concat = require('gulp-concat'),
    replace = require('gulp-replace'),
    gulpif = require('gulp-if'),
    rename = require('gulp-rename'),
    header = require('gulp-header'),
    clean = require('gulp-clean'),
    template = require('gulp-template'),
    log = require('fancy-log'),
    colors = require('colors/safe'),
    pkg = require('./package'),
    fs = require('fs');

const config = {
    tmp_dir: 'tmp',
    dist_dir: 'dist',
    lib_css_dir: 'lib/css',
    lib_js_dir: 'lib/js',
    img_dir: 'img',
    css_dir: 'src/css',
    src_dir: 'src',
    source_dir: 'src/source',
    static_dir: 'src/static',
    util_dir: 'src/util',
    script_name: pkg.config.scriptName,
    meta_name: pkg.config.metaName,
    buttons_css_name: pkg.config.buttonCssName,
    content_css_name: pkg.config.contentCssName,
    mdb_witch_patch_name: pkg.config.mdbWithPathName,
    production: true
};

const UNIT_SEP = String.fromCharCode(31);

function padEnd(target, minLen = 15, padStr = ' ') {
    if (typeof padEnd.cache !== 'object') padEnd.cache = {};

    padStr = typeof padStr !== 'string' || padStr.length < 1 ? ' ' : padStr;
    let padKey = target.length + UNIT_SEP + minLen + UNIT_SEP + padStr;

    // read from cache
    if (padKey in padEnd.cache) return target + padEnd.cache[padKey];

    let finalPad = '';
    let padLen = minLen - target.length;
    for (let i = 0; i < padLen; i++)
        finalPad += padStr;

    // make cache
    padEnd.cache[padKey] = finalPad;

    return target + finalPad;
}

function headersFromJson() {
    var headerData = pkg.config.headers;
    let ret = [];
    for (let field of Object.keys(headerData)) {
        if (Array.isArray(headerData[field])) {
            headerData[field].forEach(element => {
                if (typeof element === 'string') {
                    ret.push(`// @${padEnd(field)}${element}`);
                }
            })
        } else if (typeof headerData[field] === 'string') {
            ret.push(`// @${padEnd(field)}${headerData[field]}`);
        }
    }
    return ret.join('\n')
}

function detectDevelopmentFlag(cb){
    if (process.argv.indexOf('--development') > -1) {
        config.production = false;
    }
    cb();
}

function cleanTmpFiles() {
    return gulp.src(config.tmp_dir + "/*", {read: false}).pipe(clean());
}

function utilPartAttach() {
    return gulp.src(config.util_dir + '/*.js')
        .pipe(order([
            'exception.js', 'format.js', 'tool.js', 'config.js', 'asyncStep.js', 'notification.js',
            'pluginSettingsDetector.js', 'domTamper.js', 'executor.js', 'configurator.js', 'changeVideoDetector.js',
            'wrapperDetector.js', 'elementDetector.js', 'unloader.js', 'messageReceiver.js'
        ]))
        .pipe(concat('utils.js'))
        .pipe(gulp.dest(config.tmp_dir));
}

function sourcePartAttach() {
    return gulp.src(config.source_dir + '/*.js')
        .pipe(order([
            'tvp_vod.js', 'tvp_cyf.js', 'tvp_reg.js', 'tvn.js', 'ipla.js', 'vod.js', 'vod_ipla.js', 'wp.js', 'cda.js',
            'ninateka.js', 'arte.js'
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
    return gulp.src([config.css_dir + '/sources.css', config.css_dir + '/buttons.css'])
        .pipe(concat(config.buttons_css_name))
        .pipe(gulp.dest(config.lib_css_dir));
}

function copyCssFiles(){
    return gulp.src(config.css_dir + '/content.css')
        .pipe(rename("voddownloader-content.css"))
        .pipe(gulp.dest(config.lib_css_dir));
}

//remove some expressions before release
function replaceRegularExpressions() {
    var regularExpressions = [
        //remove whole lines with 'debugger'
        {label: 'debugger', pattern: /(?:.*debugger.*\n)/g, replacement: '', counter: 0},
        //remove whole lines with console.log(...)
        {label: 'console.log(...)', pattern: /(?:.*console\.log\(.*\).*\n)/g, replacement: '', counter: 0},
        //remove long comments /** **/
        {label: '/** comment **/', pattern: /.*\/\*[\s\S]*?\*\/[\s]*\n/gm, replacement: '', counter: 0}
    ];

    var task = gulp.src(config.tmp_dir + '/content.js');
    regularExpressions.forEach(function(element){
        task = task.pipe(
            gulpif(config.production, replace(element.pattern, function(match) {
                element.counter++;
                return element.replacement;
            }))
        );
    });

    return task.pipe(gulp.dest(config.tmp_dir)).on('end', function() {
        regularExpressions.forEach(function(element){
            if(config.production) {
                log.info('Found: ' + colors.red(element.counter) + ' matches of: ' + colors.bold(element.label) +
                    ' using pattern: ' + colors.blue(element.pattern));
            }
        });
    });
}

function replaceContent(){
    return gulp.src(config.tmp_dir + '/content.js')
        .pipe(replace(/(?:\n)/g, '\n\t')) //linux eol
        .pipe(replace(/(?:\r\n)/g, '\r\n\t')) //windows eol
        .pipe(gulp.dest(config.tmp_dir));
}

function getPath(fileName, dir){
    return (config.production ? pkg.config.production.resourcesHost : pkg.config.development.resourcesHost)
        + '/' + dir + '/' + fileName;
}

function prepareHeaders(){
    var headers = {};

    headers.name = config.production ? pkg.config.production.name : pkg.name;
    headers.version = config.production ? pkg.version : pkg.version + '-develop';
    headers.buttonsCssPath = getPath(config.buttons_css_name, config.lib_css_dir);
    headers.contentCssPath = getPath(config.content_css_name, config.lib_css_dir);
    headers.updateUrl = getPath(config.meta_name, config.dist_dir);
    headers.downloadUrl = getPath(config.script_name, config.dist_dir);

    return headers;
}

function makeMetaJs(){
    return gulp.src(config.static_dir + '/header.txt')
        .pipe(template({ data : prepareHeaders() } )) //add environment dependent headers
        .pipe(replace(/\/\/ @include@/, headersFromJson())) //fill headers from config file
        .pipe(rename(config.meta_name))
        .pipe(gulp.dest(config.dist_dir))
}

function makeUserJs() {
    var contentFile = fs.readFileSync(config.tmp_dir + '/content.js', 'utf8');
    var headerFile = fs.readFileSync(config.dist_dir + '/' + config.meta_name, 'utf8');
    return gulp.src(config.static_dir + '/template.js')
        .pipe(header(headerFile))
        .pipe(replace(/\/\/ @include@/, contentFile)) //fill template with script content
        .pipe(rename(config.script_name))
        .pipe(gulp.dest(config.dist_dir))
}

exports.clean = cleanTmpFiles;
exports.clean.description = "clean temporary files";
exports.default = gulp.series(
    detectDevelopmentFlag,
    cleanTmpFiles,
    gulp.parallel(utilPartAttach, sourcePartAttach, runPartAttach),
    joinScriptParts,
    gulp.parallel(copyCssFiles, joinCssFiles,
        gulp.series(replaceContent, replaceRegularExpressions, makeMetaJs, makeUserJs)
    )
);
exports.default.description = "build project";
exports.default.flags = {
    '--development': "add some development features to script"
};