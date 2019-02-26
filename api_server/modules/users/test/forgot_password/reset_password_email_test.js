// serves as the base class for tests of the /no-auth/forgot-password request, for users requesting a 
// password reset email

'use strict';

const Assert = require('assert');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const WebClientConfig = require(process.env.CS_API_TOP + '/config/webclient');

class ResetPasswordEmailTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.messageReceiveTimeout = 10000;	// wait 10 seconds for message
	}

	get description () {
		return 'should send a reset password email when a user sends a forgot password request';
	}

	// make the data that will be used during the test request
	makeRequestData () {
		return {
			email: this.currentUser.user.email,
			_delayEmail: this.usingSocketCluster ? 1000 : (this.mockMode ? 200 : 10000) // delay the sending of the email, so we can start subscribing to the me-channel before the email is sent
		};
	}

	// make the data that will be used during the test
	makeData (callback) {
		// initiate the forgot-password request
		this.data = this.makeRequestData();
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/forgot-password',
				data: this.data,
				testEmails: true	// this should get us email data back in the pubnub me-channel
			},
			callback
		);
	}

	// set the channel name to listen for the email message on
	setChannelName (callback) {
		// for the user we expect to receive the reset password email, we use their me-channel
		// we'll be sending the data that we would otherwise send to the outbound email
		// service on this channel, and then we'll validate the data
		this.channelName = `user-${this.currentUser.user.id}`;
		callback();
	}

	// generate the message that starts the test
	generateMessage (callback) {
		// this is the message we expect to see
		this.message = {
			type: 'resetPassword',
			userId: this.currentUser.user.id
		};
		// in this case, we've already started the test in makeData, which created the user ...
		// but the email was delayed, so we can just start listening for it now...
		callback();
	}

	// validate the message received from pubnub
	validateMessage (message) {
		const gotMessage = message.message;
		if (!gotMessage.type) { return false; }	// ignore anything not matching

		// verify a match to the url
		const host = WebClientConfig.host.replace(/\//g, '\\/');
		const shouldMatch = new RegExp(`${host}\\/reset-password\\/(.*)$`);
		const match = gotMessage.url.match(shouldMatch);
		Assert(match && match.length === 2, 'reset password link url is not correct');

		// pass the deepEqual
		this.message.url = gotMessage.url;
		return super.validateMessage(message);
	}
}

module.exports = ResetPasswordEmailTest;
