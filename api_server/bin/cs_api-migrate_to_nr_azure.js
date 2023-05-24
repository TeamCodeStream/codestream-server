#!/usr/bin/env node

//desc// migrate all companies that have not yet been migrated to New Relic / Azure as identity provider

/* eslint no-console: 0 */

'use strict';

const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const Commander = require('commander');
const NewRelicIDPMigrationHandler = require('../lib/util/newrelic_idp_migration_handler');
const NewRelicIDP = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/newrelic_idp/newrelic_idp');

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
		this.idp = new NewRelicIDP();
		await this.idp.initialize();
		this.migrationHandler = new NewRelicIDPMigrationHandler({
			data: this.data,
			logger: console,
			dryRun: this.dryrun,
			verbose: this.verbose,
			throttle: this.throttle,
			idp: this.idp
		});

		const result = await this.data.companies.getByQuery(
			{
				linkedNROrgId: { $exists: false },
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
		let totalUsersExisting = 0;
		let totalCompaniesMigrated = 0;
		let totalCompaniesPartiallyMigrated = 0;
		let totalErrors = 0;
		do {
			company = await result.next();
			if (company) {
				const info = await this.migrateCompany(company);
				if (info.error) {
					console.error(`****** COMPANY ${company.id} COULD NOT BE MIGRATED: ${info.error}`);
					totalErrors++;
				} else if (info.numUserErrors) {
					console.error(`****** COMPANY ${company.id} HAD ${info.numUserErrors} THAT COULD NOT BE MIGRATED`);
					totalCompaniesPartiallyMigrated++;
				} else {
					totalUsersMigrated += info.numUsersMigrated;
					totalUsersExisting += info.numUsersExisting;
					totalCompaniesMigrated++;
				}
			}
		} while (company);
		result.done();
		const which = Commander.dryrun ? 'would have been' : 'were'
		console.log(`${totalCompaniesMigrated} companies and ${totalUsersMigrated} users ${which} migrated, ${totalUsersExisting} users already existed`);
		if (totalCompaniesPartiallyMigrated) {
			console.log(`${totalCompaniesPartiallyMigrated} ${which} only partially migrated`);
		}
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
			verbose: !!Commander.verbose
		});
	}
	catch (error) {
		const message = error instanceof Error ? error.message : JSON.stringify(error);
		console.error(message);
		process.exit();
	}
})();


