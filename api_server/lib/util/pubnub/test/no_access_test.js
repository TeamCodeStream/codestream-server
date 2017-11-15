'use strict';

var PubNubTest = require('./pubnub_test');
var Assert = require('assert');

class NoAccessTest extends PubNubTest {

	get description () {
		return 'client should get an error when trying to subscribe to a channel it has not been granted read access to';
	}

	grantAccess (callback) {
		// skip it
		callback();
	}

	run (callback) {
		this.listenOnClient(error => {
			Assert(error.error, 'error expected');
			Assert(error.operation === 'PNSubscribeOperation' || error.operation === 'PNHeartbeatOperation',
				'operation expected to be PNSubscribeOperation');
			Assert(error.category === 'PNAccessDeniedCategory', 'category expected to be PNAccessDeniedCategory');
			this.clearTimer(callback);
		});
	}
}

module.exports = NoAccessTest;
