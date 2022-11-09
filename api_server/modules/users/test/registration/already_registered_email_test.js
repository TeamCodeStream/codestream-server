'use strict';

const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');

class AlreadyRegisteredEmailTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.messageReceiveTimeout = 10000;	// wait 10 seconds for message
		this.userOptions.numRegistered = 1;
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		return 'should send an already-registered email when a user registers and that user is already registered';
	}

	// make the data that will be used during the test
	makeData (callback) {
		this.data = this.userFactory.getRandomUserData();
		this.data.email = this.currentUser.user.email;
		this.data._delayEmail = this.usingSocketCluster ? 1000 : (this.mockMode ? 300 : 8000);	// delay the sending of the email, so we can start subscribing to the me-channel before the email is sent

		// attempt to register the already-registered user
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/register',
				data: this.data,
				testEmails: true,	// this should get us email data back in the pubnub me-channel
				requestOptions: {
					headers: this.useHeaders
				}
			},
			callback
		);
	}

	// set the channel name to listen for the email message on
	setChannelName (callback) {
		this.channelName = `user-${this.currentUser.user.id}`;
		callback();
	}

	// generate the message that starts the test
	generateMessage (callback) {
		// expect to receive this message
		this.message = {
			type: 'alreadyRegistered',
			userId: this.currentUser.user.id,
			traceHeaders: {}
		};
		// in this case, we've already started the test in makeData, which created the user ...
		// but the email was delayed, so we can just start listening for it now...
		callback();
	}
}

module.exports = AlreadyRegisteredEmailTest;
