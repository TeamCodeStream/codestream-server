'use strict';

var PubNubTest = require('./pubnub_test');
var Assert = require('assert');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class UnsubscribeTest extends PubNubTest {

	get description () {
		return 'client should no longer receive messages on a channel when it has unsubscribed';
	}

	// run the test...
	run (callback) {
		if (this.config.whichBroadcastEngine !== 'pubnub') {
			return callback();
		}
		BoundAsync.series(this, [
			super.run,				// run the standard send/receive test
			this.unsubscribe,		// now unsubscribe
			this.sendRandomFromServer,	// send another random message
			this.setTimer			// listen for a while, we shouldn't get a message
		], callback);
	}

	// unsubscribe from the channel
	unsubscribe (callback) {
		this.unsubscribed = true;
		this.pubnubForClients[0].unsubscribe(this.channelName);
		callback();
	}

	// called when a message is received, if we've unsubscribed, we shouldn't get a message
	messageReceived (error, message) {
		if (!error && this.unsubscribed) {
			Assert.fail('message should not be received on this channel');
		}
		else {
			// this is ok, it's part of the initial test
			super.messageReceived(error, message);
		}
	}

	// listen for a while to make sure we don't receive the message
	setTimer (callback) {
		// wait 5 seconds to make sure the message isn't received
		setTimeout(callback, 3000);
	}
}

module.exports = UnsubscribeTest;
