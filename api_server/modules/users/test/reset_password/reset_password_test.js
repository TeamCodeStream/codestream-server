'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');
const RandomString = require('randomstring');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class ResetPasswordTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		return 'should set a new password hash when the user resets their password, and return a new access token';
	}

	get method () {
		return 'put';
	}

	get path () {
		// when dontLoginToVerify is specified, we're not doing a login to verify
		// the passowrd hash was correctly written; in this case the test itself
		// is just changing the password
		return this.dontLoginToVerify ? '/no-auth/reset-password' : '/no-auth/login';
	}

	getExpectedFields () {
		// when dontLoginToVerify is specified, we're not doing a login to verify
		// the password hash was correctly written; instead, verify that we get an 
		// access token in the response
		if (this.dontLoginToVerify) {
			return ['accessToken'];
		}
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.forgotPassword,    // issue the forgot-password request to get the token
			this.setData,	    // set the data to use when resetting password
			this.resetPassword	// reset the password using previously set data
		], callback);
	}
    
	// issue the forgot-password test to get the token
	forgotPassword (callback) {
		const data = {
			email: this.useEmail || this.currentUser.user.email,
			expiresIn: this.expiresIn,
			_confirmationCheat: SecretsConfig.confirmationCheat,	// gives us the token in the response
		};
		// issue a forgot-password request, with a secret to allow use to receive the token
		// in the response, rather than having to go through email
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/forgot-password',
				data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.rstToken = response.token;
				callback();
			}
		);
	}
    
	// set the data to use when resetting password
	setData (callback) {
		this.passwordData = { 
			token: this.rstToken,
			password: RandomString.generate(12)
		};
		callback();
	}

	// reset the password with a request to the server
	resetPassword (callback) {
		if (this.dontLoginToVerify) {
			// the test will be resetting the password itself, not verifying with a login
			// so don't do anything here
			this.data = this.passwordData;
			return callback();
		}
		else {
			// this is the data we'll use for the /no-auth/login request, to confirm the
			// password took
			this.data = {
				email: this.currentUser.user.email,
				password: this.passwordData.password
			};
		}
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/reset-password',
				data: this.passwordData,
				token: this.rstToken
			},
			callback
		);
	}
}

module.exports = ResetPasswordTest;
