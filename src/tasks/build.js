'use strict';

const gulp = require('gulp');

require('./build-fonts');
require('./build-images');
require('./build-sheets');
require('./build-stylesheets');
require('./build-vendors');

gulp.task('build-dev', gulp.parallel('build-fonts-dev', 'build-stylesheets-dev', 'build-images-dev', 'build-sheets-dev', 'build-vendors-dev'));

gulp.task('build-live', gulp.parallel('build-stylesheets-live', 'build-images-live', 'build-sheets-live'));
