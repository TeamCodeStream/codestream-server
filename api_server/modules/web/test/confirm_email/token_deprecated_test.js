'use strict';

const ConfirmEmailTest = require('./confirm_email_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class TokenDeprecatedTest extends ConfirmEmailTest {

	get description () {
		return 'should redirect to an error page when sending a confirm change of email request with a token that has been deprecated by a more recent token';
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
				path: '/change-email',
				data: { email: this.userFactory.randomEmail() },
				token: this.token
			},
			callback
		);
	}

	// wait a few seconds, since the expiration is only valid to a second
	wait (callback) {
		setTimeout(callback,  2000);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.equal(data, '/web/confirm-email-error?error=AUTH-1002', 'improper redirect');
	}
}

module.exports = TokenDeprecatedTest;
