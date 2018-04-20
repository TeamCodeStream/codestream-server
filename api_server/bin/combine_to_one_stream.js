#!/usr/bin/env node

// utility script to combine the content for a team or teams into the single team-stream
// for the given team, for moving to the "one-stream" paradigm

/* eslint no-console: 0 */

'use strict';

const Commander = require('commander');
const ContentCombiner = require(process.env.CS_API_TOP + '/modules/teams/content_combiner.js');

Commander
	.option('-t, --teams <teamIds>', 'Apply only to these teams')
	.parse(process.argv);

let options = {};
if (Commander.teams) {
	options.teamIds = Commander.teams.split(',');
}

(async function() {
	try {
		await new ContentCombiner().go(options);
		process.exit();
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();
