#!/usr/bin/env node

"use strict";

const Git = require("nodegit");
const readline = require('readline');
const argv = require('minimist')(process.argv.slice(2));
const recursive = require('recursive-readdir');
const rimraf = require('rimraf');
const fs = require('fs');
const escape_re = require('escape-string-regexp');

var term;
var config;

// Ask a question on the terminal and return
// a promise that will resolve with the answer givven
function ask(question, def) {
	term = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	def = def || "";

	return new Promise(function (resolve) {
		term.question(`${question}: (${def})`, function (answer) {
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

	var match = tmplPattern.exec(content);
	while (match != null) {
		console.log("Found:", match[0]);
		match = tmplPattern.exec(content);
	}
}

// If the repo was not specified as argument,
// show the usage message and exit
if (argv._.length === 0) {
	console.log("Usage: drop <github-user>/<github-repo>");
	process.exit(64);
}

const repo = argv._[0];

Git.Clone(`https://github.com/${repo}`, ".drop")
.then(function () {
	// Read config from repo
	return new Promise(function (resolve, reject) {
			fs.readFile(".drop/drop.json", "utf-8", function (err, file) {
				if (err) {
					reject("Could not read the config file 'drop.json' from repo:", err);
					return;
				}

				try {
					 config = JSON.parse(file);
				}
				catch(ex) {
					reject("Invalid JSON in drop.json file");
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

			console.log("Finished all question:", context);
			resolve(context);
		});
	});
})
.then(function (context) {
	return new Promise(function (resolve, reject) {

		recursive('.drop', [".drop/.git/**"], function (err, files) {
			if (err) {
				reject("Failed to read local clone:", err);
			}

			// for (let f = 0; f < files.length; f++) {
				var filename = ".drop/package.json"; //files[f];
				var fileContent = fs.readFileSync(filename, "utf-8");
				var solvedFile = parseFile(fileContent, context);
				console.log("Solved:", solvedFile);
			// }

			resolve();
		});
	});
})
.then(function () {
	rimraf(".drop", function () {
		console.log("Done");
	});
})
.catch(function (err) {
	console.error("Encountered errors:");
	console.error(err);
});
