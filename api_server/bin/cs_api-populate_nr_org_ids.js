#!/usr/bin/env node

//desc// clear out the values for nrOrgIds and nrAccountIds on all companies

/* eslint no-console: 0 */

'use strict';

const Commander = require('commander');
const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const { request, gql } = require('graphql-request');

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

class PopulateNewRelicOrgIds {

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

	async processCompanies () {
		const result = await this.data.companies.getByQuery(
			{
				deactivated: false,
				isNRConnected: true,
				nrOrgIds: { $exists: false }
			},
			{
				stream: true,
				overrideHintRequired: true
			}
		);
		let company, user, orgId;
		this.numCompaniesPopulated = 0;
		do {
			company = await result.next();
			if (company) {
				user = await this.getMostRecentUser(company);
				if (user) {
					orgId = await this.getOrganizationId(user.providerInfo[company.everyoneTeamId].newrelic.accessToken);
					if (orgId) {
						await this.setOrgId(company, orgId);
					}
				}
			}
		} while (company);
		result.done();
		
		if (this.dryrun) {
			console.log(`Would have populated nrOrgIds on ${this.numCompaniesPopulated} companies`);
		} else {
			console.log(`Populated nrOrgIds on ${this.numCompaniesPopulated} companies`);
		}
	}

	async getMostRecentUser (company) {
		let result = await this.data.users.getByQuery(
			{
				deactivated: false,
				companyIds: {
					$elemMatch: { $eq: company.id }
				},

			},
			{
				overrideHintRequired: true
			}
		);
		result = result.filter(_ =>
			_.providerInfo &&
			_.providerInfo[company.everyoneTeamId] &&
			_.providerInfo[company.everyoneTeamId].newrelic
		);
		result.sort((a, b) => a.lastLogin - b.lastLogin);
		if (result.length) {
			return result[result.length - 1];
		}
		return undefined;
	}

	// fetch the user's organization ID from NR
	async getOrganizationId (apiKey) {
		const baseUrl = ApiConfig.getPreferredConfig().sharedGeneral.newRelicApiUrl || 'https://api.newrelic.com';
		const url = baseUrl + '/graphql';
		const query = gql`{
			actor {
				organization {
					id
				}
			}
		}`;
		const headers = {
			'Api-Key': apiKey,
			'Content-Type': 'application/json',
			'NewRelic-Requesting-Services': 'CodeStream'
		};
		const response = await request(url, query, {}, headers);
		if (response && response.actor && response.actor.organization && response.actor.organization.id) {
			return response.actor.organization.id;
		}
		return undefined;
	}

	async setOrgId (company, orgId) {
		if (this.dryrun) {
			console.log(`Would have set nrOrgIds for company ${company.id}...`);
		} else {
			console.log(`Setting nrOrgIds to ${orgId} for company ${company.id}...`);
			await this.mongoClient.mongoCollections.companies.updateDirect(
				{ id: this.mongoClient.mongoCollections.companies.objectIdSafe(company.id) },
				{ $set: { nrOrgIds: [orgId] } }
			);
		}
		this.numCompaniesPopulated++;
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
		await new PopulateNewRelicOrgIds(options).go();
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();
