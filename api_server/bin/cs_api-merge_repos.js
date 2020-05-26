#!/usr/bin/env node

//desc// manually merge a repo's remotes to another, delete the merged repo, and adjust all codemarks, file streams, and markers accordingly

/* eslint no-console: 0 */

'use strict';

const MongoClient = require(process.env.CS_API_TOP + '/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CS_API_TOP + '/config/config');
const Commander = require(process.env.CS_API_TOP + '/node_modules/commander');

// need these collections from mongo
const COLLECTIONS = ['repos', 'markers', 'streams', 'users'];

Commander
	.option('-f, --fromRepo <repoId>', 'ID of the repo to merge and delete')
	.option('-t, --toRepo <repoId>', 'ID of the repo to merge to')
	.option('--invalidate-user-sessions', 'Invalidate the sessions of all users on the team, to wipe any cached data')
	.parse(process.argv);

if (!Commander.fromRepo || !Commander.toRepo) {
	Commander.help();
}

class RepoMerger {

	// main entry point
	async go (options = {}) {
		try {
			Object.assign(this, options);
			this.logger = this.logger || console;
			await this.openMongoClient();
			await this.process();
			console.log('DONE');
		}
		catch (error) {
			this.logger.error(error);
			process.exit();
		}
		process.exit();
	}

	// open a mongo client to read from
	async openMongoClient () {
		this.mongoClient = new MongoClient();
		let mongoConfig = Object.assign({}, ApiConfig.getPreferredConfig().mongo, { collections: COLLECTIONS });
		delete mongoConfig.queryLogging;
		try {
			await this.mongoClient.openMongoClient(mongoConfig);
			this.data = this.mongoClient.mongoCollections;
		}
		catch (error) {
			throw `unable to open mongo client: ${JSON.stringify(error)}`;
		}
	}

	async process () {
		await this.getRepos();
		await this.mergeRepos();
		await this.fixMarkers();
		await this.fixFileStreams();
		await this.invalidateSessions();
	}

	async getRepos () {
		this.fromRepo = await this.data.repos.getById(this.fromRepoId);
		if (!this.fromRepo) {
			this.logger.error(`Repo ${Commander.fromRepo} not found`);
			process.exit();
		}
		this.toRepo = await this.data.repos.getById(this.toRepoId);
		if (!this.toRepo) {
			this.logger.error(`Repo ${Commander.toRepo} not found`);
			process.exit();
		}

		if (this.fromRepo.teamId !== this.toRepo.teamId) {
			this.logger.error('Repos must be from the same team');
			process.exit();
		}
	}

	async mergeRepos () {
		let fromRemotes = this.fromRepo.remotes || [];
		if (this.fromRepo.url && this.fromRepo.normalizedUrl && this.fromRepo.companyIdentifier) {
			fromRemotes.push({
				url: this.fromRepo.url,
				normalizedUrl: this.fromRepo.normalizedUrl,
				companyIdentifier: this.fromRepo.companyIdentifier
			});
		}

		let toRemotes = this.toRepo.remotes || [];
		if (this.toRepo.url && this.toRepo.normalizedUrl && this.toRepo.companyIdentifier) {
			toRemotes.push({
				url: this.toRepo.url,
				normalizedUrl: this.toRepo.normalizedUrl,
				companyIdentifier: this.toRepo.companyIdentifier
			});
		}

		fromRemotes = fromRemotes.filter(fromRemote => {
			return !toRemotes.find(toRemote => toRemote.normalizedUrl === fromRemote.normalizedUrl);
		});
		toRemotes = [...toRemotes, ...fromRemotes];
		this.logger.log(`Updating repo ${this.toRepo.id}...`);
		await this.data.repos.updateById(this.toRepoId, { remotes: toRemotes });

		this.logger.log(`Disassociating repo ${this.fromRepo.id}...`);
		await this.data.repos.updateById(this.fromRepoId, { deactivated: true, teamId: `WAS ${this.fromRepo.teamId}` });
	}

	async fixMarkers () {
		this.logger.log('Adjusting markers...');
		await this.data.markers.updateDirect(
			{ teamId: this.fromRepo.teamId, repoId: this.fromRepo.id },
			{ $set: { repoId: this.toRepo.id } }
		);
	}

	async fixFileStreams () {
		this.logger.log('Adjusting file streams...');
		await this.data.streams.updateDirect(
			{ teamId: this.fromRepo.teamId, repoId: this.fromRepo.id },
			{ $set: { repoId: this.toRepo.id } }
		);
	}

	async invalidateSessions () {
		if (!this.invalidateUserSessions) { 
			return;
		}
		this.logger.log('Invalidating user access tokens...');
		await this.data.users.updateDirect(
			{ teamIds: this.fromRepo.teamId },
			{ $set: { 'accessTokens.web.invalidated': true } }
		);
	}
}

(async function() {
	try {
		await ApiConfig.loadPreferredConfig();
		await new RepoMerger().go({
			fromRepoId: Commander.fromRepo,
			toRepoId: Commander.toRepo,
			invalidateUserSessions: Commander.invalidateUserSessions
		});
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();


