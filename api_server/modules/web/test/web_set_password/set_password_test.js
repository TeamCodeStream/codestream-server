'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class SetPasswordTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		return 'should render the set-password page when following a reset password link issued by a forgot password request';
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
			email: this.useEmail || this.users[0].user.email,
			expiresIn: this.expiresIn,
			_confirmationCheat: this.apiConfig.sharedSecrets.confirmationCheat,	// gives us the token in the response
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
				this.path = `/web/user/password?token=${response.token}`;
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
		Assert(data.match(/<html>.*<label>?.*Password.*<\/label>?.*<\/html>/s));
	}
}

module.exports = SetPasswordTest;
