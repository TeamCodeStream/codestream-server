'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

class SetPasswordTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		delete this.teamOptions.creatorIndex;
		this.apiRequestOptions = {
			expectRedirect: true,
			noJsonInResponse: true
		};
	}

	get description () {
		return 'should redirect to the password updated page when setting a password at the end of the reset password flow';
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
			this.sendForgotPassword
		], callback);
	}

	sendForgotPassword (callback) {
		const data = {
			email: this.useEmail || this.users[0].user.email,
			expiresIn: this.expiresIn,
			_confirmationCheat: this.apiConfig.sharedSecrets.confirmationCheat,	// gives us the token in the response
		};
		// issue a forgot-password request, with a secret to allow use to receive the token
		// in the response, rather than having to go through email
		this.newPassword = RandomString.generate(12);
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/forgot-password',
				data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.data = {
					token: response.token,
					password: this.newPassword
				}
				callback();
			}
		);
	}
    
	// validate the response to the test request
	validateResponse (data) {
		Assert.strictEqual(data, `/web/user/password/updated?email=${encodeURIComponent(this.users[0].user.email)}`);
	}
}

module.exports = SetPasswordTest;
