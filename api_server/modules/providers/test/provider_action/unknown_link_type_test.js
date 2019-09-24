'use strict';

const TrackingTest = require('./tracking_test');
const Assert = require('assert');
const RandomString = require('randomstring');

class UnknownLinkTypeTest extends TrackingTest {

	get description () {
		return `${this.provider} action request should succeed but no tracking message will be sent if the link type given in the action payload is unknown`;
	}

	setData (callback) {
		// substitute an invalid link type
		super.setData(error => {
			if (error) { return callback(error); }
			const action = JSON.parse(this.data.actions[0].action_id);
			action.linkType = RandomString.generate(10);
			this.data.actions[0].action_id = JSON.stringify(action);
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

module.exports = UnknownLinkTypeTest;
