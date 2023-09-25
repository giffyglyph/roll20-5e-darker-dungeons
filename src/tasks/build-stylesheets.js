'use strict';

const beautify = require('gulp-beautify');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const path = require('path');
const remove = require('gulp-remove-empty-lines');
const replace = require('gulp-replace');
const sass = require('gulp-sass')(require('sass'));
const sourcemaps = require('gulp-sourcemaps');

gulp.task('build-stylesheets-dev', function () {
	return buildStylesheets(true);
});

gulp.task('build-stylesheets-live', function () {
	return buildStylesheets(false);
});

function buildStylesheets (dev) {
	let folder = path.join("src", "stylesheets");
	return gulp.src(path.join(folder, "**/*.scss"), { base: folder })
		.pipe(gulpif(dev, sourcemaps.init()))
		.pipe(sass())
		.pipe(gulpif(!dev, replace(/\.\.\/images\//g, 'https://raw.githubusercontent.com/Roll20/roll20-character-sheets/master/5e%20Darker%20Dungeons/img/')))
		.pipe(gulpif(dev, sourcemaps.write()))
		.pipe(gulpif(!dev, replace(/@font-face.*html {.*?}/gms, '')))
		.pipe(gulpif(!dev, remove()))
		.pipe(gulp.dest(path.join("dist", dev ? "dev/stylesheets" : "live")));
}
