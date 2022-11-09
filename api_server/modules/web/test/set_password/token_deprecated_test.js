'use strict';

const ErrorTest = require('./error_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class TokenDeprecatedTest extends ErrorTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 2;
	}

	get description () {
		return 'should redirect to an error page when setting a password with a token that has been deprecated by a more recent token';
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
				data: { email: this.currentUser.user.email }
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
