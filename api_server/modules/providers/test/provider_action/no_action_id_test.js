'use strict';

const TrackingTest = require('./tracking_test');
const Assert = require('assert');

class NoActionIdTest extends TrackingTest {

	get description () {
		return `${this.provider} action request should succeed but no tracking message will be sent if action_id is not found in the payload`;
	}

	init (callback) {
		// delete the action_id from the payload
		super.init(error => {
			if (error) { return callback(error); }
			delete this.data.payload.actions[0].action_id;
			callback();
		});
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

module.exports = NoActionIdTest;
