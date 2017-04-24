'use strict';

var gulp = require('gulp');
var electron = require('electron-connect').server.create();

gulp.task('serve', function () {

    // Start browser process
    electron.start(['-debug --enable-logging']);

    // Restart browser process
    gulp.watch(['app.js','main-process/**/*.js','rendered-process/**/*.js'], electron.restart);

    // Reload renderer process
    gulp.watch(['index.js', 'index.html','sections/**/*.html'], electron.reload);
});

gulp.task('reload:browser', function () {
    // Restart main process
    electron.restart(['debug']);
});

gulp.task('reload:renderer', function () {
    // Reload renderer process
    electron.reload();
});

gulp.task('default', ['serve']);