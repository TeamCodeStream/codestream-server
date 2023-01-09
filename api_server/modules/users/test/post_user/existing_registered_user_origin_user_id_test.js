'use strict';

const ExistingRegisteredUserTest = require('./existing_registered_user_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ExistingRegisteredUserOriginUserIdTest extends ExistingRegisteredUserTest {

	get description () {
		return 'under one-user-per-org, when inviting a user that already exists and is registered, the user\'s originUserId attributes should be set to the original existing user\'s id';
	}

	run (callback) {
		BoundAsync.series(this, [
			super.run,
			this.acceptInviteAndLogin,
			this.validateOriginUserId
		], callback);
	}

	validateOriginUserId (callback) {
		const { user } = this.loginToCompanyResponse;
		Assert.strictEqual(user.originUserId, this.existingUserData.user.id, 'originUserId not set to existing user ID');
		Assert.strictEqual(user.copiedFromUserId, this.existingUserData.user.id, 'copiedFromUserId not set to existing user ID');
		callback();
	}
}

module.exports = ExistingRegisteredUserOriginUserIdTest;
