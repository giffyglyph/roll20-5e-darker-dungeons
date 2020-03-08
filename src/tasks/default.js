'use strict';

const gulp = require('gulp');

require('./build');
require('./purge');
require('./watch');

gulp.task('default', gulp.series('purge', gulp.parallel('build-dev', 'build-live'), 'watch'));
