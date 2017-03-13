'use strict';

var del = require('del');
var merge = require('merge2');
var sequence = require('run-sequence');
var gulp = require('gulp');
var watch = require('gulp-watch');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');
var cache = require('gulp-cached');
var run = require('gulp-run');

var ts = require('gulp-typescript');

var Config = require('./gulpfile.config');
var config = new Config();
var tsProject = ts.createProject('tsconfig.json');


gulp.task('clean', function () {
    try {
        del.sync([config.target]);
    } catch (e) {
        if (developmentMode) {
            console.log(e);
        }
        else {
            throw e;
        }
    }
});

gulp.task('build:ts', function () {

    var tsResult = gulp.src(config.typeScriptFiles);

    tsResult = tsResult.pipe(sourcemaps.init());
    tsResult = tsResult.pipe(tsProject(ts.reporter.longReporter()));

    var tsResultJs = tsResult.js;
    tsResultJs = tsResultJs.pipe(cache("ts"));
    tsResultJs = tsResultJs.pipe(uglify());

    tsResultJs = tsResultJs.pipe(sourcemaps.write(".", {includeContent: true, sourceRoot: "/"}));

    return merge([
        tsResult.dts.pipe(gulp.dest(config.target + "/")),
        tsResultJs.pipe(gulp.dest(config.target + "/"))
    ]);
});


gulp.task('dist', [], function () {
    sequence("clean", "build:ts");
});
gulp.task('watch', [], function () {
    gulp.watch(config.typeScriptFiles, {}, ["build:ts"]);
    sequence("dist");
});

gulp.task('default', ["watch"]);

// ------------------------------------------------------------------
// utils
// ------------------------------------------------------------------

var onError = function (err) {
    gutil.log(
            gutil.colors.red.bold('[ERROR:' + err.plugin + ']:'),
            gutil.colors.bgRed(err.message),
            gutil.colors.red.bold('in:' + err.fileName)
    );
    this.emit('end');
};
