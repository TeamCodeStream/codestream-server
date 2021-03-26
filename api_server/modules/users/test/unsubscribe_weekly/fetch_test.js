'use strict';

const UnsubscribeTest = require('./unsubscribe_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class FetchTest extends UnsubscribeTest {

	get description () {
		return 'should properly turn off weekly emails when requested by clicking an email link, checked by fetching the user';
	}

	run (callback) {
		// run the main test, then fetch the user afterwards
		BoundAsync.series(this, [
			super.run,
			this.fetchUser
		], callback);
	}

	// fetch the user, and verify it has weekly emails turned off in preferences
	fetchUser (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/preferences',
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert.deepStrictEqual(response.preferences, this.expectedPreferences, 'fetched preferences are not correct');
				callback();
			}
		);
	}
}

module.exports = FetchTest;
