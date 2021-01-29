'use strict';

const Scheduler = require('node-schedule');
const Indexes = require('./indexes');

const THROTTLE_TIME = 100;
const REINVITE_INTERVAL = 24 * 60 * 60 * 1000;
const RUN_INTERVAL = 60 * 60 * 1000;

// wait this number of milliseconds
const Wait = function (time) {
	return new Promise(resolve => {
		setTimeout(resolve, time);
	});
};

class Reinviter {

	constructor (options) {
		Object.assign(this, options);
	}

	// schedule jobs to look for users who need to be reinvted
	schedule () {
		// stagger each worker's schedule to occur at a random time every hour between 8-6 local, on weekdays
		const randomMinutes = Math.floor(Math.random() * 50);
		const randomSeconds = Math.floor(Math.random() * 60);
		this.api.log(`Triggering auto re-invites for execution at :${randomMinutes}m:${randomSeconds}s for every hour`);
		this.job = Scheduler.scheduleJob(`${randomSeconds} ${randomMinutes} 8-17 * * 1-5`, this.doReinvites.bind(this));
	}

	// look for users to be reinvited
	async doReinvites () {
		this.api.log(`Reinvite check triggered`);
		this.numInvited = 0;
		this.numProcessed = 0;
		if (this.api.config.email.suppressEmails) {
			this.api.log('Emails are disabled in configuration, not running auto re-invites');
			return;
		}
		if (await this.abortIfDoneAlready()) {
			this.api.log('Reinvite check already handled by another worker, not running auto re-invites');
			return;
		}

		// we are optimistic here, but this minimizes the chance that another worker will kick off 
		// and accidentally send two invite emails for the same user
		await this.updateLastRunAt();

		// get users who need a reinvite
		const result = await this.api.data.users.getByQuery(
			{
				needsAutoReinvites: { $gt: 0 }
			},
			{
				stream: true,
				hint: Indexes.byNeedsAutoReinvites,
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

		this.api.log(`${this.numProcessed} users processed`);
		this.api.log(`${this.numInvited} users re-invited`);
	}

	// set flag for the given user
	async reinviteUserAsNeeded (user) {
		let clearUser = false;
		if (user.isRegistered) {
			this.api.log(`User ${user.email} is now registered, not re-inviting`);
			clearUser = true;
		} else if (user.deactivated) {
			this.api.log(`User ${user.email} has been deactivated, not re-inviting`);
			clearUser = true;
		} else if (!user.needsAutoReinvites) {
			this.api.log(`User ${user.email} has no more auto-reinvites, not re-inviting`);
			clearUser = true;
		} else if (user._forTesting) {
			this.api.log(`User ${user.email} is a test user, not re-inviting`);
			clearUser = true;
		} else if (user.lastInviteSentAt > Date.now() - REINVITE_INTERVAL) {
			this.api.log(`User ${user.email} has had an invite within ${REINVITE_INTERVAL} ms, not re-inviting (yet)`);
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
		await this.api.data.users.updateDirect({ _id: this.api.data.users.objectIdSafe(user.id) }, op);
		this.numProcessed++;
	}

	// re-invite this user by sending an invite email, updating the user, and publishing user changes
	async reinviteUser (user) {
		// queue invite email for send by outbound email service
		this.api.log(`Triggering auto invite email to ${user.email}...`);
		const message = {
			type: 'invite',
			userId: user.id,
			...user.autoReinviteInfo
		};
		const queueName = this.api.config.queuingEngine[this.api.config.queuingEngine.selected].outboundEmailQueueName
		await this.api.services.queueService.sendMessage(queueName, message);

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
		await this.api.data.users.updateDirect({ _id: this.api.data.users.objectIdSafe(user.id) }, op);

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
				await this.api.services.broadcaster.publish(
					message,
					'team-' + teamId
				);
			}
			catch (error) {
				// this doesn't break the chain, but it is unfortunate...
				this.api.log(`Could not publish user update message to team ${teamId}: ${JSON.stringify(error)}`);
			}
		}));

		this.numProcessed++;
		this.numInvited++;
	}

	// if another instance of this script already ran, just abort
	async abortIfDoneAlready () {
		const lastRunAt = await this.api.data.reinviteUsersLastRunAt.getByQuery({}, { overrideHintRequired: true });
		if (lastRunAt && lastRunAt[0] && lastRunAt[0].lastRunAt > Date.now() - RUN_INTERVAL) {
			return true;
		}
	}

	// update when this script was last run so other running instances don't try
	async updateLastRunAt () {
		await this.api.data.reinviteUsersLastRunAt.updateDirect(
			{ }, 
			{ $set: { lastRunAt: Date.now() } },
			{ upsert: true}
		);
	}
};

module.exports = Reinviter;