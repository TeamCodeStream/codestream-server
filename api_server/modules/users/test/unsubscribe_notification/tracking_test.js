'use strict';

const Assert = require('assert');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');

class TrackingTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	constructor (options) {
		super(options);
		this.usingNRLogins = true;
	}

	get description () {
		const unifiedIdentity = this.unifiedIdentityEnabled ? ', under unified identity' : '';
		return `should send an Unsubscribe event for tracking purposes when user follows email link to unsubscribe from notification emails${unifiedIdentity}`;
	}

	// before the test runs...
	makeData (callback) {
		this.init(callback);
	}

	// set the channel name to listen for the email message on
	setChannelName (callback) {
		// for the user originating the request, we use their me-channel
		// we'll be sending the data that we would otherwise send to the tracker
		// service on this channel, and then we'll validate the data
		this.channelName = `user-${this.currentUser.user.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: this.path,
				testTracking: true,
				reallyTrack: true,
				requestOptions: {
					noJsonInResponse: true,
					expectRedirect: true
				}
			},
			callback
		);
	}

	// validate the message received from pubnub
	validateMessage (message) {
		message = message.message;
		const { type, data } = message;
		if (type !== 'track') {
			return false;
		}

		const expectedMessage = {
			userId: this.currentUser.user.nrUserId,
			event: 'codestream/email unsubscribed',
			properties: {
				$created: new Date(this.currentUser.user.registeredAt).toISOString(),
				$email: this.currentUser.user.email,
				name: this.currentUser.user.fullName,
				//'Join Method': 'Created Team',
				distinct_id: this.currentUser.user.nrUserId,
				'meta_data': 'email_type: discussion',
				'event_type': 'response'
			}
		};

		if (this.unifiedIdentityEnabled) {
			expectedMessage.properties['NR User ID'] = this.currentUser.user.nrUserId;
			expectedMessage.properties['NR Tier'] = 'basic_user_tier';			
		}

		Assert.deepStrictEqual(data, expectedMessage, 'tracking data not correct');
		return true;
	}
}

module.exports = TrackingTest;
