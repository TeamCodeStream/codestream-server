#!/usr/bin/env node

/* eslint no-console: 0 */

'use strict';

const Commander = require('commander');
const Deactivator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/deactivator');

Commander
	.option('-t, --team <teamIdOrName>', 'Deactivate team')
	.option('-r, --repo <repoId>', 'Deactivate repo')
	.option('-u, --user <userIdOrEmail>', 'Deactivate user')
	.option('--dtu, --deactivate-teamless-users', 'Deactivate teamless users when done')
	.parse(process.argv);

if (!Commander.team && !Commander.repo && !Commander.user) {
	console.warn('team, repo, or user required');
	process.exit();
}

let options = {
	teamIdOrName: Commander.team,
	repoId: Commander.repo,
	userIdOrEmail: Commander.user,
	deactivateTeamlessUsers: Commander.deactivateTeamlessUsers
};

(async function() {
	try {
		await new Deactivator().go(options);
		process.exit();
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();
