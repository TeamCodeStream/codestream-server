'use strict';

const PutPreferencesTest = require('./put_preferences_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class PutPreferencesFetchTest extends PutPreferencesTest {

	get description () {
		return 'should set a simple preference when requested, checked by fetching the user\'s preferences';
	}

	// run the actual test...
	run (callback) {
		// we'll run the preferences update, but also verify the update took by fetching and validating
		// the user's me object
		BoundAsync.series(this, [
			super.run,
			this.validateUserObject
		], callback);
	}

	// fetch and validate the user's me object against the preferences update we made
	validateUserObject (callback) {
		this.doApiRequest({
			method: 'get',
			path: '/users/me',
			token: this.token
		}, (error, response) => {
			if (error) { return callback(error); }
			Assert.deepEqual(response.user.preferences, this.expectPreferences);
			callback();
		});
	}
}

module.exports = PutPreferencesFetchTest;
