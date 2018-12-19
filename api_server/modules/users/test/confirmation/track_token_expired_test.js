'use strict';

const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const Assert = require('assert');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');

class TrackTokenExpiredTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 0;
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		return 'should send a Email Confirmation Failed event for tracking purposes when a user clicks on an expired confirmation link';
	}

	// before the test runs...
	before (callback) {
		const data = this.userFactory.getRandomUserData();
		Object.assign(data, {
			_confirmationCheat: SecretsConfig.confirmationCheat, // gives us the confirmation code in the response
			_subscriptionCheat: SecretsConfig.subscriptionCheat, // lets us listen on this user's me-channel
			_forceConfirmation: true, // overrides developer environment, where confirmation might be turned off
			wantLink: true,
			expiresIn: 1000
		});
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/register',
				data: data
			},
			(error, response) => {
				if (error) { return callback(error); }
				const { user } = response;
				this.data = { 
					email: user.email,
					token: user.confirmationToken
				};
				this.currentUser = { 
					user,
					pubnubToken: user.id
				};
				super.before(callback);
			}
		);
	}

	createUsersAndTeam (callback) {
		callback();
	}

	// set the channel name to listen for the email message on
	setChannelName (callback) {
		// for the user originating the request, we use their me-channel
		// we'll be sending the data that we would otherwise send to the tracker
		// service (mixpanel) on this channel, and then we'll validate the data
		this.channelName = `user-${this.currentUser.user.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// initiate the request, this should trigger a publish of the tracker message
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/confirm',
				data: this.data,
				testTracking: true,
				reallyTrack: true,
				token: this.token
			},
			() => {
				// ignore error response
				callback();
			}
		);
	}

	/* eslint complexity: 0 */
	// validate the message received from pubnub
	validateMessage (message) {
		message = message.message;
		if (message.type !== 'track') {
			return false;
		}
		const expectedMessage = {
			Error: 'Expired',
			'Email Address': this.currentUser.user.email
		};
		Assert.equal(message.event, 'Email Confirmation Failed', 'event not correct');
		Assert.deepEqual(message.data, expectedMessage, 'tracking data not correct');
		return true;
	}
}

module.exports = TrackTokenExpiredTest;
