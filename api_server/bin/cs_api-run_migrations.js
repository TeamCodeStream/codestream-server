#!/usr/bin/env node

//desc// run needed database migrations against current mongo database

/* eslint no-console: 0 */

'use strict';

const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const MigrationsHelper = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/migrations/migrations_helper');

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
		this.mongoClient = new MongoClient({ collections: ['__all', 'migrationVersion'] });
		try {
			await this.mongoClient.openMongoClient(ApiConfig.getPreferredConfig().storage.mongo);
			this.data = this.mongoClient.mongoCollections;
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			throw `unable to open mongo client: ${message}`;
		}
	}

	async process () {
		await new MigrationsHelper({
			data: this.data,
			logger: this.logger
		}).runMigrations();
	}

}

(async function() {
	try {
		await ApiConfig.loadPreferredConfig();
		await new MigrationRunner().go();
	}
	catch (error) {
		console.error(error);
		process.exit(1);
	}
	process.exit(0);
})();


