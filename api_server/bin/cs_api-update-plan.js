#!/usr/bin/env node

//desc// update payment plan and trial info in mongo and on Intercom

/* eslint no-console: 0 */

'use strict';

const MongoClient = require(process.env.CS_API_TOP + '/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CS_API_TOP + '/config/config');
const Intercom = require('intercom-client');
const Indexes = require(process.env.CS_API_TOP + '/modules/companies/indexes');
const Strftime = require('strftime');
const UserIndexes = require(process.env.CS_API_TOP + '/modules/users/indexes');

// need these collections from mongo
const COLLECTIONS = ['companies', 'teams', 'users', 'updatePlanLastRunAt'];

// throttle the updates so we don't stress mongo or intercom
const NO_UPDATE_THROTTLE_TIME = 10;
const UPDATE_THROTTLE_TIME = 1000;
const RUN_INTERVAL = 23 * 60 * 60 * 1000;

class PlanUpdater {

	// main entry point
	async go (options = {}) {
		try {
			Object.assign(this, options);
			this.logger = this.logger || console;
			await this.openMongoClient();
			if (await this.abortIfDoneAlready()) {
				return;
			}
			await this.openIntercomClient();
			await this.updateLastRunAt();
			await this.process();
		}
		catch (error) {
			this.logger.error(error);
			throw error;
		}
	}

	// open a mongo client to read from
	async openMongoClient () {
		this.mongoClient = new MongoClient({ collections: COLLECTIONS });
		try {
			await this.mongoClient.openMongoClient(ApiConfig.getPreferredConfig().mongo);
			this.data = this.mongoClient.mongoCollections;
		}
		catch (error) {
			throw `unable to open mongo client: ${JSON.stringify(error)}`;
		}
	}

	// if another instance of this script already ran, just abort
	async abortIfDoneAlready () {
		const lastRunAt = await this.data.updatePlanLastRunAt.getByQuery({}, { overrideHintRequired: true });
		if (lastRunAt && lastRunAt[0] && lastRunAt[0].lastRunAt > Date.now() - RUN_INTERVAL) {
			return true;
		}
	}

	// open an Intercom client to write to
	async openIntercomClient () {
		this.intercomClient = new Intercom.Client({ token: ApiConfig.getPreferredConfig().intercom.accessToken });
	}

	// look for all companies that are in trial, and for each one, change its plan as needed
	async process () {
		const result = await this.data.companies.getByQuery(
			{
				plan: '30DAYTRIAL',
				deactivated: false
			},
			{
				stream: true,
				hint: Indexes.byPlan
			}
		);

		let company;
		do {
			company = await result.cursor.next();
			if (company) {
				await this.processCompany(company);
			}
		} while (company);
		result.done();
	}

	// for this company, see if its trial is expired, if so, put it on either:
	// TRIALEXPIRED, if it has more than 5 members, of FREEPLAN if 5 or fewer members
	async processCompany (company) {
		const now = Date.now();
		const date = Strftime('%Y-%m-%d %H:%M:%S.%L');
		if (company.trialEndDate > now) {
			this.logger.log(`${date}: Company ${company._id} ("${company.name}") is still in trial`);
			return await this.wait(NO_UPDATE_THROTTLE_TIME);
		}

		const users = await this.getRegisteredUsers(company);
		let newPlan = users.length > 5 ? 'TRIALEXPIRED' : 'FREEPLAN';
		this.logger.log(`${date}: Updating company ${company._id} ("${company.name}") to ${newPlan}`);
		await this.updateIntercom(company, newPlan);
		await this.updateMongo(company, newPlan);
		await this.wait(UPDATE_THROTTLE_TIME);
	}

	// get the registered users in a company
	async getRegisteredUsers (company) {
		const teams = await this.data.teams.getByIds(company.teamIds);
		const teamIds = teams.map(team => team._id.toString());
		return await this.data.users.getByQuery(
			{ 
				teamIds: {$in: teamIds},
				isRegistered: true,
				deactivated: false
			},
			{
				hint: UserIndexes.byTeamIds,
				fields: ['_id']
			}
		);
	}

	// update the plan in mongo
	async updateMongo (company, newPlan) {
		try {
			await this.data.companies.updateDirect(
				{ _id: this.data.companies.objectIdSafe(company._id) },
				{ $set: { plan: newPlan } }
			);
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.logger.warn(`Update to company ${company._id} failed: ${message}`);
		}
	}
	
	// update the plan in intercom, we'll make sure the trial dates are updated as well
	async updateIntercom (company, plan) {
		const update = {
			company_id: company._id,
			plan,
			custom_attributes: {
				trialStart_at: Math.floor(company.trialStartDate/1000),
				trialEnd_at: Math.floor(company.trialEndDate/1000)
			}
		};
		try {
			await this.intercomClient.companies.update(update);
		}
		catch (error) {
			const message = error instanceof Error ? error.message: JSON.stringify(error);
			this.logger.error(`Unable to update company ${company._id} on Intercom: ${message}`);
		}
	}

	// wait this number of milliseconds
	wait (time) {
		return new Promise(resolve => {
			setTimeout(resolve, time);
		});
	}
	
	// update when this script was last run so other running instances don't try
	async updateLastRunAt () {
		await this.data.updatePlanLastRunAt.updateDirect(
			{ }, 
			{ $set: { lastRunAt: Date.now() } },
			{ upsert: true}
		);
	}
}

(async function() {
	try {
		await ApiConfig.loadPreferredConfig();
		await new PlanUpdater().go();
	}
	catch (error) {
		this.logger.error(error);
		process.exit(1);
	}
	process.exit(0);
})();


