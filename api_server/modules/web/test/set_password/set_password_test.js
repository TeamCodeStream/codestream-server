'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const RandomString = require('randomstring');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Secrets = require(process.env.CS_API_TOP + '/config/secrets');
const Assert = require('assert');

class SetPasswordTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.apiRequestOptions = { 
			expectRedirect: true,
			noJsonInResponse: true
		};
	}

	get description () {
		return 'should set a new password hash when the user changes their password, and return a new access token';
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/web/user/password';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.forgotPassword	// issue a forgot-password request
		], callback);
	}

	// issue a forgot-password request, with a cheat code this gives us the token that
	// would ordinarily be sent in an email
	forgotPassword (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/forgot-password',
				data: {
					email: this.currentUser.user.email,
					expiresIn: this.tokenExpiresIn,
					_confirmationCheat: Secrets.confirmationCheat
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.data = {
					token: response.token,
					password: RandomString.generate(10)
				};
				callback();
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.equal(data, '/web/user/password/updated', 'redirect url after set password is not correct');
	}
}

module.exports = SetPasswordTest;
