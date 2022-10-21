'use strict';

const ConfirmationTest = require('./confirmation_test');
const Assert = require('assert');

class JoinMethodTest extends ConfirmationTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 2;
		Object.assign(this.teamOptions, {
			creatorIndex: 1,
			numAdditionalInvites: 2
		});
	}

	get description () {
		return 'the user\'s joinMethod attribute should get updated to Added to Team when a user confirms registration and they are already on a team';
	}

	getUserData () {
		const data = this.userFactory.getRandomUserData();
		data.email = this.users[3].user.email;
		return data;
	}
			
	// validate the response to the test request
	validateResponse (data) {
		// validate that the joinMethod has been set to "Added to Team"
		const originTeamId = this.originTeam ? this.originTeam.id : this.team.id;
		if (this.oneUserPerOrg) {
			console.log('NOTE: under one-user-per-org, joinMethod is not set on confirmation, this test can probably be retired');
		} else {
			Assert(data.user.joinMethod === 'Added to Team', 'joinMethod not properly set');
			Assert(data.user.primaryReferral === 'internal', 'primaryReferral not set to internal');
			Assert(data.user.originTeamId === originTeamId, 'originTeamId not set to correct team');
		}
		super.validateResponse(data);
	}
}

module.exports = JoinMethodTest;
