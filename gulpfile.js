var webserver = require('gulp-webserver');
var gulp = require('gulp');

gulp.task('static-server', function () {
    return gulp.src('./')
        .pipe(webserver({
            directoryListing: true,
            host: '0.0.0.0'
        }));
});

gulp.task('dev', ['static-server']);
