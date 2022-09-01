#!/usr/bin/env node

//desc// clear out the values for nrOrgIds and nrAccountIds on all companies

/* eslint no-console: 0 */

'use strict';

const Commander = require('commander');
const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const CompanyIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/companies/indexes');

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

class NewRelicOrgIdEraser {

	constructor (options) {
		Object.assign(this, options);
		this.throttle = this.throttle || 1000;
	}

	async go () {
		await this.openMongoClient();
		await this.doErase();
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

	// wipe the values for nrOrgIds and nrAccountIds from all companies
	async doErase () {
		const orgIdsResult = await this.data.companies.getByQuery(
			{
				deactivated: false,
				nrOrgIds: {
					$exists: true,
				}
			},
			{
				stream: true,
				hint: CompanyIndexes.byNROrgId
			}
		);
		const accountIdsResult = await this.data.companies.getByQuery(
			{
				deactivated: false,
				nrAccountIds: {
					$exists: true,
				}
			},
			{
				stream: true,
				hint: CompanyIndexes.byNRAccountId
			}
		);
		let company;
		this.numCompaniesClearedOrgs = 0;
		do {
			company = await orgIdsResult.next();
			if (company) {
				await this.eraseOrgIds(company);
			}
		} while (company);
		orgIdsResult.done();
		this.numCompaniesClearedAccounts = 0;
		do {
			company = await accountIdsResult.next();
			if (company) {
				await this.eraseAccountIds(company);
			}
		} while (company);
		accountIdsResult.done();

		if (this.dryrun) {
			console.log(`Would have removed nrOrgIds from ${this.numCompaniesClearedOrgs} companies`);
			console.log(`Would have removed nrAccountIds from ${this.numCompaniesClearedAccounts} companies`);
		} else {
			console.log(`Removed nrOrgIds from ${this.numCompaniesClearedOrgs} companies`);
			console.log(`Removed nrAccountIds from ${this.numCompaniesClearedAccounts} companies`);
		}
	}

	async eraseOrgIds (company) {
		if (this.dryrun) {
			console.log(`Would have removed nrOrgIds from company ${company.id}...`);
		} else {
			console.log(`Removing nrOrgIds from company ${company.id}...`);
			await this.mongoClient.mongoCollections.companies.updateDirect(
				{ id: this.mongoClient.mongoCollections.companies.objectIdSafe(company.id) },
				{ $unset: { nrOrgIds: true } }
			);
		}
		this.numCompaniesClearedOrgs++;
		await Wait(this.throttle);
	}

	async eraseAccountIds (company) {
		if (this.dryrun) {
			console.log(`Would have removed nrAccountIds from company ${company.id}...`);
		} else {
			console.log(`Removing nrAccountIds from company ${company.id}...`);
			await this.mongoClient.mongoCollections.companies.updateDirect(
				{ id: this.mongoClient.mongoCollections.companies.objectIdSafe(company.id) },
				{ $unset: { nrAccountIds: true } }
			);
		}
		this.numCompaniesClearedAccounts++;
		await Wait(this.throttle);
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
		await new NewRelicOrgIdEraser(options).go();
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();
