#!/usr/bin/env node

//desc// manually merge one company into another, deleting the merged company after we are done

'use strict';

const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const Commander = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/node_modules/commander');
const TeamMerger = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/team_merger');

Commander
	.option('-f, --fromCompanyIds <fromCompanyIds>', 'Comma-separated IDs of the companies to merge and delete')
	.option('-t, --toCompanyId <toCompanyId>', 'ID of the company to merge to')
	.option('--dryrun', 'Do a dry run with informational messages, but don\'t actually DO anything')
	.option('--merge-teams', 'Also merge the team for the from company, before merging to the to company')
	.parse(process.argv);

if (!Commander.fromCompanyIds || !Commander.toCompanyId) {
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
		for (let fromCompanyId of this.fromCompanyIds) {
			await new TeamMerger({
				logger: this.logger,
				data: this.data,
				dryRun: this.dryRun
			}).mergeCompanies(fromCompanyId, this.toCompanyId);
		}
	}
}

(async function() {
	try {
		await ApiConfig.loadPreferredConfig();
		const fromCompanyIds = Commander.fromCompanyIds.split(',');
		await new CompanyMerger().go({
			fromCompanyIds: fromCompanyIds.map(id => id.toLowerCase()),
			toCompanyId: Commander.toCompanyId.toLowerCase(),
			dryRun: Commander.dryrun,
			mergeTeams: Commander.mergeTeams
		});
	}
	catch (error) {
		this.logger.error(error);
		process.exit();
	}
})();


