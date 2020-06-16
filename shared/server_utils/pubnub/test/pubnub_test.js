'use strict';

var BasePubNubTest = require('./base_pubnub_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var Assert = require('assert');

class PubNubTest extends BasePubNubTest {

	get description () {
		return 'client should receive the correct message through PubNub after message is sent from server';
	}

	// the actual test execution
	run (callback) {
		if (this.config.whichBroadcastEngine !== 'pubnub') {
			return callback();
		}
		BoundAsync.series(this, [
			this.listenOnClient,		// listen on the client pubnub for the message we're going to send
			this.sendRandomFromServer,	// send a random message, simulating a message sent from the server
			this.waitForMessage,		// wait for it
			this.clearTimer				// clear the timer, so we don't trigger a failure
		], callback);
	}

	// validate the message received
	validateMessage (message) {
		Assert(message.channel === this.channelName, 'received message doesn\'t match channel name');
		Assert(message.message === this.message, 'received message doesn\'t match');
		return true;
	}
}

module.exports = PubNubTest;
