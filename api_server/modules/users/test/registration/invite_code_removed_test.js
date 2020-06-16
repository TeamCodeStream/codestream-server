'use strict';

const InviteCodeTest = require('./invite_code_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const UserTestConstants = require('../user_test_constants');
const Assert = require('assert');

class InviteCodeRemovedTest extends InviteCodeTest {

	get description () {
		return 'should no longer allow a registration with an invite code if the invited user has confirmed registration without using the invite code';
	}

	getExpectedFields () {
		return UserTestConstants.EXPECTED_REGISTRATION_RESPONSE;
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// delete the invite code from the data provided during registration
			this.inviteCode = this.data.inviteCode;
			delete this.data.inviteCode;
			callback();
		});
	}

	// run the test...
	run (callback) {
		// when running the test, run the regular invite code test, but with the invite code
		// not in the registration data, we'll need to confirm the user, then try to get
		// invite info assocated with the invite code, which should fail
		BoundAsync.series(this, [
			super.run,
			this.confirmUser,
			this.getInviteInfo
		], callback);
	}

	// confirm the user previously invited and registered
	confirmUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/confirm',
				data: {
					email: this.data.email,
					confirmationCode: this.confirmationCode
				}
			},
			callback
		);
	}

	// attempt to get invite info assocated with the invite code, the invite code
	// should have been invalidated when the user confirmed, so we should get an error
	getInviteInfo (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/no-auth/invite-info?code=' + this.inviteCode
			},
			(error, response) => {
				Assert(error, 'should have gotten an error response');
				Assert.equal(response.code, 'AUTH-1003', 'incorrect error code');
				callback();
			}
		);
	}

	validateResponse (data) {
		this.confirmationCode = data.user.confirmationCode;
	}
}

module.exports = InviteCodeRemovedTest;
