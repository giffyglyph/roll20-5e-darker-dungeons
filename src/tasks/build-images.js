'use strict';

const gulp = require('gulp');
const path = require('path');

gulp.task('build-images-dev', function () {
	return buildImages(true);
});

gulp.task('build-images-live', function () {
	return buildImages(false);
});

function buildImages(dev) {
	let folder = path.join("src", "images");
	return gulp.src(path.join(folder, "**/*.*"), { base: folder })
		.pipe(gulp.dest(path.join("dist", dev ? "dev/images" : "live/img")));
}
