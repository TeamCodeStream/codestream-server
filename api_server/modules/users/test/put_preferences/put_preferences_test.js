// provide a base class for most tests of the "PUT /preferences" request

'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Assert = require('assert');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class PutPreferencesTest extends CodeStreamAPITest {

	get description () {
		return 'should set a simple preference when requested';
	}

	get method () {
		return 'get';
	}

	get path () {
		return '/users/me';	// we'll actually validate by retrieving the me object
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.preSetPreferences,	// pre-set some preferences...
			this.setPreferences		// ...and then establish the preferences change that will constitute the test
		], callback);
	}

	// preset preferences ... override for specific tests
	preSetPreferences (callback) {
		return callback();
	}

	// set the preferences for the test ... the actual running of the test consists
	// of reading these preferences back and verifying they are what we expect
	setPreferences (callback) {
		let data = this.makePreferencesData();
		this.putPreferences(data, callback);
	}

	// do the server request to write out the user's preferences
	putPreferences (data, callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/preferences',
				data: data,
				token: this.token
			},
			callback
		);
	}

	// make the preferences data that will be used to match when the preferences
	// are retrieved to verify the preferences change was successful
	makePreferencesData () {
		// doing a simple preference update
		this.expectPreferences = {
			simplePreference: true
		};
		return this.expectPreferences;
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we got back the expected preferences with the user's user object
		Assert.deepEqual(data.user.preferences, this.expectPreferences);
	}
}

module.exports = PutPreferencesTest;
