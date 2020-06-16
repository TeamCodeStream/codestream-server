'use strict';

var PubNubTest = require('./pubnub_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var Assert = require('assert');

class HistoryTest extends PubNubTest {

	get description () {
		return 'should be able to retrieve historical messages for a channel';
	}

	// run the test...
	run (callback) {
		// PubNubTest runs the test of sending and receiving a message, we'll
		// piggy-back on that test and fetch the history afterwards, making
		// sure the fetched message matches expectations
		BoundAsync.series(this, [
			super.run,	// run the send/receive test
			this.wait,	// wait for the message to persist
			this.fetchHistory	// fetch the message history
		], callback);
	}

	// wait for the message to persist, i've found that several seconds are necessary
	wait (callback) {
		setTimeout(callback, 5000);
	}

	// fetch the history for this channel, we expect the one message we sent
	fetchHistory (callback) {
		this.pubnubForClients[0].history(
			this.channelName,
			(error, messages) => {
				if (error) { return callback(error); }
				Assert(messages.length === 1, 'did not get 1 message');
				Assert(messages[0] === this.message, 'message from history doesn\'t match');
				callback();
			}
		);
	}
}

module.exports = HistoryTest;
