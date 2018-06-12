'use strict';

const CheckResetTest = require('./check_reset_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class TokenDeprecatedTest extends CheckResetTest {

	get description () {
		return 'should return an error when sending a check reset request with a token that has been deprecated by a more recent token';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1002'
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.wait,
			this.generateSubsequentToken
		], callback);
	}

	// generate a subsequent token to the one we already generated, this 
	// should deprecate the previous token
	generateSubsequentToken  (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/forgot-password',
				data: { email: this.currentUser.email }
			},
			callback
		);
	}

	// wait a few seconds, since the expiration is only valid to a second
	wait (callback) {
		setTimeout(callback,  2000);
	}
}

module.exports = TokenDeprecatedTest;
