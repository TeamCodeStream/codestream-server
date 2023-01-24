#!/usr/bin/env node

//desc// ensure that each NR org is associated with at most one CS org

/* eslint no-console: 0 */

'use strict';

const Commander = require('commander');
const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes');
const CompanyIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/companies/indexes');
const PostIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/indexes');

Commander
	.option('--dryrun, --dryrun', 'Do a dry run, don\'t actually change any data')
	.option('--verbose, --verbose', 'Print extra log messages')
	.option('--throttle, --throttle <throttle>', 'Throttle write operations by this time interval')
	.parse(process.argv);

// wait this number of milliseconds
const Wait = function(time) {
	return new Promise(resolve => {
		setTimeout(resolve, time);
	});
};

class UniquifyNRCSOrgAssociations {

	constructor (options) {
		Object.assign(this, options);
		this.throttle = this.throttle || 1000;
	}

	async go () {
		await this.openMongoClient();
		await this.uniquifyNROrgIds();
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

	async uniquifyNROrgIds () {
		const result = await this.data.companies.getByQuery(
			{
				deactivated: false,
				isNRConnected: true
			},
			{
				stream: true,
				overrideHintRequired: true
			}
		);

		let company;
		const orgIds = new Set();
		do {
			company = await result.next();
			if (company && company.nrOrgIds && company.nrOrgIds.length > 0) {
				const orgId = company.nrOrgIds[0];
				if (orgIds.has(orgId)) continue;
				orgIds.add(orgId);

				const result = await this.data.companies.getByQuery(
					{
						nrOrgIds: [orgId]
					},
					{
						hint: CompanyIndexes.byNROrgId
					}
				);
				const companies = result.filter(_ => !_.deactivated);
				if (companies.length > 1) {
					if (this.verbose) {
						console.log(`Found ${companies.length} companies with nrOrgId ${orgId}`);
					}
					await this.processCompanies(companies);
				}
			}
		} while (company);
	}

	async processCompanies (companies) {
		const companiesToClear = [];
		const [popularCompaniesByUser, companiesToClearByUser] = await this.getCompaniesByUser(companies);
		if (this.verbose) {
			console.log(`${popularCompaniesByUser.length} popular companies by user`);
			console.log(`${companiesToClearByUser.length} unpopular companies by user`);
		}
		for (const c of companiesToClearByUser) {
			console.log(`- ${c.name}`);
		}
		companiesToClear.push(...companiesToClearByUser);
		if (popularCompaniesByUser.length > 1) {
			const [popularCompaniesByPost, companiesToClearByPost] = await this.getCompaniesByPost(popularCompaniesByUser);
			if (this.verbose) {
				console.log(`${popularCompaniesByPost.length} popular companies by post`);
				console.log(`${companiesToClearByPost.length} unpopular companies by post`);
			}
			for (const c of companiesToClearByPost) {
				console.log(`- ${c.name}`);
			}
			companiesToClear.push(...companiesToClearByPost);
			if (popularCompaniesByPost.length > 1) {
				const [popularCompaniesByDate, companiesToClearByDate] = await this.getCompaniesByRecentLogin(popularCompaniesByPost);
				if (this.verbose) {
					console.log(`${popularCompaniesByDate.length} companies with recent logins`);
					console.log(`${companiesToClearByDate.length} companies with older logins`);
				}
				for (const c of companiesToClearByDate) {
					console.log(`- ${c.name}`);
				}
				companiesToClear.push(...companiesToClearByDate);
				if (popularCompaniesByDate.length > 1) {
					popularCompaniesByDate.sort((a, b) => a.createdAt - b.createdAt);
					if (this.verbose) {
						console.log(`${popularCompaniesByDate.slice(1).length} leftover companies`);
					}
					for (const c of popularCompaniesByDate.slice(1)) {
						console.log(`- ${c.name}`);
					}
					companiesToClear.push(...popularCompaniesByDate.slice(1));
				}
			}
		}
		await this.clearCompanies(companiesToClear);
	}

	async getCompaniesByUser (companies) {
		const companyUserCount = [];
		for (const c of companies) {
			companyUserCount.push({
				company: c,
				count: await this.getUserCount(c)
			});
		}
		return this.filterCompaniesByCount(companyUserCount);
	}

	async getCompaniesByPost (companies) {
		const companyPostCount = [];
		for (const c of companies) {
			companyPostCount.push({
				company: c,
				count: await this.getPostCount(c)
			});
		}
		return this.filterCompaniesByCount(companyPostCount);
	}

	async getCompaniesByRecentLogin (companies) {
		const companyLoginDates = [];
		for (const c of companies) {
			companyLoginDates.push({
				company: c,
				count: await this.getMostRecentLogin(c)
			});
		}
		return this.filterCompaniesByCount(companyLoginDates);
	}

	filterCompaniesByCount (companyData) {
		const sorted = companyData.sort((a, b) => b.count - a.count);

		const popularCompanies = [];
		const companiesToClear = [];
		if (sorted[0].count === sorted[1].count) {
			for (const c of sorted) {
				if (c.count === sorted[0].count) {
					popularCompanies.push(c.company);
				} else {
					companiesToClear.push(c.company);
				}
			}
		} else {
			popularCompanies.push(sorted[0].company);
			companiesToClear.push(...(sorted.slice(1).map(_ => _.company)));
		}

		return [
			popularCompanies,
			companiesToClear
		];
	}

	async getUserCount (company) {
		const result = await this.data.users.getByQuery(
			{
				teamIds: company.everyoneTeamId
			},
			{
				hint: UserIndexes.byTeamId
			}
		);
		return result.filter(_ => !_.deactivated && _.isRegistered).length;
	}

	async getPostCount (company) {
		const result = await this.data.posts.getByQuery(
			{
				teamId: company.everyoneTeamId
			},
			{
				hint: PostIndexes.byTeamId
			}
		);
		return result.length;
	}

	async getMostRecentLogin (company) {
		const result = await this.data.users.getByQuery(
			{
				teamIds: company.everyoneTeamId
			},
			{
				hint: UserIndexes.byTeamId
			}
		);
		const filtered = result.filter(_ => !_.deactivated && _.isRegistered && _.lastLogin);
		filtered.sort((a, b) => b.lastLogin - a.lastLogin);
		return filtered[0].lastLogin;
	}

	async clearCompanies (companies) {
		if (this.dryrun) {
			console.log(`Would have cleared data for ${companies.length} companies`);
			return;
		}
		const companyIds = companies.map(_ => this.mongoClient.mongoCollections.companies.objectIdSafe(_.id));
		await this.mongoClient.mongoCollections.companies.updateDirect(
			{ id: { $in: companyIds } },
			{ $unset: { nrOrgIds: 1, isNRConnected: 1 } }
		);
		for (const c of companies) {
			await this.mongoClient.mongoCollections.users.updateDirect(
				{ teamIds: c.everyoneTeamId },
				{
					$unset: {
						[`providerInfo.${c.everyoneTeamId}.newrelic`]: 1
					}
				},
				{ hint: UserIndexes.byTeamId }
			);
		}
		await Wait(this.throttle);
	}
}

(async function () {
	try {
		const options = {
			dryrun: Commander.dryrun,
			verbose: Commander.verbose
		};
		if (Commander.throttle) {
			options.throttle = parseInt(Commander.throttle, 10);
			if (isNaN(options.throttle)) {
				throw 'invalid throttle value';
			}
		}
		await ApiConfig.loadPreferredConfig();
		await new UniquifyNRCSOrgAssociations(options).go();
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();
