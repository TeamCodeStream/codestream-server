#!/usr/bin/env node

/* eslint no-console: 0 */

'use strict';

const MongoClient = require(process.env.CS_API_TOP + '/server_utils/mongo/mongo_client');
const MongoConfig = require(process.env.CS_API_TOP + '/config/mongo');
const Intercom = require('intercom-client');
const Indexes = require(process.env.CS_API_TOP + '/modules/teams/indexes');
const Strftime = require('strftime');

// this is Colin's personal access token, created for the "CodeStream Internal" app
// for our Intercom CodeStream workspace
const ACCESS_TOKEN = 'dG9rOjJmYzY2YzMwX2Y0M2NfNDlmNV9iMDczXzZkMGJlNDRhYThjYToxOjA=';

// need these collections from mongo
const COLLECTIONS = ['teams'];

// throttle the updates so we don't stress mongo or intercom
const THROTTLE_TIME = 100;

class PlanUpdater {

	// main entry point
	async go (options = {}) {
		try {
			Object.assign(this, options);
			this.logger = this.logger || console;
			await this.openMongoClient();
			await this.openIntercomClient();
			await this.process();
			console.log('DONE');
		}
		catch (error) {
			this.logger.error(error);
			process.exit();
		}
		process.exit();
	}

	// open a mongo client to read from
	async openMongoClient () {
		this.mongoClient = new MongoClient();
		let mongoConfig = Object.assign({}, MongoConfig, { collections: COLLECTIONS });
		delete mongoConfig.queryLogging;
		try {
			await this.mongoClient.openMongoClient(mongoConfig);
			this.data = this.mongoClient.mongoCollections;
		}
		catch (error) {
			throw `unable to open mongo client: ${JSON.stringify(error)}`;
		}
	}

	// open an Intercom client to write to
	async openIntercomClient () {
		this.intercomClient = new Intercom.Client({ token: ACCESS_TOKEN });
	}

	// look for all teams that are in trial, and for each one, change its plan as needed
	async process () {
		const result = await this.data.teams.getByQuery(
			{
				plan: '30DAYTRIAL',
				deactivated: false
			},
			{
				stream: true,
				hint: Indexes.byPlan
			}
		);

		let team;
		do {
			team = await result.cursor.next();
			if (team) {
				await this.processTeam(team);
			}
		} while (team);
		result.done();
	}

	// for this team, see if its trial is expired, if so, put it on either:
	// TRIALEXPIRED, if it has more than 5 members, of FREEPLAN if 5 or fewer members
	async processTeam (team) {
		const now = Date.now();
		const date = Strftime('%Y-%m-%d %H:%M:%S.%L');
		if (team.trialEndDate > now) {
			console.log(`${date}: team ${team._id} ("${team.name}") is still in trial`);
			return await this.wait(THROTTLE_TIME);
		}

		let newPlan = team.memberIds.length > 2 ? 'TRIALEXPIRED' : 'FREEPLAN';
		console.log(`\x1b[33m${date}: Updating team ${team._id} ("${team.name}") to ${newPlan}\x1b[0m`);
		await this.updateMongo(team, newPlan);
		await this.updateIntercom(team, newPlan);
		await this.wait(THROTTLE_TIME);
	}

	// update the plan in mongo
	async updateMongo (team, newPlan) {
		try {
			await this.data.teams.updateDirect(
				{ _id: this.data.teams.objectIdSafe(team._id) },
				{ $set: { plan: newPlan } }
			);
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			console.warn(`Update to team ${team._id} failed: ${message}`);
		}
	}
	
	// update the plan in intercom, we'll make sure the trial dates are updated as well
	async updateIntercom (team, plan) {
		const update = {
			company_id: team._id,
			plan,
			custom_attributes: {
				trialStart_at: Math.floor(team.trialStartDate/1000),
				trialEnd_at: Math.floor(team.trialEndDate/1000)
			}
		};
		try {
			await this.intercomClient.companies.update(update);
		}
		catch (error) {
			const message = error instanceof Error ? error.message: JSON.stringify(error);
			console.error(`Unable to update team ${team._id} on Intercom: ${message}`);
		}
	}

	// wait this number of milliseconds
	wait (time) {
		return new Promise(resolve => {
			setTimeout(resolve, time);
		});
	}
}

(async function() {
	try {
		await new PlanUpdater().go();
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();


