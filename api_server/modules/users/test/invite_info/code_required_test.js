'use strict';

const InviteInfoTest = require('./invite_info_test');

class CodeRequiredTest extends InviteInfoTest {

	get description () {
		return 'should return an error when requesting invite info without providing an invite code';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'code'
		};
	}

	// before the test runs...
	before (callback) {
		// delete the attribute in question
		super.before(() => {
			this.path = '/no-auth/invite-info';
			callback();
		});
	}
}

module.exports = CodeRequiredTest;
