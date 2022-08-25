#!/usr/bin/env node

//desc// deactivate all teams whose last activity preceded a certain time

/* eslint no-console: 0 */

'use strict';

const Commander = require('commander');
const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const Deactivator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/deactivator');
const FS = require('fs');

Commander
	.option('-t, --time <timestamp>', 'If last activity was before this timestamp, deactivate the team')
	.option('--dryrun, --dryrun', 'Do a dry run, don\'t actually deactivate any teams')
	.option('--numposts, --numposts <numposts>', 'Don\'t deactivate teams whose post count exceeds this value')
	.option('--emails, --emails <emails>', 'Output list of emails of deactivated users to this file')
	.option('--throttle, --throttle <throttle>', 'Throttle deactivations by this time interval')
	.parse(process.argv);

if (!Commander.time) {
	console.warn('timestamp required');
	process.exit();
}

// wait this number of milliseconds
const Wait = function(time) {
	return new Promise(resolve => {
		setTimeout(resolve, time);
	});
};

class InactiveTeamDeactivator {

	constructor (options) {
		Object.assign(this, options);
		this.throttle = this.throttle || 1000;
	}

	async go () {
		await this.openMongoClient();
		await this.openEmailFile();
		await this.doDeactivate();
		await this.finish();
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

	// open an output stream to write emails to, representing all users deactivated
	async openEmailFile () {
		if (!this.emailsOutputFile) { return; }
		this.emailsOutputStream = FS.createWriteStream(this.emailsOutputFile);
	}

	// step through all the teams, determine which have no active users, and deactivate them
	async doDeactivate () {
		const result = await this.data.teams.getByQuery(
			{
				deactivated: false,
				createdAt: { $lt: this.time }
			},
			{
				stream: true,
				overrideHintRequired: true,
				fields: ['id']
			}
		);

		let team;
		this.numTeamsDeactivated = 0;
		do {
			team = await result.next();
			if (team) {
				await this.checkAndDeactivateTeam(team);
			}
		} while (team);
		result.done();
		if (this.dryrun) {
			console.log(`${this.numTeamsDeactivated} teams would have been deactivated`);
		} else {
			console.log(`${this.numTeamsDeactivated} teams were deactivated`);
		}
	}

	// check for activity for a single team, and deactivate as needed 
	async checkAndDeactivateTeam (team) {
		console.log(`Checking team ${team.id}...`);
		const users = await this.data.users.getByQuery(
			{
				deactivated: false,
				teamIds: team.id,
				isRegistered: true
			},
			{
				overrideHintRequired: true,
				fields: ['lastLogin']
			}
		);

		let lastLogin = 0;
		users.forEach(u => {
			if (u.lastLogin > lastLogin) {
				lastLogin = u.lastLogin;
			}
		});

		if (lastLogin < this.time) {
			if (this.numPosts) {
				const numPosts = this.data.posts.countByQuery(
					{
						teamId: team.id
					},
					{
						overrideHintRequired: true
					}
				);
				if (numPosts >= this.numPosts) {
					console.log(`Team ${team.id} will not be deactivated because they have ${numPosts} posts`);
					Wait(this.throttle / 10);
					return;
				}
			}
			return this.deactivateTeam(team);
		} else {
			Wait(this.throttle / 10);
		}
	}

	// deactivate this team 
	async deactivateTeam (team) {
		if (this.dryrun) {
			console.log(`Would have deactivated team ${team.id}`);
		} else {
			await new Deactivator().go({
				mongoClient: this.mongoClient,
				teamIdOrName: team.id,
				deactivateTeamlessUsers: true,
				emailsOutputStream: this.emailsOutputStream
			});
			console.log(`Team ${team.id} deactivated`);
		}

		this.numTeamsDeactivated++;
		Wait(this.throttle);
	}

	async finish () {
		if (this.emailsOutputStream) {
			this.emailsOutputStream.close();
		}
	}
}

(async function() {
	try {
		const time = Commander.time ? parseInt(Commander.time, 10) : NaN;
		if (isNaN(time)) {
			throw 'invalid or missing timestamp';
		}

		const options = {
			time,
			emailsOutputFile: Commander.emails,
			dryrun: Commander.dryrun
		}

		if (Commander.throttle) {
			options.throttle = parseInt(Commander.throttle, 10);
			if (isNaN(options.throttle)) {
				throw 'invalid throttle value';
			}
		}
		if (Commander.numposts) {
			options.numPosts = parseInt(Commander.numposts, 10);
			if (isNaN(options.numPosts)) {
				throw 'invalid post count';
			}
		}

		await ApiConfig.loadPreferredConfig();
		await new InactiveTeamDeactivator(options).go();
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();


