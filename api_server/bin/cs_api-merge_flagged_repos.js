#!/usr/bin/env node

//desc// after teams have been merged into a single company, merge repos that have been flagged for merge

'use strict';

const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const Commander = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/node_modules/commander');
const RepoMerger = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/repo_merger');

Commander
	.option('-t, --teamId <teamId>', 'ID of the team to scan for repos in need of merging')
	.option('--dryrun', 'Do a dry run with informational messages, but don\'t actually DO anything')
	.parse(process.argv);

if (!Commander.teamId) {
	Commander.help();
}

class RepoMergerForTeam {

	// main entry point
	async go (options = {}) {
		try {
			Object.assign(this, options);
			this.logger = this.logger || console;
			await this.openMongoClient();
			await this.process();
			this.logger.log('DONE');
		}
		catch (error) {
			this.logger.error(error);
			process.exit();
		}
		process.exit();
	}

	// open a mongo client to read from
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

	async process () {
		await new RepoMerger({
			logger: this.logger,
			data: this.data,
			dryRun: this.dryRun
		}).mergeFlaggedRepos(this.teamId);
	}
}

(async function() {
	try {
		await ApiConfig.loadPreferredConfig();
		await new RepoMergerForTeam().go({
			teamId: Commander.teamId.toLowerCase(),
			dryRun: Commander.dryrun,
			logger: console
		});
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();


