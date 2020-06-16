'use strict';

const InviteInfoTest = require('./invite_info_test');

class IncorrectCodeTest extends InviteInfoTest {

	get description () {
		return 'should return an error when requesting invite info whilst providing an incorrect invite code';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1003'
		};
	}

	// before the test runs...
	before (callback) {
		// delete the attribute in question
		super.before(() => {
			this.path = '/no-auth/invite-info?code=blah';
			callback();
		});
	}
}

module.exports = IncorrectCodeTest;
