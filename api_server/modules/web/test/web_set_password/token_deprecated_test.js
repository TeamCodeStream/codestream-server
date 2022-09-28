'use strict';

const SetPasswordTest = require('./set_password_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class TokenDeprecatedTest extends SetPasswordTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 2;
	}

	get description () {
		return 'should redirect to an error page when requesting a set password page with a token that has been deprecated by a more recent token';
	}

	// before the test runs...
	before (callback) {
		this.apiRequestOptions = {
			expectRedirect: true,
			noJsonInResponse: true
		};
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
				data: { email: this.currentUser.user.email }
			},
			callback
		);
	}

	// wait a few seconds, since the expiration is only valid to a second
	wait (callback) {
		setTimeout(callback,  2000);
	}

	validateResponse (data) {
		Assert.strictEqual(data, '/web/user/password/reset/invalid', 'incorrect redirect');
	}
}

module.exports = TokenDeprecatedTest;
