// handle unit tests for the "PUT /presence" request for a user to announce 
// their online/away status

'use strict';

const PresenceDeprecatedTest = require('./presence_deprecated_test');
//const PresenceTest = require('./presence_test');
//const MultiPresenceTest = require('./multi_presence_test');
//const RequiredParameterTest = require('./required_parameter_test');
//const StalePresenceRemovalTest = require('./stale_presence_removal_test');
//const AwayTimeoutResponseTest = require('./away_timeout_response_test');

class PresenceRequestTester {

	test () {
		new PresenceDeprecatedTest().test();
		//new PresenceTest().test();
		//new MultiPresenceTest().test();
		//new RequiredParameterTest({ parameter: 'sessionId' }).test();
		//new RequiredParameterTest({ parameter: 'status' }).test();
		//new StalePresenceRemovalTest().test();
		//new AwayTimeoutResponseTest().test();
	}
}

module.exports = new PresenceRequestTester();
