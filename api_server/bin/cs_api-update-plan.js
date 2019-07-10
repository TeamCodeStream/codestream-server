#!/usr/bin/env node

//desc// update payment plan and trial info in mongo and on Intercom

/* eslint no-console: 0 */

'use strict';

const MongoClient = require(process.env.CS_API_TOP + '/server_utils/mongo/mongo_client');
const MongoConfig = require(process.env.CS_API_TOP + '/config/mongo');
const Intercom = require('intercom-client');
const Indexes = require(process.env.CS_API_TOP + '/modules/teams/indexes');
const Strftime = require('strftime');
const ACCESS_TOKEN = require(process.env.CS_API_TOP + '/config/intercom').accessToken;
const UserIndexes = require(process.env.CS_API_TOP + '/modules/users/indexes');

// need these collections from mongo
const COLLECTIONS = ['teams', 'users', 'updatePlanLastRunAt'];

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

	// if another instance of this script already ran, just abort
	async abortIfDoneAlready () {
		const lastRunAt = await this.data.updatePlanLastRunAt.getByQuery({}, { overrideHintRequired: true });
		if (lastRunAt && lastRunAt[0] && lastRunAt[0].lastRunAt > Date.now() - RUN_INTERVAL) {
			return true;
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
			this.logger.log(`${date}: team ${team._id} ("${team.name}") is still in trial`);
			return await this.wait(NO_UPDATE_THROTTLE_TIME);
		}

		const users = await this.getRegisteredUsers(team);
		let newPlan = users.length > 5 ? 'TRIALEXPIRED' : 'FREEPLAN';
		this.logger.log(`${date}: Updating team ${team._id} ("${team.name}") to ${newPlan}`);
		await this.updateIntercom(team, newPlan);
		await this.updateMongo(team, newPlan);
		await this.wait(UPDATE_THROTTLE_TIME);
	}

	// get the registered users on a team
	async getRegisteredUsers (team) {
		return await this.data.users.getByQuery(
			{ 
				teamIds: team._id.toString(),
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
	async updateMongo (team, newPlan) {
		try {
			await this.data.teams.updateDirect(
				{ _id: this.data.teams.objectIdSafe(team._id) },
				{ $set: { plan: newPlan } }
			);
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.logger.warn(`Update to team ${team._id} failed: ${message}`);
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
			this.logger.error(`Unable to update team ${team._id} on Intercom: ${message}`);
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
		await new PlanUpdater().go();
	}
	catch (error) {
		this.logger.error(error);
		process.exit(1);
	}
	process.exit(0);
})();


