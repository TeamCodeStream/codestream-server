#!/usr/bin/env node

//desc// look for users due for a reinvite, and queue message to send them an email as needed

/* eslint no-console: 0 */

'use strict';

const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const PubNub = require('pubnub');
const PubNubClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/pubnub/pubnub_client_async');
const OS = require('os');
const SQSClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aws/sqs_client');
const AWS = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aws/aws');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes');

// need these collections from mongo
const COLLECTIONS = ['users', 'reinviteUsersLastRunAt'];

const THROTTLE_TIME = 100;
const REINVITE_INTERVAL = 24 * 60 * 60 * 1000;
const RUN_INTERVAL = 50 * 60 * 1000;

// wait this number of milliseconds
const Wait = function (time) {
	return new Promise(resolve => {
		setTimeout(resolve, time);
	});
};

class Reinviter {

	// main entry point
	async go (options = {}) {
		this.numProcessed = 0;
		this.numInvited = 0;
		Object.assign(this, options);
		this.logger = this.logger || console;
		await this.openMongoClient();
		if (await this.abortIfDoneAlready()) {
			this.log('Not running, another process has already run');
			process.exit();
		}
		await this.openPubnubClient();
		await this.openSQSClient();
		await this.updateLastRunAt();
		await this.process();
		this.log(`${this.numProcessed} users processed`);
		this.log(`${this.numInvited} users invited`);
		process.exit();
	}

	// if another instance of this script already ran, just abort
	async abortIfDoneAlready () {
		const lastRunAt = await this.data.reinviteUsersLastRunAt.getByQuery({}, { overrideHintRequired: true });
		if (lastRunAt && lastRunAt[0] && lastRunAt[0].lastRunAt > Date.now() - RUN_INTERVAL) {
			return true;
		}
	}

	// open a mongo client to read from
	async openMongoClient () {
		this.log('Connecting to mongo...');
		this.mongoClient = new MongoClient({ collections: COLLECTIONS });
		try {
			await this.mongoClient.openMongoClient(this.config.storage.mongo);
			this.data = this.mongoClient.mongoCollections;
		}
		catch (error) {
			throw `unable to open mongo client: ${JSON.stringify(error)}`;
		}
	}

	// open a Pubnub client for broadcasting the changes
	async openPubnubClient () {
		this.log('Connecting to PubNub...');
		this.pubnub = new PubNub(Object.assign({}, this.config.broadcastEngine.pubnub, { uuid: 'API-' + OS.hostname() }));
		this.pubnubClient = new PubNubClient({ pubnub: this.pubnub });
		await this.pubnubClient.init();
	}

	// open an SQS client for queueing emails
	async openSQSClient () {
		this.log('Initializing SQS...');
		this.aws = new AWS(this.config.queuingEngine.awsSQS);
		this.sqsClient = new SQSClient({ aws: this.aws, logger: this.logger });

		const queueName = this.config.queuingEngine[this.config.queuingEngine.selected].outboundEmailQueueName
		await this.sqsClient.createQueue({
			name: queueName,
			logger: this.logger
		});
	}

	// set flag for the given user or all the users in the given team
	async process () {
		if (this.isWeekend()) {
			this.log('It is local weekend, not running');
			return;
		}
		const result = await this.data.users.getByQuery(
			{
				needsAutoReinvites: { $gt: 0 }
			},
			{
				stream: true,
				hint: UserIndexes.byNeedsAutoReinvites,
				sort: { _id: 1 }
			}
		);

		let user;
		do {
			user = await result.next();
			if (user) {
				await this.reinviteUserAsNeeded(user);
				await Wait(THROTTLE_TIME);
			}
		} while (user);
		result.done();
	}

