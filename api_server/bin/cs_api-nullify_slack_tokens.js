#!/usr/bin/env node

/* eslint no-console: 0 */

'use strict';

const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const Commander = require('commander');
const PubNub = require('pubnub');
const PubNubClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/pubnub/pubnub_client_async');
const UUID = require('uuid/v4');
const OS = require('os');

Commander
	.option('-u, --userId <userId>', 'Team ID to fetch Slack replies for, specify "all" for all Slack teams (be careful!)')
	.option('--throttle <throttle>', 'Pause this number of milliseconds between users')
	.option('--dryrun', 'Do a dry run, meaning don\'t actually write the replies to our database, but report on numbers')
	.parse(process.argv);

const COLLECTIONS = ['users'];
const DEFAULT_THROTTLE_TIME = 1000;

const Logger = console;
const ThrottleTime = Commander.throttle ? parseInt(Commander.throttle) : DEFAULT_THROTTLE_TIME;

// wait this number of milliseconds
const Wait = function (time) {
	return new Promise(resolve => {
		setTimeout(resolve, time);
	});
};

class Nullifier {

	// main entry point
	async go(options = {}) {
		try {
			Object.assign(this, options);
			await this.openMongoClient();
			await this.openPubnubClient();
			if (this.userId) {
				await this.processSingleUser();
			}
			else {
				await this.processAllUsers();
			}
		}
		catch (error) {
			Logger.error(error);
			process.exit();
		}
		process.exit();
	}

	async processSingleUser() {
		const user = await this.data.users.getById(this.userId);
		if (!user) {
			throw 'user not found: ' + this.userId;
		}
		return this.processUser(user);
	}

	async processAllUsers () {
		const result = await this.data.users.getByQuery(
			{
				'providerInfo': { $exists: true },
				deactivated: false
			},
			{
				stream: true,
				overrideHintRequired: true,
				sort: { _id: -1 }
			}
		);

		let user;
		do {
			user = await result.next();
			if (user) {
				const processed = await this.processUser(user);
				await Wait(processed ? ThrottleTime : 0);
			}
		} while (user);
		result.done();
	}

	async processUser (user) {
		let op = { 
			$unset: { 
			},
			$set: {
				modifiedAt: Date.now(),
				version: user.version + 1
			}
		};

		Object.keys(user.providerInfo).forEach(teamId => {
			if (teamId === 'slack') {
				op.$unset['providerInfo.slack'] = true;
			}
			if (user.providerInfo[teamId].slack) {
				op.$unset[`providerInfo.${teamId}.slack`] = true;
			}
		});

		if (Object.keys(op.$unset).length === 0) {
			console.log(`User ${user.id} has provider info but no slack token`);
			return false;
		}

		if (Commander.dryrun) {
			console.log(`Would have updated user ${user.id}: ${JSON.stringify(op, undefined, 5)}`);
			return;
		}
		else {
			console.log(`Updating user ${user.id}...`);
		}

		await this.updateUser(user, op);
		await this.sendOpToUser(user, op);
	}

	async updateUser (user, op) {
		await this.data.users.updateDirect({ _id: this.data.users.objectIdSafe(user.id) }, op);
	}

	async sendOpToUser (user, op) {
		const requestId = UUID();
		const message = {
			user: Object.assign(op, { 
				id: user.id,
				$version: {
					before: user.version,
					after: user.version + 1
				}
			}),
			requestId
		};
		const channel = `user-${user.id}`;
		await this.pubnubClient.publish(
			message,
			channel
		);
	}

	async openMongoClient() {
		this.mongoClient = new MongoClient({ collections: COLLECTIONS });
		try {
			await this.mongoClient.openMongoClient(ApiConfig.getPreferredConfig().storage.mongo);
			this.data = this.mongoClient.mongoCollections;
		}
		catch (error) {
			throw `unable to open mongo client: ${JSON.stringify(error)}`;
		}
	}

	async openPubnubClient() {
		this.pubnub = new PubNub(Object.assign({}, ApiConfig.getPreferredConfig().broadcastEngine.pubnub, { uuid: 'API-' + OS.hostname() }));
		this.pubnubClient = new PubNubClient({ pubnub: this.pubnub });
		await this.pubnubClient.init();
	}
}

(async function () {
	try {
		await ApiConfig.loadPreferredConfig();
		await new Nullifier().go({ userId: Commander.userId });
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();


