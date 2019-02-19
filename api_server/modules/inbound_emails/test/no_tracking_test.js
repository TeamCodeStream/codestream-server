'use strict';

const TrackingTest = require('./tracking_test');
const Assert = require('assert');

class NoTrackingTest extends TrackingTest {

	get description () {
		return 'should not send a Post Created event when handling a post via email from a user who has telemetry consent turned off';
	}

	init (callback) {
		// add to the initialization by opting the post originator out of telemetry, meaning we should
		// get no message for tracking when conducting the tracking test
		super.init(error => {
			if (error) { return callback(error); }
			this.optOutOfTelemetry(callback);
		});
	}

	// opt the post originator out of telemetry by setting preference
	optOutOfTelemetry (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/preferences',
				data: { telemetryConsent: false },
				token: this.users[1].accessToken
			},
			callback
		);
	}

	// called if message doesn't arrive after timeout, in this case, this is what we want
	messageTimeout () {
		this.messageCallback();
	}

	// called when a message has been received, in this case this is bad
	messageReceived (error, message) {
		if (error) { return this.messageCallback(error); }
		if (message.message.type === 'track') {
			Assert.fail('tracking message was received');
		}
	}
}

module.exports = NoTrackingTest;
