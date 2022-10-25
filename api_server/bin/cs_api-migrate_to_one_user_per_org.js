#!/usr/bin/env node

//desc// migrate all companies that have not yet been migrated to one-user-per-org paradigm

/* eslint no-console: 0 */

'use strict';

const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const Commander = require('commander');
const OneUserPerOrgMigrationHandler = require('../lib/util/one_user_per_org_migration_handler');

Commander
	.option('--dryrun', 'Do a dry run, meaning don\'t actually write anything to our database, but report on numbers')
	.option('--throttle <throttle>', 'Throttle processing each user by this amount of time')
	.option('--verbose', 'Verbose logging output')
	.parse(process.argv);

// wait this number of milliseconds
const Wait = function(time) {
	return new Promise(resolve => {
		setTimeout(resolve, time);
	});
};

class Migrator {

	// main entry point
	async go (options = {}) {
		try {
			Object.assign(this, options);
			await this.openMongoClient();
			await this.doMigrations();
		}
		catch (error) {
			console.error(error);
			process.exit();
		}
		process.exit();
	}

	// open a mongo client to do the dirty work
	async openMongoClient () {
		const logQueries = !!Commander.verbose;
		this.mongoClient = new MongoClient({
			collections: ['__all'],
			dryRunMode: !!Commander.dryrun,
			queryLogging: logQueries,
			logger: logQueries ? console : undefined
		});
		try {
			await this.mongoClient.openMongoClient({ ...ApiConfig.getPreferredConfig().storage.mongo });
			this.data = this.mongoClient.mongoCollections;
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			throw `unable to open mongo client: ${message}`;
		}
	}

	// step through the companies that have not yet been migrated, and migrate them
	async doMigrations () {
		this.migrationHandler = new OneUserPerOrgMigrationHandler({
			data: this.data,
			logger: console,
			dryRun: this.dryrun,
			verbose: this.verbose,
			throttle: this.throttle,
			tokenSecret: this.tokenSecret
		});

		const result = await this.data.companies.getByQuery(
			{
				hasBeenMigratedToOneUserPerOrg: { $ne: true },
				deactivated: false
			},
			{
				stream: true,
				overrideHintRequired: true,
				sort: { _id: 1 }
			}
		);

		let company;
		let totalUsersMigrated = 0;
		let totalCompaniesMigrated = 0;
		let totalUserRecordsCreated = 0;
		do {
			company = await result.next();
			if (company) {
				const info = await this.migrateCompany(company);
				totalUsersMigrated += info.numUsersMigrated;
				totalUserRecordsCreated += info.numUserRecordsCreated;
				totalCompaniesMigrated++;
			}
		} while (company);
		result.done();
		const which = Commander.dryrun ? 'would have been' : 'were'
		console.log(`\n\n${totalCompaniesMigrated} companies and ${totalUsersMigrated} users ${which} migrated, ${totalUserRecordsCreated} new user records ${which} created`);
	}

	// migrate a single company
	async migrateCompany (company) {
		return this.migrationHandler.migrateCompany(company);
	}
}

(async function() {
	try {
		await ApiConfig.loadPreferredConfig();
		let throttle = 100;
		if (Commander.throttle) {
			throttle = parseInt(Commander.throttle);
			if (isNaN(throttle)) throw 'throttle not a number';
		}
		await new Migrator().go({ 
			dryrun: !!Commander.dryrun,
			throttle,
			verbose: !!Commander.verbose,
			tokenSecret: ApiConfig.getPreferredConfig().sharedSecrets.auth
		});
	}
	catch (error) {
		const message = error instanceof Error ? error.message : JSON.stringify(error);
		console.error(message);
		process.exit();
	}
})();


