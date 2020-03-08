'use strict';

let fs = require('fs');
let path = require('path');

const DIST = "dist";
const SRC = "src";

module.exports = {
	DIST: DIST,
	SRC: SRC,
	createPath: function (folders) {
		let target = "";
		folders.forEach(function(folder) {
			target = path.join(target, folder);
			if (!fs.existsSync(target)) {
				fs.mkdirSync(target);
			}
		});
	}
}
