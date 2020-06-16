'use strict';

const InviteCodeTest = require('./invite_code_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class InviteCodeRemovedAfterUseTest extends InviteCodeTest {

	get description () {
		return 'should no longer allow a registration with an invite code if the invited user has already accepted the invite';
	}

	// run the test...
	run (callback) {
		// when running the test, run the regular invite code test,
		// and then try to use the invite code, which should fail
		BoundAsync.series(this, [
			super.run,
			this.getInviteInfo
		], callback);
	}

	// attempt to get invite info assocated with the invite code, the invite code should 
	// have been invalidated when the user accepted the invite, so we should get an error
	getInviteInfo (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/no-auth/invite-info?code=' + this.data.inviteCode
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

module.exports = InviteCodeRemovedAfterUseTest;
