// the email module provides an email service to the api server

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module');
const TryIndefinitely = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/try_indefinitely');

const DEPENDENCIES = [
	'aws',	// need to initialize AWS SQS
];

class Email extends APIServerModule {

	getDependencies () {
		return DEPENDENCIES;
	}

	services () {
		// this returns a factory function which will be called upon after all the modules
		// have been read in and initialized ... the factory function will then return
		// a service object that the app can use to send emails from wherever
		return async () => {
			return { email: this };
		};
	}

	// called to queue an outbound email for sending, to be acted upon by the outbound email lambda function
	async queueEmailSend (message, options = {}) {
		// a special header can be sent with the request that will indicate we are testing emails,
		// meaning that we won't actually send the emails, but instead send a message to the user's
		// "me" channel simulating the email send ... to do this, send the testing flag with this message
		if (this.requestSaysToTestEmails(options)) {
			this.publishEmailMessageForTesting(
				message, 
				{ 
					user: options.user,
					request: options.request 
				}
			);
			return;
		}

		// a special header can be sent with the request that will block queueing for email sending,
		// this is mostly for testing purposes
		else if (this.requestSaysToBlockEmails(options)) {
			if (options.request) {
				options.request.log(`Would have queued email send: ${JSON.stringify(message)}`);
			}
			return;
		}

		const delay = options.delay ? Math.floor(options.delay / 1000) : 0;
		await this.api.services.queueService.sendMessage(
			this.api.config.queuingEngine[this.api.config.queuingEngine.selected].outboundEmailQueueName,
			message,
			{ delay }
		);
	}

	// called to queue a reinvite email
	async queueReinvite (message, options = {}) {
		// a special header can be sent with the request that will block queueing for email sending,
		// this is mostly for testing purposes
		if (this.requestSaysToBlockEmails(options)) {
			if (options.request) {
				options.request.log(`Would have queued reinvite: ${JSON.stringify(message)}`);
			}
			return;
		}

		const delay = options.delay ? Math.floor(options.delay / 1000) : 0;
		await this.api.services.queueService.sendMessage(
			this.api.config.queuingEngine[this.api.config.queuingEngine.selected].reinviteQueueName,
			message,
			{ delay }
		);
	}

	// initialize by listening for messages relevant to reinvite emails
	async initialize () {
		await this.listenForEmailReinvites();
	}

	// listen for messages relevant to reinvite emails
	async listenForEmailReinvites () {
		if (this.api.config.email.suppressEmails) {
			this.api.log('Not listening for reinvite emails because outbound emails are disabled');
			return; 
		}
		if (!this.api.services.queueService) {
			this.api.log('Not listening for reinvite emails because no queuing service is defined');
			return;
		}
		if (!this.api.config.queuingEngine.selected) {
			this.api.log('Not listening for reinvite emails because no queuing service is selected');
			return;
		}
		const queueService = this.api.config.queuingEngine[this.api.config.queuingEngine.selected];
		if (!queueService) {
			this.api.log('Not listening for reinvite emails because selected queueing service was not found');
			return;
		}
		const queueName = queueService.reinviteQueueName;
		if (!queueName) {
			this.api.log('Not listening for reinvite emails because no reinvite queue name was configured');
			return;
		}

		// create the queue
		await TryIndefinitely(async () => {
			await this.api.services.queueService.createQueue({
				name: queueName,
				logger: this.api
			});
		}, 5000, this.api, 'Unable to create reinvite email queue, retrying...');

		// listen on the queue
		this.api.log(`Trying to listening to ${queueName}...`);
		await this.api.services.queueService.listen({
			name: queueName,
			handler: this.handleReinviteMessage.bind(this)
		});
		this.api.log(`Successfully listening to ${queueName}...`);
	}

	// handle messages coming from the revinite queue, to queue reinvite emails
	async handleReinviteMessage (message, requestId, callback) {
		if (callback) {
			callback(true); // immediately release the message
		}
		this.api.log(`Received reinvite message ${requestId}: ${JSON.stringify(message)}`);

		// get the user
		const { userId } = message;
		let user = await this.api.data.users.getById(userId);
		if (!user) {
			this.api.log(`Unable to send auto reinvite to user ${userId}, user not found`);
			return;
		} else if (user.deactivated) {
			this.api.log(`Not sending auto reinvite to user ${userId}, user has been deactivated`);
			return;
		} else if (user.isRegistered) {
			this.api.log(`Not sending auto reinvite to user ${userId}, user has registered`);
			return;
		}

		// queue invite email for send by outbound email service
		this.api.log(`Triggering auto invite email to ${user.email}...`);
		await this.api.services.email.queueEmailSend(
			{
				type: 'invite',
				...message
			}
		);

		// update numInvites, lastInviteType
		const op = {
			$set: {
				lastInviteType: 'autoReinvitation',
				modifiedAt: Date.now(),
				version: user.version + 1
			},
			$inc: {
				numInvites: 1
			}
		};
		await this.api.data.users.updateDirect(user.id, op);

		// publish the change to all teams
		op.$version = {
			before: user.version,
			after: user.version + 1
		};
		const teamIds = user.teamIds || [];
		await Promise.all(teamIds.maps(async teamId => {
			const message = {
				requestId,
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
				this.api.warn(`Could not publish user update message to team ${teamId}: ${JSON.stringify(error)}`);
			}
		}));
	}

	// determine if special header was sent with the request that says to block emails
	requestSaysToBlockEmails (options) {
		const headers = (
			options.request &&
			options.request.request &&
			options.request.request.headers
		);
		return (
			this.api.config.email.suppressEmails ||
			(headers && headers['x-cs-block-email-sends'])
		);
	}

	// determine if special header was sent with the request that says to test emails,
	// meaning we'll not actually send them out but send them through a pubnub channel
	// to verify content
	requestSaysToTestEmails (options) {
		return (
			options.request &&
			options.request.request &&
			options.request.request.headers &&
			options.request.request.headers['x-cs-test-email-sends']
		);
	}

	// when testing emails, we'll get the body that would otherwise be sent to
	// the email server through this callback, we'll send it along through the
	// user's me-channel, which the test client should be listening to
	async publishEmailMessageForTesting (message, options) {
		if (!options || !options.user || !this.api.services.broadcaster) { return; }
		const channel = `user-${options.user.id}`;
		if (options.request) {
			options.request.log(`Publishing outbound email message: ${JSON.stringify(message)}`);
			message = Object.assign({}, message, { requestId: options.request.request.id });
		}
		await this.api.services.broadcaster.publish(
			message,
			channel,
			{ request: options.request }
		);
	}
}

module.exports = Email;
