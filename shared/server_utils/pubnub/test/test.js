// tests of the PubNubClient class

'use strict';

const PubNubTest = require('./pubnub_test');
const NoAccessTest = require('./no_access_test');
//const RevokeAccessTest = require('./revoke_access_test');
const UnsubscribeTest = require('./unsubscribe_test');
//const HistoryTest = require('./history_test');
//const MultipleHistoryTest = require('./multiple_history_test');
const PresenceTest = require('./presence_test');
const LeaveTest = require('./leave_test');

const SocketClusterConfig = require(process.env.CS_API_TOP + '/config/socketcluster');

// make eslint happy
/* globals describe */

describe('pubnub', function() {

	if (SocketClusterConfig.port) {
		console.log('NOTE - Pubnub tests cannot pass if SocketCluster is enabled, ignoring');
		return;
	}

	this.timeout(30000);

	new PubNubTest().test();
	new NoAccessTest().test();
	// new RevokeAccessTest().test();	// Disabled pending resolution of COD-64
	new UnsubscribeTest().test();
	// new HistoryTest().test();
	// new MultipleHistoryTest().test();	// Disabled pending resolution of COD-135
	new PresenceTest().test();
	new LeaveTest().test();
});
