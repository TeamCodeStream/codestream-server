#!/usr/bin/env node

//desc// manually set a payment plan for a team in mongo and on Intercom

/* eslint no-console: 0 */

'use strict';

const MongoClient = require(process.env.CS_API_TOP + '/server_utils/mongo/mongo_client');
const MongoConfig = require(process.env.CS_API_TOP + '/config/mongo');
const Intercom = require('intercom-client');
const Commander = require('commander');
const ACCESS_TOKEN = require(process.env.CS_API_TOP + '/config/intercom').accessToken;

// need these collections from mongo
const COLLECTIONS = ['teams'];

const parseDate = function(date) {
	const timestamp = Date.parse(date);
	if (isNaN(timestamp)) {
		console.error('Invalid date: ' + date);
		process.exit(1);
	}
	return timestamp;
};

Commander
	.option('-t, --teamId <teamId>', 'CodeStream ID of the team whose plan to change')
	.option('-p, --plan <plan>', 'Name of plan to change to')
	.option('-s, --start <date>', 'Set planStartDate to this date (best to put the date in quotes)', parseDate)
	.parse(process.argv);

if (!Commander.teamId || !Commander.plan) {
	Commander.help();
}

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
		await this.updateMongo();
		await this.updateIntercom();
	}

	// update the plan in mongo
	async updateMongo () {
		const set = {
			plan: this.plan,
		};
		if (Commander.start) {
			set.planStartDate = Commander.start;
		}
		try {
			await this.data.teams.updateDirect(
				{ _id: this.data.teams.objectIdSafe(this.teamId) },
				{ $set: set }
			);
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			console.warn(`Update to team ${this.teamId} failed: ${message}`);
		}
	}
	
	// update the plan in intercom, we'll make sure the trial dates are updated as well
	async updateIntercom () {
		const update = {
			company_id: this.teamId,
			plan: this.plan
		};
		try {
			await this.intercomClient.companies.update(update);
		}
		catch (error) {
			const message = error instanceof Error ? error.message: JSON.stringify(error);
			console.error(`Unable to update team ${this.teamId} on Intercom: ${message}`);
		}
	}
}

(async function() {
	try {
		await new PlanUpdater().go({
			teamId: Commander.teamId,
			plan: Commander.plan
		});
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();


