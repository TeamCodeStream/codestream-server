#!/usr/bin/env node

//desc// set isNRConnected for all companies with NR-connected users

/* eslint no-console: 0 */

'use strict';

const Commander = require('commander');
const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes');

Commander
	.option('--dryrun, --dryrun', 'Do a dry run, don\'t actually change any data')
	.option('--throttle, --throttle <throttle>', 'Throttle write operations by this time interval')
	.parse(process.argv);

// wait this number of milliseconds
const Wait = function(time) {
	return new Promise(resolve => {
		setTimeout(resolve, time);
	});
};

class SetIsNRConnected {

	constructor (options) {
		Object.assign(this, options);
		this.throttle = this.throttle || 1000;
	}

	async go () {
		await this.openMongoClient();
		await this.processCompanies();
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

	// iterate over companies without isNRConnected and check for connected users
	async processCompanies () {
		const result = await this.data.companies.getByQuery(
			{
				deactivated: false,
				isNRConnected: { $ne: true }
			},
			{
				stream: true,
				overrideHintRequired: true
			}
		);

		let company;
		let count = 0;
		do {
			company = await result.next();
			if (company) {
				if (await this.checkForNRConnectedUsers(company)) {
					try {

						if (this.dryrun) {
							console.log(`Would have set isNRConnected for company ${company.id}...`);
							count++;
						} else {
							console.log(`Setting isNRConnected for company ${company.id}...`);
							await this.mongoClient.mongoCollections.companies.updateDirect(
								{ id: this.mongoClient.mongoCollections.companies.objectIdSafe(company.id) },
								{ $set: { isNRConnected: true } }
							);
							await Wait(this.throttle);
							count++;
						}
					} catch (ex) {
						console.log(`Failed to set isNRConnected for company ${company.id}: ${ex}`);
					}
				}
			}
		} while (company);
		if (this.dryrun) {
			console.log(`Would have set isNRConnected on ${count} companies`);
		} else {
			console.log(`Set isNRConnected on ${count} companies`);
		}
	}

	// check if any users are NR-connected
	async checkForNRConnectedUsers (company) {
		let result = await this.data.users.getByQuery(
			{
				teamIds: company.everyoneTeamId
			},
			{
				hint: UserIndexes.byTeamId
			}
		);
		return result.some(_ =>
			!_.deactivated &&
			_.isRegistered &&
			_.providerInfo && ((
				_.providerInfo[company.everyoneTeamId] &&
				_.providerInfo[company.everyoneTeamId].newrelic
			) || (
				_.providerInfo.newrelic
			))
		);
	}
}

(async function() {
	try {
		const options = {
			dryrun: Commander.dryrun
		};
		if (Commander.throttle) {
			options.throttle = parseInt(Commander.throttle, 10);
			if (isNaN(options.throttle)) {
				throw 'invalid throttle value';
			}
		}
		await ApiConfig.loadPreferredConfig();
		await new SetIsNRConnected(options).go();
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();
