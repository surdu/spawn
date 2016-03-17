#!/usr/bin/env node
const Git = require("nodegit");
const readline = require('readline');
const argv = require('minimist')(process.argv.slice(2));
const recursive = require('recursive-readdir');
const rimraf = require('rimraf');

var term;

function ask(question, def) {
	if (!term) {
		term = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
	}

	var def = def || "";

	return new Promise(function (resolve) {
		term.question(`${question}: (${def})`, function (answer) {
			resolve(answer);
		});
	});
}

if (argv._.length === 0) {
	console.log("Usage: drop <github-user>/<github-repo>");
	return;
}

const repo = argv._[0];

Git.Clone(`https://github.com/${repo}`, ".drop")
.then(function () {
	return new Promise(function (resolve) {
		rimraf(".drop/.git", function () {
			resolve()
		})
	})
})
.then(function () {
	return new Promise(function (resolve) {
		recursive('.drop', function (err, files) {
			console.log("Files:", files);
			resolve();
		});
	})
})
.then(function () {
	rimraf(".drop", function () {
		console.log("Done");
	})
})
.catch(function (err) {
	console.error("Ups:", err);
});
