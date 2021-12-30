'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const LoginByCodeTest = require('./login_by_code_test');

class TooManyAttemptsTest extends LoginByCodeTest {

	get description () {
		return 'should return an error when code has been attempted too many times';
	}

	getExpectedError () {
		return {
			code: 'USRC-1029'
		};
	}

	before (callback) {
		// try a wrong code three times, since that's the limit
		BoundAsync.series(this, [
			super.before,
			this.attemptFailedLogin,
			this.attemptFailedLogin,
			this.attemptFailedLogin
		], callback);
	}

	attemptFailedLogin (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/login-by-code',
				data: {
					email: this.currentUser.user.email,
					loginCode: '000000'
				}
			},
			() => {
				callback();
			}
		);
	}
}

module.exports = TooManyAttemptsTest;
