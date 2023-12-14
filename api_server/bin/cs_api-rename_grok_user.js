#!/usr/bin/env node

//desc// rename the Grok user to AI

/* eslint no-console: 0 */

'use strict';

const Commander = require('commander');
const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const TeamIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/indexes');

Commander
	.option('--dryrun, --dryrun', 'Do a dry run, don\'t actually change any data')
	.option('--throttle, --throttle <throttle>', 'Throttle write operations by this time interval')
	.parse(process.argv);

// wait this number of milliseconds
const Wait = function(time) {
	return new Promise(resolve => {
		setTimeout(resolve, time);
	});
};

class RenameGrokUser {

	constructor (options) {
		Object.assign(this, options);
		this.throttle = this.throttle || 1000;
	}

	async go () {
		await this.openMongoClient();
		await this.processTeams();
		process.exit();
	}

	// open a mongo client to do the dirty work
	async openMongoClient () {
		this.mongoClient = new MongoClient({ collections: ['__all'] });
		try {
			await this.mongoClient.openMongoClient(ApiConfig.getPreferredConfig().storage.mongo);
			this.data = this.mongoClient.mongoCollections;
		}
		catch (error) {
			throw `unable to open mongo client: ${JSON.stringify(error)}`;
		}
	}

	async processTeams () {
		const result = await this.data.teams.getByQuery(
			{},
			{
				stream: true,
				hint: TeamIndexes.byProviderIdentities
			}
		);
		let team;
		let count = 0;
		do {
			team = await result.next();
			if (team && team.grokUserId) {
				try {
					if (this.dryrun) {
						console.log(`Would have renamed user ${team.grokUserId}...`);
						count++;
					} else {
						console.log(`Renaming user ${team.grokUserId}...`);
						await this.mongoClient.mongoCollections.users.updateDirect(
							{ id: this.mongoClient.mongoCollections.users.objectIdSafe(team.grokUserId) },
							{ $set: { username: 'AI' } }
						);
						await Wait(this.throttle);
						count++;
					}
				} catch (ex) {
					console.log(`Failed to rename user ${team.grokUserId}: ${ex}`);
				}
			}
		} while (team);
		if (this.dryrun) {
			console.log(`Would have renamed up to ${count} users`);
		} else {
			console.log(`Ensured ${count} users have the correct name`);
		}
	}
}

(async function() {
	try {
		const options = {
			dryrun: Commander.dryrun
		};
		if (Commander.throttle) {
			options.throttle = parseInt(Commander.throttle, 10);
			if (isNaN(options.throttle)) {
				throw 'invalid throttle value';
			}
		}
		await ApiConfig.loadPreferredConfig();
		await new RenameGrokUser(options).go();
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();
