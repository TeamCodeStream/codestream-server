#!/usr/bin/env node

// NOTE: THIS SCRIPT IS OBSOLETE

// one-time update of intercom with all the trial data in the mongo database

/* eslint no-console: 0 */

'use strict';

const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const Intercom = require('intercom-client');

const COLLECTIONS = ['teams'];

class IntercomUpdater {

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
		this.mongoClient = new MongoClient({ collections: COLLECTIONS });
		try {
			await this.mongoClient.openMongoClient(ApiConfig.getPreferredConfig().storage.mongo);
			this.data = this.mongoClient.mongoCollections;
		}
		catch (error) {
			throw `unable to open mongo client: ${JSON.stringify(error)}`;
		}
	}

	// open an Intercom client to write to
	async openIntercomClient () {
		// NOTE: THE LINE BELOW MAKES THIS SCRIPT OBSOLETE, WE NO LONGER HAVE AN INTERCOM KEY
		//this.intercomClient = new Intercom.Client({ token: ApiConfig.getPreferredConfig().telemetry.intercom.token });
	}

	async process () {
		const result = await this.data.teams.getByQuery({deactivated: false}, { stream: true, overrideHintRequired: true, sort: { _id: -1 } });
		let team;
		do {
			team = await result.cursor.next();
			if (team && team.plan) {
				await this.processTeam(team);
			}
		} while (team);
		result.done();
	}

	async processTeam (team) {
		const update = {
			company_id: team._id,
			plan: team.plan,
			custom_attributes: {
				trialStart_at: Math.floor(team.trialStartDate/1000),
				trialEnd_at: Math.floor(team.trialEndDate/1000)
			}
		};
		console.log(`Updating team ${team._id}:"${team.name}" with`, update);
		try {
			await this.intercomClient.companies.update(update);
			await new Promise(resolve => {
				setTimeout(resolve, 300);
			});
		}
		catch (error) {
			console.warn('****** UNABLE TO UPDATE TEAM ' + team._id, error);
			await new Promise(resolve => {
				setTimeout(resolve, 100);
			});
		}
	}
}

(async function() {
	try {
		await ApiConfig.loadPreferredConfig();
		await new IntercomUpdater().go();
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();


