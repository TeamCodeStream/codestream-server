'use strict';

const ConfirmationWithLinkTest = require('./confirmation_with_link_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

class TokenDeprecatedTest extends ConfirmationWithLinkTest {

	get description () {
		return 'should return an error when confirming with a token that has been deprecated by a more recent token';
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

	// wait a few seconds, since the expiration is only valid to a second
	wait (callback) {
		setTimeout(callback, 2000);
	}

	// generate a subsequent token to the one we already generated, this 
	// should deprecate the previous token
	generateSubsequentToken  (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/register',
				data: { 
					email: this.data.email,
					username: RandomString.generate(8),
					password: RandomString.generate(10),
					wantLink: true
				}
			},
			callback
		);
	}
}

module.exports = TokenDeprecatedTest;
