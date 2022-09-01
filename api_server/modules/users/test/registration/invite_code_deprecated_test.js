'use strict';

const RegistrationTest = require('./registration_test');
const UUID = require('uuid').v4;

class InviteCodeDeprecatedTest extends RegistrationTest {

	get description () {
		return 'should return an error indicating functionality is deprecated when registering a user with an invite code';
	}

	getExpectedError() {
		return {
			code: 'RAPI-1016',
			reason: 'invite codes are deprecated'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.inviteCode = UUID();
			callback();
		})
	}
}

module.exports = InviteCodeDeprecatedTest;
