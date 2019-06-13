'use strict';

const InviteCodeTest = require('./invite_code_test');

class InviteCodeExpiredTest extends InviteCodeTest {

	constructor (options) {
		super(options);
		this.inviteCodeExpiresIn = 1000;
	}

	get description () {
		return 'should return an error when trying to register with an expired invite code';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1005'
		};
	}

	// before the test runs...
	before (callback) {
		// let the invite code expire...
		super.before(error => {
			if (error) { return callback(error); }
			setTimeout(callback, 2000);
		});
	}
}

module.exports = InviteCodeExpiredTest;
