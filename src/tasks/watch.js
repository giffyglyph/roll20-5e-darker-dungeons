'use strict';

const gulp = require('gulp');

require('./build-fonts');
require('./build-images');
require('./build-sheets');
require('./build-stylesheets');
require('./build-vendors');

gulp.task('watch', function(cb) {
	gulp.watch("src/sheets/**/*.html", gulp.parallel(['build-sheets-dev', 'build-sheets-live']));
	gulp.watch("src/templates/**/*.html", gulp.parallel(['build-sheets-dev', 'build-sheets-live']));
	gulp.watch("src/scripts/**/*.js", gulp.parallel(['build-sheets-dev', 'build-sheets-live']));
	gulp.watch("src/stylesheets/**/*.scss", gulp.parallel(['build-stylesheets-dev', 'build-stylesheets-live']));
	gulp.watch("src/images/**/*.*", gulp.parallel(['build-images-dev', 'build-images-live']));
	gulp.watch("src/fonts/**/*.*", gulp.parallel(['build-fonts-dev']));
	gulp.watch("src/vendors/**/*.*", gulp.parallel(['build-vendors-dev']));

	return cb();
});
