// the email module provides an email service to the api server

'use strict';

var APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module');
var CodeStreamEmails = require('./codestream_emails');

class Email extends APIServerModule {

	services () {
		// this returns a factory function which will be called upon after all the modules
		// have been read in and initialized ... the factory function will then return
		// a service object that the app can use to send emails from wherever
		return async () => {
			if (!this.api.config.email) {
				return this.api.warn('Will not send emails, no email configuration supplied');
			}

			this.api.log('Initiating email...');
			let emailConfig = Object.assign({}, this.api.config.email);
			emailConfig.testCallback = this.testCallback.bind(this);
			this.codestreamEmails = new CodeStreamEmails(emailConfig);
			return { email: this.codestreamEmails };
		};
	}

	// when testing emails, we'll get the body that would otherwise be sent to
	// the email server through this callback, we'll send it along through the
	// user's me-channel, which the test client should be listening to
	testCallback (body, user, request) {
		if (!user || !this.api.services.messager) { return; }
		let channel = `user-${user.id}`;
		let requestCopy = Object.assign({}, request);	// override test setting indicating not to send pubnub messages
		requestCopy.headers = Object.assign({}, request.headers);
		delete requestCopy.headers['x-cs-block-message-sends'];
		this.api.services.messager.publish(
			body,
			channel,
			() => {},
			request
		);
	}
}

module.exports = Email;
