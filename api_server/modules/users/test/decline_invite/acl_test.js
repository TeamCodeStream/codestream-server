'use strict';

const DeclineInviteTest = require('./decline_invite_test');

class ACLTest extends DeclineInviteTest {

	get description () {
		return 'should return an error when a user tries to decline an invite from a company that they have not been invited to';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	setTestOptions (callback) {
		this.dontInvite = true;
		super.setTestOptions(callback);
	}
}

module.exports = ACLTest;
