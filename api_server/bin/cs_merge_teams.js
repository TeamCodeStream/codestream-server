#!/usr/bin/env node

/* eslint no-console: 0 */

'use strict';

const Commander = require('commander');
const TeamMerger = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/team_merger');

Commander
	.option('-f, --from <teamId>', 'Teams to merge')
	.option('-t, --to <teamId>', 'Team to merge to')
	.parse(process.argv);

if (!Commander.from) {
	console.warn('At least one "from" team is required');
	process.exit();
}

let fromTeamIds = Commander.from.split(',').map(id => id.toLowerCase());
let toTeamId;
if (Commander.to) {
	toTeamId = Commander.to.toLowerCase();
}
else {
	toTeamId = fromTeamIds[0];
	fromTeamIds.splice(0, 1);
}

if (fromTeamIds.length === 0) {
	console.warn('Provide at least two teams');
	process.exit();
}

const options = { fromTeamIds, toTeamId };

(async function() {
	try {
		await new TeamMerger().go(options);
		process.exit();
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();
