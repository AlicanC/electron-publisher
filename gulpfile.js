const gulp = require('gulp');
const del = require('del');
const babel = require('gulp-babel');

function clean() {
  return del([
    './dist/',
  ]);
}

function build() {
  return gulp.src('./src/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('./dist/'));
}

gulp.task('build', gulp.series(
  clean,
  build
));
