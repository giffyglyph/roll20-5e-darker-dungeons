'use strict';

let fs = require('fs');
let path = require('path');
let folders = require('./folders.js');
let minimist = require('minimist');

module.exports = {
	getTaskList: function () {
		// Get development status
		let dev = minimist(process.argv).dev ? true : false;

		let taskList = [];
		project.forEach(project => format.forEach(format => taskList.push({project, format, file, dev})));
		return taskList;
	}
}
