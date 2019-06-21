#!/usr/bin/env node

/* eslint no-console: 0 */

'use strict';

const MongoClient = require(process.env.CS_API_TOP + '/server_utils/mongo/mongo_client');
const MongoConfig = require(process.env.CS_API_TOP + '/config/mongo');
const Intercom = require('intercom-client');

// this is Colin's personal access token, created for the "CodeStream Internal" app
// for our Intercom CodeStream workspace
const ACCESS_TOKEN = 'dG9rOjJmYzY2YzMwX2Y0M2NfNDlmNV9iMDczXzZkMGJlNDRhYThjYToxOjA=';

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

	process () {
		return new Promise(async (resolve, reject) => {
			try {
				const result = await this.data.teams.getByQuery({deactivated: false}, { stream: true, overrideHintRequired: true, sort: { _id: -1 } });
				let team;
				do {
					team = await result.cursor.next();
					if (team && team.plan) {
						await this.processTeam(team);
					}
				} while (team);
				result.done();
				resolve();
			}
			catch (error) {
				reject(error);
			}
		});
	}

	processTeam (team) {
		return new Promise(async resolve => {
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
				setTimeout(resolve, 300);
			}
			catch (error) {
				console.warn('****** UNABLE TO UPDATE TEAM ' + team._id, error);
				setTimeout(resolve, 100);
			}
		});
	}
}

(async function() {
	try {
		await new IntercomUpdater().go();
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();


