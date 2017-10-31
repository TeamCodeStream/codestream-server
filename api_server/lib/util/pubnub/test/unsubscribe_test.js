'use strict';

var PubNub_Test = require('./pubnub_test');
var Assert = require('assert');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class Unsubscribe_Test extends PubNub_Test {

	get description () {
		return 'client should no longer receive messages on a channel when it has unsubscribed';
	}

	run (callback) {
		Bound_Async.series(this, [
			super.run,
			this.unsubscribe,
			this.send_random_from_server,
			this.set_timer
		], callback);
	}

	unsubscribe (callback) {
		this.unsubscribed = true;
		this.pubnub_for_client.unsubscribe(this.channel_name);
		callback();
	}

	message_received (error, message) {
		if (!error && this.unsubscribed) {
			Assert.fail('message should not be received on this channel');
		}
		else {
			super.message_received(error, message);
		}
	}

	set_timer (callback) {
		// wait 5 seconds to make sure the message isn't received
		setTimeout(callback, 5000);
	}
}

module.exports = Unsubscribe_Test;
