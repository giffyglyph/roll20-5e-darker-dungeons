'use strict';

const gulp = require('gulp');
const path = require('path');

gulp.task('build-vendors-dev', function (cb) {
	let folder = path.join("src", "vendors");
	return gulp.src(path.join(folder, "**/*.*"), { base: folder })
		.pipe(gulp.dest(path.join("dist", "dev", "vendors")));
});
