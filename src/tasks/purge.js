'use strict';

const del = require('del');
const gulp = require('gulp');
const path = require('path');

gulp.task('purge', function () {
	return del(path.join("dist"));
});
