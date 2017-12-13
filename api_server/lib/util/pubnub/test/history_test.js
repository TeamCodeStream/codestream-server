'use strict';

var PubNubTest = require('./pubnub_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');

class HistoryTest extends PubNubTest {

	get description () {
		return 'should be able to retrieve historical messages for a channel';
	}

	run (callback) {
		BoundAsync.series(this, [
			super.run,
			this.wait,
			this.fetchHistory
		], callback);
	}

	wait (callback) {
		setTimeout(callback, 10000);
	}

	fetchHistory (callback) {
		this.pubnubForClient.history(
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
