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

// make eslint happy
/* globals describe */

describe('pubnub', function() {

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
