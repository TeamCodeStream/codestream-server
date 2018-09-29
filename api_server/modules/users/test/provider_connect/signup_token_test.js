'use strict';

const ProviderConnectTest = require('./provider_connect_test');
const Assert = require('assert');

class SignupTokenTest extends ProviderConnectTest {

	get description () {
		return `after signing ${this.provider}, with a signup token supplied, should be able to login using only that signup token`;
	}

	run (callback) {
		// run the usual test, but afterwards try to login using the signup token we provided
		super.run(error => {
			if (error) { return callback(error); }
			this.login(callback);
		});
	}

	login (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/check-signup',
				data: {
					token: this.data.signupToken
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert.equal(response.user._id, this.returnedUser._id, 'user returned by check-signup does not match user created by provider-connect');
				callback();
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// save the returned user for later validation
		this.returnedUser = data.user;
		super.validateResponse(data);
	}
}

module.exports = SignupTokenTest;
