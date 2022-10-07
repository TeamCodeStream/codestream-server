'use strict';

const PostUserTest = require('./post_user_test');
const Assert = require('assert');

class ExistingRegisteredUserTest extends PostUserTest {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
		this.existingUserIsRegistered = true;
	}

	get description () {
		return 'should return the user when inviting a user that already exists and is registered';
	}

	// validate the response to the test request
	validateResponse (data) {
		const user = data.user;
		if (!this.oneUserPerOrg) {
			// verify join method and associated analytics attributes
			const originTeamId = this.originTeam ? this.originTeam.id : this.team.id;
			Assert(user.joinMethod === 'Added to Team', 'join method not set to "Added to Team"');
			Assert(user.primaryReferral === 'internal', 'primary referral not set to "internal"');
			Assert(user.originTeamId === originTeamId, 'origin team ID not set to correct team');
		} else {
			Assert(user.id !== this.existingUserData.user.id, 'user returned should be different than invited user, under one-user-per-org');
			Assert(!user.isRegistered, 'invited user should not be registered, under one-user-per-org');
		}
		super.validateResponse(data);
	}
}

module.exports = ExistingRegisteredUserTest;
