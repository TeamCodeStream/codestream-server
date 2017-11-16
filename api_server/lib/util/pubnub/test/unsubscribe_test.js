'use strict';

var PubNubTest = require('./pubnub_test');
var Assert = require('assert');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class UnsubscribeTest extends PubNubTest {

	get description () {
		return 'client should no longer receive messages on a channel when it has unsubscribed';
	}

	run (callback) {
		BoundAsync.series(this, [
			super.run,
			this.unsubscribe,
			this.sendRandomFromServer,
			this.setTimer
		], callback);
	}

	unsubscribe (callback) {
		this.unsubscribed = true;
		this.pubnubForClient.unsubscribe(this.channelName);
		callback();
	}

	messageReceived (error, message) {
		if (!error && this.unsubscribed) {
			Assert.fail('message should not be received on this channel');
		}
		else {
			super.messageReceived(error, message);
		}
	}

	setTimer (callback) {
		// wait 5 seconds to make sure the message isn't received
		setTimeout(callback, 5000);
	}
}

module.exports = UnsubscribeTest;
