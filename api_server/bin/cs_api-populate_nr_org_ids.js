#!/usr/bin/env node

//desc// clear out the values for nrOrgIds and nrAccountIds on all companies

/* eslint no-console: 0 */

'use strict';

const Commander = require('commander');
const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes');
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
		this.newRelicApiUrl = ApiConfig.getPreferredConfig().sharedGeneral.newRelicApiUrl || 'https://api.newrelic.com';
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
			//	isNRConnected: true
			},
			{
				stream: true,
				overrideHintRequired: true
			}
		);
		let company, users;
		this.numCompaniesPopulated = 0;
		this.numCompaniesFailed = 0;
		do {
			company = await result.next();
			if (company) {
				users = await this.getUsersWithApiKeys(company);
				let orgId = null;
				for (let user of users) {
					try {
						const accessToken = (
							user.providerInfo[company.everyoneTeamId] &&
							user.providerInfo[company.everyoneTeamId].newrelic &&
							user.providerInfo[company.everyoneTeamId].newrelic.accessToken
						) || (
							user.providerInfo.newrelic &&
							user.providerInfo.newrelic.accessToken
						);

						orgId = await this.getOrganizationId(accessToken);
					} catch (error) {
						console.warn(error.message);
					}

					if (orgId) {
						console.log(`Setting orgId for company ${company.id} to ${orgId}`);
						await this.setOrgId(company, orgId);
						break;
					}
				}
				if (!orgId) {
					console.log(`Unable to find an authorized user for company ${company.id}`);
					this.numCompaniesFailed++;
				}
			}
		} while (company);
		result.done();
		
		if (this.dryrun) {
			console.log(`Would have populated nrOrgIds on ${this.numCompaniesPopulated} companies`);
			console.log(`Would have failed to populate nrOrgIds for ${this.numCompaniesFailed} companies`);
		} else {
			console.log(`Populated nrOrgIds on ${this.numCompaniesPopulated} companies`);
			console.log(`Failed to populate nrOrgIds for ${this.numCompaniesFailed} companies`);
		}
	}

	async getUsersWithApiKeys (company) {
		let result = await this.data.users.getByQuery(
			{
				teamIds: company.everyoneTeamId
			},
			{
				hint: UserIndexes.byTeamId
			}
		);
		result = result.filter(_ =>
			!_.deactivated &&
			_.isRegistered &&
			_.lastLogin &&
			_.providerInfo && ((
				_.providerInfo[company.everyoneTeamId] &&
				_.providerInfo[company.everyoneTeamId].newrelic
			) || (
				_.providerInfo.newrelic
			))
		);
		result.sort((a, b) => a.lastLogin - b.lastLogin);
		return result;
	}

	// fetch the user's organization ID from NR
	async getOrganizationId (apiKey) {
		const baseUrl = this.newRelicApiUrl;
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
			'NewRelic-Requesting-Services': 'CodeStream',
			"X-Query-Source-Capability-Id": "CODESTREAM",
			"X-Query-Source-Component-Id": "codestream.api"
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
			let set;
			if (company.nrOrgIds && !company.isNRConnected) {
				set = { isNRConnected: true };
			} else if (!company.nrOrgIds) {
				set = { nrOrgIds: [orgId], isNRConnected: true };
			}
			if (set) {
				console.log(`Setting nrOrgIds to ${orgId} for company ${company.id}...`);
				await this.mongoClient.mongoCollections.companies.updateDirect(
					{ id: this.mongoClient.mongoCollections.companies.objectIdSafe(company.id) },
					{ $set: set }
				);
			} else {
				console.log(`NR props already set for company ${company.id}`);
			}
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
