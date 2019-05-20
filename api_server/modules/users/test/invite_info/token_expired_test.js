'use strict';

const InviteInfoTest = require('./invite_info_test');

class TokenExpiredTest extends InviteInfoTest {

	get description () {
		return 'should return an error when requesting invite info with an expired invite code';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1005'
		};
	}

	getInviteUserData () {
		const data = super.getInviteUserData();
		data._inviteCodeExpiresIn = 1000;
		return data;
	}

	run (callback) {
		setTimeout(() => {
			super.run(callback);
		}, 2000);
	}
}

module.exports = TokenExpiredTest;
