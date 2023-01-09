'use strict';

const ExistingRegisteredUserAlreadyOnTeamTest = require('./existing_registered_user_already_on_team_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ExistingRegisteredUserAlreadyOnTeamOriginUserIdTest extends ExistingRegisteredUserAlreadyOnTeamTest {

	get description () {
		return 'under one-user-per-org, when inviting a user that already exists and is registered and already on the team, the user\'s originUserId should be the same as the existing user';
	}

	run (callback) {
		BoundAsync.series(this, [
			super.run,
			this.loginToCompany,
			this.validateOriginUserId
		], callback);
	}

	validateOriginUserId (callback) {
		const { user } = this.loginToCompanyResponse;
		Assert.strictEqual(user.originUserId, this.existingUserData.user.originUserId, 'originUserId not set to original existing user\'s original user ID');
		Assert.strictEqual(user.copiedFromUserId, this.existingUserData.user.copiedFromUserId, 'copiedFromUserId not set to existing user\'s original user ID');
		callback();
	}
}

module.exports = ExistingRegisteredUserAlreadyOnTeamOriginUserIdTest;
