#!/usr/bin/env node

//desc// run needed database migrations against current mongo database

/* eslint no-console: 0 */

'use strict';

const MongoClient = require(process.env.CS_API_TOP + '/server_utils/mongo/mongo_client');
const MongoConfig = require(process.env.CS_API_TOP + '/config/mongo');
const MigrationsHelper = require(process.env.CS_API_TOP + '/modules/migrations/migrations_helper');

class MigrationRunner {

	// main entry point
	async go (options = {}) {
		try {
			Object.assign(this, options);
			this.logger = this.logger || console;
			await this.openMongoClient();
			await this.process();
		}
		catch (error) {
			this.logger.error(error);
			throw error;
		}
	}

	// open a mongo client to read from
	async openMongoClient () {
		this.mongoClient = new MongoClient();
		let mongoConfig = Object.assign({}, MongoConfig, { collections: 'all' });
		delete mongoConfig.queryLogging;
		try {
			await this.mongoClient.openMongoClient(mongoConfig);
			this.data = this.mongoClient.mongoCollections;
		}
		catch (error) {
			throw `unable to open mongo client: ${JSON.stringify(error)}`;
		}
	}

	// look for all teams that are in trial, and for each one, change its plan as needed
	async process () {
		await new MigrationsHelper({
			data: this.data,
			logger: this.logger
		}).runMigrations();
	}

}

(async function() {
	try {
		await new MigrationRunner().go();
	}
	catch (error) {
		console.error(error);
		process.exit(1);
	}
	process.exit(0);
})();


