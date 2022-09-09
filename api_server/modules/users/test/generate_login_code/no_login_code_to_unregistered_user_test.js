'use strict';

const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const Assert = require('assert');

class NoLoginCodeToUnregisteredUserTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.messageReceiveTimeout = this.mockMode ? 2000 : 10000;
		Object.assign(this.userOptions, {
			numRegistered: 1,
			numUnregistered: 1,
			cheatOnSubscription: true
		});
		this.listeningUserIndex = 1;
	}

	get description () {
		return 'should NOT send an email with a login code when attempting to generate a login code for an unregistered user';
	}

	generateMessage (callback) {
		this.data = {
			email: this.users[1].user.email
		};
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/generate-login-code',
				data: {
					email: this.users[1].user.email,
					_delayEmail: this.usingSocketCluster ? 1000 : (this.mockMode ? 500 : 8000),
					_subscriptionCheat: this.apiConfig.sharedSecrets.subscriptionCheat
				},
				testEmails: true
			},
			callback
		);
	}

	setChannelName (callback) {
		this.channelName = `user-${this.users[1].user.id}`;
		callback();
	}

	// called if message doesn't arrive after timeout, in this case, this is what we want
	messageTimeout () {
		this.messageCallback();
	}

	// called when a message has been received, in this case this is bad
	messageReceived (error, message) {
		if (error) { return this.messageCallback(error); }
		Assert.fail('message was received');
	}
}

module.exports = NoLoginCodeToUnregisteredUserTest;
