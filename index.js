#!/usr/bin/env node
const Git = require("nodegit");
const readline = require('readline');

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

Git.Clone("https://github.com/surdu/drop-express", ".drop");
