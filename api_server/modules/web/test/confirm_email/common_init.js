// base class for many tests of the "GET /confirm-email" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		this.setOptions();
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.changeEmail,	// issue the change-email request to get the token
			this.setPath		// set the path to use when confirming
		], callback);
	}
	
	setOptions () {
		this.userOptions.numRegistered = 1;
	}

	// issue the change-email test to get the token
	changeEmail (callback) {
		this.newEmail = this.useEmail || this.userFactory.randomEmail();
		const data = {
			email: this.newEmail,
			expiresIn: this.expiresIn,
			_confirmationCheat: this.apiConfig.sharedSecrets.confirmationCheat,	// gives us the token in the response
		};

		// issue a change-email request, with a secret to allow use to receive the token
		// in the response, rather than having to go through email
		this.doApiRequest(
			{
				method: 'put',
				path: '/change-email',
				data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.emailToken = response.confirmationToken;
				callback();
			}
		);
	}
    
	// set the path to use when confirming 
	setPath (callback) {
		this.path = `/web/confirm-email?t=${this.emailToken}`;
		callback();
	}
}

module.exports = CommonInit;
