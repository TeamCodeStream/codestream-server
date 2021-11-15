// serves as the base class for other email notification tests

'use strict';

const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');

class ConfirmationEmailTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.messageReceiveTimeout = 10000;	// wait 10 seconds for message
		this.userOptions.numRegistered = 0;
		delete this.teamOptions.creatorIndex;
		this.cheatOnSubscription = true;
	}

	get description () {
		return 'should send a confirmation email when a new user registers';
	}

	// make the data that will be used during the test
	makeData (callback) {
		this.data = this.userFactory.getRandomUserData();
		this.data.email = this.useEmail || this.data.email; // allow sub-class override
		this.data._subscriptionCheat = this.apiConfig.sharedSecrets.subscriptionCheat;	// allow client to subscribe to their me-channel, even though not registered yet
		this.data._delayEmail = this.usingSocketCluster ? 1000 : (this.mockMode ? 300 : 8000);	// delay the sending of the email, so we can start subscribing to the me-channel before the email is sent
		if (this.wantLink) {
			throw 'wantLink is deprecated';
			//this.data.wantLink = true;
		}
		// register a random user
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
			(error, response) => {
				if (error) { return callback(error); }
				this.users.push(response);
				this.currentUser = response;
				this.currentUser.broadcasterToken = this.currentUser.user.id;
				callback();
			}
		);
	}

	// set the channel name to listen for the email message on
	setChannelName (callback) {
		// for the user we expect to receive the confirmation email, we use their me-channel
		// we'll be sending the data that we would otherwise send to the outbound email
		// service on this channel, and then we'll validate the data
		this.channelName = `user-${this.currentUser.user.id}`;
		callback();
	}

	// generate the message that starts the test
	generateMessage (callback) {
		// expect to receive this message
		this.message = {
			type: 'confirm',
			userId: this.currentUser.user.id,
			traceHeaders: {}
		};
		// in this case, we've already started the test in makeData, which created the user ...
		// but the email was delayed, so we can just start listening for it now...
		callback();
	}
}

module.exports = ConfirmationEmailTest;
