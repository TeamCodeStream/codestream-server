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
		// verify join method and associated analytics attributes
		const user = data.user;
		const originTeamId = this.originTeam ? this.originTeam.id : this.team.id;
		Assert(user.joinMethod === 'Added to Team', 'join method not set to "Added to Team"');
		Assert(user.primaryReferral === 'internal', 'primary referral not set to "internal"');
		Assert(user.originTeamId === originTeamId, 'origin team ID not set to correct team');
		super.validateResponse(data);
	}
}

module.exports = ExistingRegisteredUserTest;
