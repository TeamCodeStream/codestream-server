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
		var text = fs.readFileSync(process.env.CSSVC_BACKEND_ROOT + '/api_server/etc/msteamsbot/template/manifest.json', 'utf8');
		text = text.replace(/{{botId}}/g, Commander.botId);
		if (Commander.env === 'prod') {
			// don't put any env for prod
			text = text.replace(/{{env}}/g, '');
		}
		else {
			text = text.replace(/{{env}}/g, `-${Commander.env}`);
		}
		let json = JSON.parse(text);
		let outputDir = `${process.env.CSSVC_BACKEND_ROOT}/api_server/etc/msteamsbot/dist`;
		if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
		outputDir += '/' + Commander.env;
		if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
		fs.writeFileSync(`${outputDir}/manifest.json`, JSON.stringify(json, null, 4));
		process.exit();
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();
