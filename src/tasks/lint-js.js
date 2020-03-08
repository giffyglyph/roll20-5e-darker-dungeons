var gulp = require('gulp');
var path = require('path');
var eslint = require('gulp-eslint');

gulp.task('eslint', () => {

  return gulp.src(path.join("src", "scripts", `*.js`))
  .pipe(eslint({
      fix: true,
  }))
  .pipe(eslint.format())
  .pipe(gulp.dest(path.join("src", "scripts")))
  .pipe(eslint.failAfterError())
});
