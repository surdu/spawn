#!/usr/bin/env node

"use strict";

const Git = require("nodegit");
const readline = require('readline');
const argv = require('minimist')(process.argv.slice(2));
const recursive = require('recursive-readdir');
const rimraf = require('rimraf');
const fs = require('fs');
const path = require('path');
const escape_re = require('escape-string-regexp');
const mkdirp = require('mkdirp');

var config;

// Ask a question on the terminal and return
// a promise that will resolve with the answer givven
function ask(question, def) {
	var term = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	def = def || "";

	return new Promise(function (resolve) {
		term.question(`${question}: (${def}) `, function (answer) {
			resolve(answer || def);
			term.close();
		});
	});
}

function askAll(questions) {
	var keys = Object.keys(questions);

	return new Promise(function (resolve) {
		var index = 0;
		var result = [];

		function solveCurrent() {
			var key = keys[index];
			var def = questions[key];
			ask(key, def).then(function (value) {
				result[index] = value;
				index += 1;
				if (index < keys.length) {
					solveCurrent();
				}
				else {
					resolve(result);
				}
			});
		}

		solveCurrent();
	});
}

function parseFile(content, context) {
	//TODO: read this from the config file
	var startPattern = escape_re("{[");
	var endPattern = escape_re("]}");
	var tmplPattern = new RegExp(`${startPattern}(.*?)${endPattern}`, "g");
	var result = content;

	var match = tmplPattern.exec(result);
	while (match != null) {
		let varName = match[1];
		// console.log("Found:", match[0], "->", context[varName]);
		result = result.replace(match[0], context[varName]);
		match = tmplPattern.exec(result);
	}

	return result;
}

// If the repo was not specified as argument,
// show the usage message and exit
if (argv._.length === 0) {
	console.log("Usage: spawn <github-user>/<github-repo>");
	process.exit(64);
}

const repo = argv._[0];

console.log("Cloning ...");
Git.Clone(`https://github.com/${repo}`, ".spawn")
.then(function () {
	console.log("Parsing config ...");
	// Read config from repo
	return new Promise(function (resolve, reject) {
			fs.readFile(".spawn/spawn.json", "utf-8", function (err, file) {
				if (err) {
					reject("Could not read the config file 'spawn.json' from repo:", err);
					return;
				}

				try {
					 config = JSON.parse(file);
				}
				catch(ex) {
					reject("Invalid JSON in spawn.json file");
					return;
				}

				resolve(config);
			});
	});
})
.then(function (config) {
	// Ask all the templates values
	return new Promise(function (resolve) {

		var context = {};
		var keys = Object.keys(config.values);

		if (keys.length === 0) {
			resolve();
			return;
		}

		askAll(config.values).then(function (values) {
			for (let f = 0; f < keys.length; f++) {
				var key = keys[f];
				var answer = values[f];
				context[key] = answer;
			}

			// console.log("Finished all question:", context);
			resolve(context);
		});
	});
})
.then(function (context) {
	console.log("Writing result...");
	return new Promise(function (resolve, reject) {

		recursive('.spawn', [".spawn/.git/**"], function (err, files) {
			if (err) {
				reject("Failed to read local clone:", err);
			}

			for (let f = 0; f < files.length; f++) {
				var sourceFilename = files[f];
				var destFilename = sourceFilename.replace(".spawn/", "");

				var destDir = path.dirname(destFilename);
				if (destDir) {
					mkdirp.sync(destDir);
				}

				var fileContent = fs.readFileSync(sourceFilename, "utf-8");
				var solvedContent = parseFile(fileContent, context);
				fs.writeFileSync(destFilename, solvedContent);
			}

			resolve();
		});
	});
})
.then(function () {
	rimraf(".spawn", function () {
		console.log("Done");
	});
})
.catch(function (err) {
	console.error("Encountered errors:");
	console.error(err);
});
