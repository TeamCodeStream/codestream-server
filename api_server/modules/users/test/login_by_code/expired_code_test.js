'use strict';

const LoginByCodeTest = require('./login_by_code_test');

class ExpiredCodeTest extends LoginByCodeTest {

	get description () {
		return 'should return an error when using an expired code';
	}

	getExpectedError () {
		return {
			code: 'USRC-1028'
		};
	}

	generateLoginCode (callback) {
		this.beforeLogin = Date.now();
		// ensure we have a login code generated to test
		const data = {
			email: this.currentUser.user.email,
			// TODO: use more appropriate secret
			_loginCheat: this.apiConfig.sharedSecrets.confirmationCheat,
			expiresIn: 5	// set the code to expire very quickly
		};
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/generate-login-code',
				data: data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.data = {
					email: this.currentUser.user.email,
					loginCode: response.loginCode
				};
				callback();
			}
		);
	}
}

module.exports = ExpiredCodeTest;
