// can remove this test when we have fully moved to ONE_USER_PER_ORG

'use strict';

const DeclineInviteTest = require('./decline_invite_test');

class OneUserPerOrgEnabledTest extends DeclineInviteTest {

	get description () {
		return 'should return an error when trying to decline an invite while one-user-per-org is not enabled';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1003',
			reason: 'one-user-per-org not enabled'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(error => {
			if (error) { return callback(error); }
			//this.oneUserPerOrg = false;
			callback();
		});
	}
}

module.exports = OneUserPerOrgEnabledTest;
