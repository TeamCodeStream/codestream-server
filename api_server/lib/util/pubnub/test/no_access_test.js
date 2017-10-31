'use strict';

var PubNub_Test = require('./pubnub_test');
var Assert = require('assert');

class No_Access_Test extends PubNub_Test {

	get description () {
		return 'client should get an error when trying to subscribe to a channel it has not been granted read access to';
	}

	grant_access (callback) {
		// skip it
		callback();
	}

	run (callback) {
		this.listen_on_client(error => {
			Assert(error.error, 'error expected');
			Assert(error.operation === 'PNSubscribeOperation', 'operation expected to be PNSubscribeOperation');
			Assert(error.category === 'PNAccessDeniedCategory', 'category expected to be PNAccessDeniedCategory');
			this.clear_timer(callback);
		});
	}
}

module.exports = No_Access_Test;
