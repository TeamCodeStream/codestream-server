'use strict';

const ExistingRegisteredUserOnTeamTest = require('./existing_registered_user_on_team_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ExistingRegisteredUserOnTeamOriginUserIdTest extends ExistingRegisteredUserOnTeamTest {

	get description () {
		return 'under one-user-per-org, when inviting a user that already exists and is registered and already on a team, the user\'s originUserId attributes should be set to the original existing user\'s id';
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
		Assert.strictEqual(user.originUserId, this.existingUserData.user.originUserId, 'originUserId not set to existing user\'s original user ID');
		Assert.strictEqual(user.copiedFromUserId, this.existingUserData.user.id, 'copiedFromUserId not set to existing user ID');
		callback();
	}
}

module.exports = ExistingRegisteredUserOnTeamOriginUserIdTest;
