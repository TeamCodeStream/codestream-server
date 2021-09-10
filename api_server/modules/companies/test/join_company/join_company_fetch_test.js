'use strict';

const JoinCompanyTest = require('./join_company_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const UserTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/test/user_test_constants');

class JoinCompanyFetchTest extends JoinCompanyTest {

	get description () {
		return 'should properly update the user when joining a company, checked by fetching the user';
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
			this.doJoin	// perform the actual join
		], callback);
	}

	// validate that the response is correct
	validateResponse (data) {
		Assert(data.user.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the user was updated');
		this.expectedUser.modifiedAt = data.user.modifiedAt;
		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.user, this.expectedUser, 'fetched user does not match');
	}
}

module.exports = JoinCompanyFetchTest;
