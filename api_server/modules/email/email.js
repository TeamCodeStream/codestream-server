// the email module provides an email service to the api server

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module');
const { callbackWrap } = require(process.env.CS_API_TOP + '/server_utils/await_utils');

class Email extends APIServerModule {

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
		await callbackWrap(
			this.api.services.queueService.sendMessage.bind(this.api.services.queueService),
			this.api.config.aws.sqs.outboundEmailQueueName,
			message,
			{ delay }
		);
	}

	// determine if special header was sent with the request that says to block emails
	requestSaysToBlockEmails (options) {
		return (
			options.request &&
			options.request.request &&
			options.request.request.headers &&
			options.request.request.headers['x-cs-block-email-sends']
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
		if (!options || !options.user || !this.api.services.messager) { return; }
		const channel = `user-${options.user.id}`;
		if (options.request) {
			options.request.log(`Publishing outbound email message: ${JSON.stringify(message)}`);
			message = Object.assign({}, message, { requestId: options.request.request.id });
		}
		await this.api.services.messager.publish(
			message,
			channel,
			{ request: options.request }
		);
	}
}

module.exports = Email;
