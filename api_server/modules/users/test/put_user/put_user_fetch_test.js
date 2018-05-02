'use strict';

const PutUserTest = require('./put_user_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');
const UserTestConstants = require('../user_test_constants');

class PutUserFetchTest extends PutUserTest {

	get description () {
		return 'should properly update a user when requested, checked by fetching the user';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { user: UserTestConstants.EXPECTED_USER_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.updateUser	// perform the actual update
		], callback);
	}

	// perform the actual user update 
	// the actual test is reading the user and verifying it is correct
	updateUser (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/users/me',
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				Object.assign(this.expectedUser, response.user, this.data);
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}

	// validate that the response is correct
	validateResponse (data) {
		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.user, this.expectedUser, 'fetched user does not match');
	}
}

module.exports = PutUserFetchTest;
