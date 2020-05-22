'use strict';

var PubNubTest = require('./pubnub_test');
var Assert = require('assert');

class NoAccessTest extends PubNubTest {

	get description () {
		return 'client should get an error when trying to subscribe to a channel it has not been granted read access to';
	}

	// override PubNubTest's grant by skipping the grant entirely
	grantAccess (callback) {
		callback();
	}

	// run the test
	run (callback) {
		if (this.config.whichBroadcastEngine !== 'pubnub') {
			return callback();
		}
		// our attempt to listen should get rejected
		this.listenOnClient(error => {
			Assert(error.error, 'error expected');
			Assert(error.operation === 'PNSubscribeOperation' || error.operation === 'PNHeartbeatOperation',
				'operation expected to be PNSubscribeOperation');
			Assert(error.category === 'PNAccessDeniedCategory', 'category expected to be PNAccessDeniedCategory');
			this.clearTimer(callback);	// turn off listening for the actual message, we won't get it!
		});
	}
}

module.exports = NoAccessTest;
