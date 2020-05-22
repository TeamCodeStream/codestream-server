'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class CheckResetTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		return 'should return an email when called with a valid reset password request token';
	}

	get method () {
		return 'get';
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
			email: this.useEmail || this.currentUser.user.email,
			expiresIn: this.expiresIn,
			_confirmationCheat: this.apiConfig.secrets.confirmationCheat,	// gives us the token in the response
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
			token: this.token
		};
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.equal(this.currentUser.user.email, data.email, 'email not correct');
	}
}

module.exports = CheckResetTest;
