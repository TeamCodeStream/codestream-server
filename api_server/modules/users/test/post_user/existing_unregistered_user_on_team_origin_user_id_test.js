'use strict';

const ExistingUnregisteredUserOnTeamTest = require('./existing_unregistered_user_on_team_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ExistingUnregisteredUserOnTeamOriginUserIdTest extends ExistingUnregisteredUserOnTeamTest {

	get description () {
		return 'under one-user-per-org, when inviting a user that already exists but is unregistered and has been invited to a team, the user\'s originUserId attributes should be set to the original existing user\'s id';
	}

	run (callback) {
		BoundAsync.series(this, [
			super.run,
			this.registerAndConfirmUser,
			this.acceptInviteAndLogin,
			this.validateOriginUserId
		], callback);
	}

	validateOriginUserId (callback) {
		const { user } = this.loginToCompanyResponse;
		Assert.strictEqual(user.originUserId, this.existingUserData.user.id, 'originUserId not set to original existing user ID');
		Assert.strictEqual(user.copiedFromUserId, this.existingUserData.user.id, 'copiedFromUserId not set to existing user ID');
		callback();
	}
}

module.exports = ExistingUnregisteredUserOnTeamOriginUserIdTest;
