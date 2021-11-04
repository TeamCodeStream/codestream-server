#!/usr/bin/env node

//desc// migrate all companies that have not yet been migrated to company-centric paradigm

/* eslint no-console: 0 */

'use strict';

const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const Commander = require('commander');
const MigrationHandler = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/company_centric_migration/migration_handler');

Commander
	.option('--dryrun', 'Do a dry run, meaning don\'t actually write anything to our database, but report on numbers')
	.parse(process.argv);

const THROTTLE_TIME = 1000;

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
		this.mongoClient = new MongoClient({ collections: ['__all'] });
		try {
			await this.mongoClient.openMongoClient(ApiConfig.getPreferredConfig().storage.mongo);
			this.data = this.mongoClient.mongoCollections;
		}
		catch (error) {
			throw `unable to open mongo client: ${JSON.stringify(error)}`;
		}
	}

	// step through the companies that have not yet been migrated, and migrate them
	async doMigrations () {
		const result = await this.data.companies.getByQuery(
			{
				hasBeenMigratedToCompanyCentric: { $ne: true },
				deactivated: false
			},
			{
				stream: true,
				overrideHintRequired: true,
				sort: { _id: -1 }
			}
		);

		let company;
		let n = 0;
		do {
			company = await result.next();
			if (company) {
				await this.migrateCompany(company);
				n++;
			}
		} while (company);
		result.done();
		console.log(`${n} companies were migrated`);
	}

	// migrate a single company
	async migrateCompany (company) {
		console.log(`Migrating company ${company.id}:${company.name}...`);
		const migrationHandler = new MigrationHandler({
			data: this.data,
			logger: console,
			company,
			dryRun: this.dryrun
		});
		await migrationHandler.handleMigration();
		if (migrationHandler.didMigrateMultiTeamCompany) {
			await Wait(1000);
		} else {
			await Wait(100);
		}
	}
}

(async function() {
	try {
		await ApiConfig.loadPreferredConfig();
		await new Migrator().go({ dryrun: Commander.dryrun });
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();


