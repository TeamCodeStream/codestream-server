'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const ConfirmationTest = require('./confirmation_test');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class JoinMethodTest extends ConfirmationTest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.teamOptions.inviterIndex = 1;
		this.teamOptions.numAdditionalInvites = 2;
	}

	get description () {
		return 'the user\'s joinMethod attribute should get updated to Added to Team when a user confirms registration and they are already on a team';
	}

	before (callback) {
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			super.before
		], callback);
	}

	getUserData () {
		const data = this.userFactory.getRandomUserData();
		data.email = this.users[3].user.email;
		return data;
	}
			
	// validate the response to the test request
	validateResponse (data) {
		// validate that the joinMethod has been set to "Added to Team"
		const originTeamId = this.originTeam ? this.originTeam._id : this.team._id;
		Assert(data.user.joinMethod === 'Added to Team', 'joinMethod not properly set');
		Assert(data.user.primaryReferral === 'internal', 'primaryReferral not set to internal');
		Assert(data.user.originTeamId === originTeamId, 'originTeamId not set to correct team');
		super.validateResponse(data);
	}
}

module.exports = JoinMethodTest;
