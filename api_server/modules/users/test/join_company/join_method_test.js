'use strict';

const JoinCompanyLoginTest = require('./join_company_login_test');
const Assert = require('assert');

class JoinMethodTest extends JoinCompanyLoginTest {

	get description () {
		return 'the user\'s joinMethod attribute should be set to Added to Team when a user accepts an invite to a team';
	}

	validateResponse (data) {
		const originTeamId = this.originTeam ? this.originTeam.id : this.team.id;
		Assert(data.user.joinMethod === 'Added to Team', 'joinMethod not properly set');
		Assert(data.user.primaryReferral === 'internal', 'primaryReferral not set to internal');
		Assert(data.user.originTeamId === originTeamId, 'originTeamId not set to correct team');
		super.validateResponse(data);
	}
}

module.exports = JoinMethodTest;
