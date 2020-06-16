// handle unit tests for the "GET /preferences" request 

'use strict';

var GetPreferencesTest = require('./get_preferences_test');

class GetPreferencesRequestTester {

	getPreferencesTest () {
		new GetPreferencesTest().test();
	}
}

module.exports = GetPreferencesRequestTester;
