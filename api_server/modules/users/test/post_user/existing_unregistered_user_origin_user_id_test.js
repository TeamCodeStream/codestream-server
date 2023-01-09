'use strict';

const ExistingUnregisteredUserTest = require('./existing_unregistered_user_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ExistingUnregisteredUserOriginUserIdTest extends ExistingUnregisteredUserTest {

	get description () {
		return 'under one-user-per-org, when inviting a user that already exists but is unregistered, the user\'s originUserId attributes should be set to its id';
	}

	run (callback) {
		BoundAsync.series(this, [
			super.run,
			this.registerAndConfirmUser,
			this.validateOriginUserId
		], callback);
	}

	validateOriginUserId (callback) {
		const { user } = this.confirmResponse;
		Assert.strictEqual(user.originUserId, user.id, 'originUserId not set to user.id');
		Assert(user.copiedFromUserId === undefined, 'copiedFromUserId should not be defined');
		callback();
	}
}

module.exports = ExistingUnregisteredUserOriginUserIdTest;
