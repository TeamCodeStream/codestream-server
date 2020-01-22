#!/usr/bin/env node

//desc// set (or clear) a flag for a user or all members of a team

/* eslint no-console: 0 */

'use strict';

const MongoClient = require(process.env.CS_API_TOP + '/server_utils/mongo/mongo_client');
const MongoConfig = require(process.env.CS_API_TOP + '/config/mongo');
const PubNub = require('pubnub');
const PubNubClient = require(process.env.CS_API_TOP + '/server_utils/pubnub/pubnub_client_async');
const PubNubConfig = require(process.env.CS_API_TOP + '/config/pubnub');
const Commander = require('commander');
const OS = require('os');
const UUID = require('uuid/v4');

// need these collections from mongo
const COLLECTIONS = ['teams', 'users'];

Commander
	.option('-t, --teamId <teamId>', 'Set flag for all members of this team')
	.option('-u, --userId <userId>', 'Set flag for this user')
	.option('-f, --flag <flag>', 'The flag to set or clear')
	.option('-c, --clear', 'Instead of setting the flag, clear it')
	.parse(process.argv);

if ((!Commander.teamId && !Commander.userId) || !Commander.flag) {
	Commander.help();
}

class SetFlag {

	// main entry point
	async go (options = {}) {
		try {
			Object.assign(this, options);
			this.logger = this.logger || console;
			await this.openMongoClient();
			await this.openPubnubClient();
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

	// open a Pubnub client for broadcasting the changes
	async openPubnubClient () {
		let config = Object.assign({}, PubNubConfig);
		config.uuid = 'API-' + OS.hostname();
		this.pubnub = new PubNub(config);
		this.pubnubClient = new PubNubClient({
			pubnub: this.pubnub
		});
		this.pubnubClient.init();
	}

	// set flag for the given user or all the users in the given team
	async process () {
		let userIds = [];
		if (this.teamId) {
			const team = await this.data.teams.getById(this.teamId);
			if (!team) {
				throw 'team not found';
			}
			userIds = team.memberIds;
		}
		else {
			userIds = [this.userId];
		}

		await Promise.all(userIds.map(async userId => {
			await this.setFlagForUser(userId);
		}));
		this.logger.log(`Updated ${userIds.length} users and sent broadcaster messages`);
	}

	// set flag for the given user
	async setFlagForUser (userId) {
		let op;
		// set or clear flag
		if (this.clear) {
			op = { $unset: { [this.flag]: true } };
		}
		else {
			op = { $set: { [this.flag]: true } };
		}
		await this.data.users.updateDirect({ _id: this.data.users.objectIdSafe(userId) }, op);

		// send pubnub update on user's me-channel
		const requestId = UUID();
		const message = {
			user: Object.assign(op, { id: userId }),
			requestId
		};
		const channel = `user-${userId}`;
		try {
			await this.pubnubClient.publish(
				message,
				channel
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate
			this.logger.warn(`Unable to publish user op to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}
}

(async function() {
	try {
		await new SetFlag().go({
			teamId: Commander.teamId,
			userId: Commander.userId,
			flag: Commander.flag,
			clear: Commander.clear
		});
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();


