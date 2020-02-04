#!/usr/bin/env node

// utility script to create a manifest file for an MS Teams bot

/* eslint no-console: 0 */

'use strict';

const Commander = require('commander');
const fs = require('fs');


Commander
	.option('-b, --botId <id>', 'Bot id')
	.option('-e, --env <id>', 'environment (pd, prod, brian)')
	.parse(process.argv);

if (!Commander.botId && !Commander.env) {
	Commander.help();
}

(async function () {
	try {
		var text = fs.readFileSync(process.env.CS_API_TOP + '/etc/msteamsbot/template/manifest.json', 'utf8');
		text = text.replace(/{{botId}}/g, Commander.botId);
		let json = JSON.parse(text);
		fs.writeFileSync(`${process.env.CS_API_TOP}/etc/msteamsbot/${Commander.env}/manifest.json`, JSON.stringify(json, null, 4));
		process.exit();
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();
