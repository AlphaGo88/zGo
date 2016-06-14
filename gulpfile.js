var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    minifycss = require('gulp-minify-css');

gulp.task('js', function() {
    gulp.src('./src/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('./dist'));
});

gulp.task('css', function() {
    gulp.src('./src/*.css')
        .pipe(minifycss())
        .pipe(gulp.dest('./dist'));
});

gulp.task('default', ['js', 'css']);