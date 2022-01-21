'use strict';

const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');

class LoginCodeEmailTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.messageReceiveTimeout = 10000;	// wait 10 seconds for message
	}

	get description () {
		return 'should send an email with the login code';
	}

	makeData (callback) {
		this.data = {
			email: this.currentUser.user.email
		};
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/generate-login-code',
				data: {
					email: this.currentUser.user.email,
					_delayEmail: this.usingSocketCluster ? 1000 : (this.mockMode ? 300 : 8000)
				},
				testEmails: true
			},
			callback
		);
	}

	setChannelName (callback) {
		this.channelName = `user-${this.currentUser.user.id}`;
		callback();
	}

	generateMessage (callback) {
		this.message = {
			type: 'loginCode',
			userId: this.currentUser.user.id,
			traceHeaders: {}
		};
		callback();
	}
}

module.exports = LoginCodeEmailTest;
