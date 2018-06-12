'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');
const Assert = require('assert');

class CheckResetTest extends CodeStreamAPITest {

	get description () {
		return 'should return an email when called with a valid reset password request token';
	}

	get method () {
		return 'get';
	}

	// before the test runs...
	before (callback) {
		const data = {
			email: this.useEmail || this.currentUser.email,
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
				this.token = response.token;
				const queryData = this.makeQueryData();
				const queryString = Object.keys(queryData)
					.map(key => `${key}=${queryData[key]}`)
					.join('&');
				this.path = '/no-auth/check-reset?' + queryString;
				callback();
			}
		);
	}
    
	// make the query data for the path part of the test request
	makeQueryData () {
		return { 
			t: this.token
		};
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.equal(this.currentUser.email, data.email, 'email not correct');
	}
}

module.exports = CheckResetTest;