	// set flag for the given user
	async reinviteUserAsNeeded (user) {
		let clearUser = false;
		if (user.isRegistered) {
			this.log(`User ${user.email} is now registered, not re-inviting`);
			clearUser = true;
		} else if (user.deactivated) {
			this.log(`User ${user.email} has been deactivated, not re-inviting`);
			clearUser = true;
		} else if (!user.needsAutoReinvites) {
			this.log(`User ${user.email} has no more auto-reinvites, not re-inviting`);
			clearUser = true;
		} else if (user.lastInviteSentAt > Date.now() - REINVITE_INTERVAL) {
			this.log(`User ${user.email} has had an invite within ${REINVITE_INTERVAL} ms, not re-inviting (yet)`);
			this.numProcessed++;
			return;
		}

		if (clearUser) {
			return this.clearUser(user);
		} else {
			return this.reinviteUser(user);
		}
	}

	// clear auto re-invites for this user, no longer needed
	async clearUser (user) {
		const op = {
			$unset: {
				needsAutoReinvites: true,
				autoReinviteInfo: true
			}
		};
		await this.data.users.updateDirect({ _id: this.data.users.objectIdSafe(user.id) }, op);
		this.numProcessed++;
	}

	// re-invite this user by sending an invite email, updating the user, and publishing user changes
	async reinviteUser (user) {
		// queue invite email for send by outbound email service
		this.log(`Triggering auto invite email to ${user.email}...`);
		const message = {
			type: 'invite',
			userId: user.id,
			...user.autoReinviteInfo
		};
		const queueName = this.config.queuingEngine[this.config.queuingEngine.selected].outboundEmailQueueName
		await this.sqsClient.sendMessage(queueName, message);

		// update the user indicating invite has been sent
		const op = {
			$set: {
				lastInviteType: 'autoReinvitation',
				modifiedAt: Date.now(),
				lastInviteSentAt: Date.now(),
				version: user.version + 1
			},
			$inc: {
				numInvites: 1
			}
		};
		if (user.needsAutoReinvites === 1) {
			op.$unset = {
				needsAutoReinvites: true,
				autoReinviteInfo: true
			};
		} else {
			op.$inc.needsAutoReinvites = -1;
		}
		await this.data.users.updateDirect({ _id: this.data.users.objectIdSafe(user.id) }, op);

		// publish the change to all teams
		op.$version = {
			before: user.version,
			after: user.version + 1
		};
		const teamIds = user.teamIds || [];
		await Promise.all(teamIds.map(async teamId => {
			const message = {
				requestId: `autoReinvite-${3-user.needsAutoReinvites}-${teamId}-${user.id}`,
				users: [op]
			};
			try {
				await this.pubnubClient.publish(
					message,
					'team-' + teamId
				);
			}
			catch (error) {
				// this doesn't break the chain, but it is unfortunate...
				this.log(`Could not publish user update message to team ${teamId}: ${JSON.stringify(error)}`);
			}
		}));

		this.numProcessed++;
		this.numInvited++;
	}
	
	// is it the weekend now? we don't work weekends
	// weekend defined as starting at 6 PM Friday, ending at 8 AM Monday
	isWeekend () {
		const now = new Date();
		const day = now.getDay();
		const hour = now.getHours();

		switch (day) {
			case 0: // sunday
			case 7: // saturday
				return true;

			case 1: // monday
				return hour < 8;

			case 6: // friday
				return hour >= 18;

			default:
				return false;
		}
	}

	// update when this script was last run so other running instances don't try
	async updateLastRunAt () {
		await this.data.reinviteUsersLastRunAt.updateDirect(
			{ }, 
			{ $set: { lastRunAt: Date.now() } },
			{ upsert: true}
		);
	}

	log (msg) {
		const now = new Date().toISOString();
		this.logger.log(`${now} - ${msg}`);
	}
}

(async function() {
	try {
		await ApiConfig.loadPreferredConfig();
		await new Reinviter().go({ config: ApiConfig.getPreferredConfig() });
	}
	catch (error) {
		const msg = error instanceof Error ? error.message : JSON.stringify(error);
		const stack = error instanceof Error ? error.stack : '';
		const now = new Date().toISOString();
		console.log(`${now} - ERROR: ${msg}\n${stack}`);
		process.exit();
	}
})();


