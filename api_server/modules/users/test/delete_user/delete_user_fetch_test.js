'use strict';

const DeleteUserTest = require('./delete_user_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');
const UserTestConstants = require('../user_test_constants');

class DeleteUserFetchTest extends DeleteUserTest {

	get description () {
		return 'should properly deactivate a user when deleted, checked by fetching the user';
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
			this.deleteUser	// perform the actual deletion
		], callback);
	}

	// validate that the response is correct
	validateResponse (data) {
		Assert(data.user.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the user was updated');
		this.expectedUser.modifiedAt = data.user.modifiedAt;
		this.expectedUser.email = this.message.users[0].$set.email;
		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.user, this.expectedUser, 'fetched user does not match');
	}
}

module.exports = DeleteUserFetchTest;
