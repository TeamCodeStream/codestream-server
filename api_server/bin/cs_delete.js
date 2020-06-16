#!/usr/bin/env node

/* eslint no-console: 0 */

'use strict';

const Commander = require('commander');
const Deleter = require(process.env.CS_API_TOP + '/lib/util/deleter');

Commander
	.option('-t, --team <teamIdOrName>', 'Delete team')
	.option('-r, --repo <repoId>', 'Delete repo')
	.option('-u, --user <userIdOrEmail>', 'Delete user')
	.option('--dtu, --delete-teamless-users', 'Delete teamless users when done')
	.parse(process.argv);

if (!Commander.team && !Commander.repo && !Commander.user) {
	console.warn('team, repo, or user required');
	process.exit();
}
if (Commander.repo) {
	console.warn('Deleting by repo is no longer supported');
	process.exit();
}

let options = {
	teamIdOrName: Commander.team,
	//repoId: Commander.repo,
	userIdOrEmail: Commander.user,
	deleteTeamlessUsers: Commander.deleteTeamlessUsers
};

(async function() {
	try {
		await new Deleter().go(options);
		process.exit();
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();
