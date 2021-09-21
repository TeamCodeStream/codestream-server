#!/usr/bin/env node

//desc// manually merge one company into another, deleting the merged company after we are done

'use strict';

const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const Commander = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/node_modules/commander');
const TeamMerger = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/team_merger');

Commander
	.option('-f, --fromCompanyId <fromCompanyId>', 'ID of the company to merge and delete')
	.option('-t, --toCompanyId <toCompanyId>', 'ID of the company to merge to')
	.option('--dryrun', 'Do a dry run with informational messages, but don\'t actually DO anything')
	.parse(process.argv);

if (!Commander.fromCompanyId || !Commander.toCompanyId) {
	Commander.help();
}

class CompanyMerger {

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
console.warn('MERGE ' + this.fromCompanyId + ' INTO ' + this.toCompanyId);
		return new TeamMerger({
			logger: this.logger,
			data: this.data,
			dryRun: this.dryRun
		}).mergeCompanies(this.fromCompanyId, this.toCompanyId);
	}
}

(async function() {
	try {
		await ApiConfig.loadPreferredConfig();
		await new CompanyMerger().go({
			fromCompanyId: Commander.fromCompanyId.toLowerCase(),
			toCompanyId: Commander.toCompanyId.toLowerCase(),
			dryRun: Commander.dryrun
		});
	}
	catch (error) {
		this.logger.error(error);
		process.exit();
	}
})();


