#!/usr/bin/env node

//desc// migrate registered user to New Relic's azure bucket

/* eslint no-console: 0 */

'use strict';

const MongoClient = require(process.env.CSSVC_BACKEND_ROOT +
	'/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const Commander = require('commander');
const NewRelicAzureAdmin = require(process.env.CSSVC_BACKEND_ROOT +
	'/api_server/modules/newrelic_azure_auth/newrelic_azure_admin');

Commander.option(
	'--dryrun',
	"Do a dry run, meaning don't actually write anything to our database, but report on numbers"
)
	.option('--overwrite', 'Overwrite any existing user on Azure')
	.option('--since <since>', 'Only migrate users registered since the indicated timestamp')
	.option('--throttle <throttle>', 'Throttle migration of each user by this interval, in ms')
	.option('--abortonfail', 'Abort if there is a failure migrating any user')
	.parse(process.argv);

// wait this number of milliseconds
const Wait = function (time) {
	return new Promise((resolve) => {
		setTimeout(resolve, time);
	});
};

class Migrator {
	// main entry point
	async go(options = {}) {
		try {
			Object.assign(this, options);
			await this.openMongoClient();
			await this.createNewRelicAzureAdmin();
			await this.doMigrations();
		} catch (error) {
			console.error(error);
			process.exit();
		}
		process.exit();
	}

	// open a mongo client to do the dirty work
	async openMongoClient() {
		this.mongoClient = new MongoClient({ collections: ['users'] });
		try {
			await this.mongoClient.openMongoClient(ApiConfig.getPreferredConfig().storage.mongo);
			this.data = this.mongoClient.mongoCollections;
		} catch (error) {
			throw `unable to open mongo client: ${JSON.stringify(error)}`;
		}
	}

	// create the New Relic / Azure admin service to do the nitty-gritty to communicate with Graph
	async createNewRelicAzureAdmin() {
		this.userAdmin = new NewRelicAzureAdmin({
			config: ApiConfig.getPreferredConfig(),
			logger: console,
		});
	}

	// step through the registered users (optionally filtered by registration time) and migrate them
	async doMigrations() {
		const query = {
			deactivated: false,
			isRegistered: true,
		};
		if (this.since) {
			query.registeredAt = { $gt: this.since };
		}
		const result = await this.data.users.getByQuery(query, {
			stream: true,
			overrideHintRequired: true,
			sort: { _id: -1 },
		});

		let user;
		let n = 0;
		do {
			user = await result.next();
			if (user) {
				if (await this.migrateUser(user)) {
					n++;
				}
			}
		} while (user);
		result.done();
		console.log(`${n} users were migrated`);
	}

	// migrate a single user
	async migrateUser(user) {
		console.log(`Migrating user ${user.id}:${user.email}...`);

		const props = {
			fullName: user.fullName,
			email: user.email,
		};
		if (!props.fullName) {
			props.fullName = user.email.split('@')[0];
		}

		try {
			const result = await this.userAdmin.createUser(props, {
				dryrun: this.dryrun,
				overwrite: this.overwrite,
			});
			if (result === false) {
				console.log(`User ${user.email} exists, ignoring`);
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			console.warn(error.stack);
			console.warn(`Failed to migrate user ${user.id}: ${message}`);
			if (this.abortOnFail) {
				await Wait(500);
				process.exit(1);
			} else {
				return false;
			}
		}

		const throttle = this.throttle || 0;
		await Wait(throttle);
		return true;
	}
}

(async function () {
	try {
		await ApiConfig.loadPreferredConfig();
		await new Migrator().go({
			dryrun: Commander.dryrun,
			overwrite: Commander.overwrite,
			since: Commander.since ? parseInt(Commander.since, 10) : undefined,
			throttle: Commander.throttle ? parseInt(Commander.throttle, 10) : undefined,
			abortOnFail: Commander.abortonfail,
		});
	} catch (error) {
		console.error(error);
		process.exit();
	}
})();
