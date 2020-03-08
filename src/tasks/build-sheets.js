'use strict';

const beautify = require('gulp-beautify');
const file = require('gulp-file');
const fs = require('fs');
const glob = require('glob');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const path = require('path');
const replace = require('gulp-replace');

gulp.task('build-sheets-dev', function () {
	return buildSheet(true);
});

gulp.task('build-sheets-live', function () {
	return buildSheet(false);
});

function buildSheet(dev) {
	let templates = getTemplates();
	let helpers = getScripts(true);
	let workers = getScripts(false);
	let sheet = fs.readFileSync(path.join("src", "sheets", "darker-dungeons.html"), 'utf8');

	if (dev) {
		sheet = getWrapper(sheet);
	}

	return file('.', sheet, { src: true })
		.pipe(replace(/(<div class="sheet-rolltemplates">)(<\/div>)/g, `$1${templates}$2`))
		.pipe(gulpif(dev, replace(/(<script type="text\/javascript" data-type="helpers">)(<\/script>)/g, `$1${helpers}$2`)))
		.pipe(replace(/(<script type="text\/javascript" data-type="workers">)(<\/script>)/g, `$1${workers}$2`))
		.pipe(beautify.html({ indent_with_tabs: true }))
		.pipe(replace(/\.\.\.\]\]\}\}/g, ''))
		.pipe(gulpif(dev, replace(/<script type="text\/javascript" data-type=".*?">/g, '<script>')))
		.pipe(gulpif(!dev, replace(/<script type="text\/javascript" data-type="helpers">.*?<\/script>/g, '')))
		.pipe(gulpif(!dev, replace(/<script type="text\/javascript" data-type="workers">/g, '<script type="text/worker">')))
		.pipe(gulp.dest(path.join("dist", dev ? "dev" : "live", "darker-dungeons.html")));
}

function getScripts(dev) {
	return glob.sync(path.join("src", "scripts", `*${dev ? `-dev` : `[!-dev]`}.js`))
		.map(x => fs.readFileSync(x, 'utf8'))
		.join('\n');
}

function getTemplates() {
	return glob.sync(path.join("src", "templates", "*.html"))
		.map(x => fs.readFileSync(x, 'utf8'))
		.join('\n');
}

function getWrapper(content) {
	return `
		<!DOCTYPE html>
		<html>
			<head>
				<title>Roll20 Character Sheet</title>
				<link rel="stylesheet" href="./vendors/roll20/base.css">
				<link rel="stylesheet" href="./vendors/roll20/app.css">
				<link rel="stylesheet" href="./stylesheets/darker-dungeons.css">
				<style>
					.ui-dialog {
						padding: 0;
						width: 100%;
						overflow: visible;
						position: inherit !important;
					}
					.ui-dialog .charsheet {
						padding: 12px;
					}
				</style>
				<script src="./vendors/jquery/jquery-3.3.1.min.js"></script>
			</head>
			<body class="ui-dialog sheet-development">
				<div class="charsheet">
					${content}
				</div>
			</body>
		</html>
	`;
}
