// provide a module to handle database migrations

'use strict';

const MigrationHandles = require('./migration_handles');

class MigrationsHelper {

	constructor (options) {
		Object.assign(this, options);
		this.logger = this.logger || console;
	}

	// initialize the module
	async runMigrations () {
		this.log('Checking migrations...');

		// on initialization, we'll compare the migration version of the current database
		// against the expected version, and do whatever migrations are needed
		const migrationVersionObjects = await this.data.migrationVersion.getByQuery(
			{ _id: '0' },
			{ overrideHintRequired: true }
		);
		const migrationVersionObject = migrationVersionObjects[0];
		const migrationVersion = (migrationVersionObject && migrationVersionObject.migrationVersion) || 0;
		if (migrationVersion === MigrationHandles.length) {
			this.log('Database migrations are up to date');
			return;
		}

		// now execute the needed migrations
		const neededMigrations = MigrationHandles.slice(migrationVersion);
		await Promise.all(neededMigrations.map(async neededMigration => {
			await this.executeMigration(neededMigration);
		}));

		// set migration version in database so we know we are now up to date
		await this.data.migrationVersion.updateDirect(
			{ _id: '0' },
			{ $set: { migrationVersion: MigrationHandles.length } },
			{ upsert: true }
		);

		this.log(`${neededMigrations.length} migrations were run and database is now up to date`);
	}

	// execute a migration
	async executeMigration (migrationScript) {
		let executed = false;
		try {
			const migrationClass = require(`./migration_scripts/${migrationScript}`);
			const migration = new migrationClass({ data: this.data, logger: this.logger });
			this.log(`Migration ${migrationScript}: ${migration.description}`);
			await migration.execute();
			executed = true;
			await migration.verify();
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			const which = executed ? 'verifying' : 'executing';
			throw `Error ${which} migration ${migrationScript}: ${message}`;
		}
	}

	log (message) {
		this.logger.log(message);
	}
}

module.exports = MigrationsHelper;
