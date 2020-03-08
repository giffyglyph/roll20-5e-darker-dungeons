'use strict';

const gulp = require('gulp');
const path = require('path');

gulp.task('build-fonts-dev', function () {
	let folder = path.join("src", "fonts");
	return gulp.src(path.join(folder, "**/*.*"), { base: folder })
		.pipe(gulp.dest(path.join("dist", "dev", "fonts")));
});
