'use strict';

const AuthenticationTest = require('../authentication_test');
const Assert = require('assert');

class ServiceGatewayCSUserIdTest extends AuthenticationTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 2;
	}

	get description () {
		return 'should accept Service Gateway header identifying CodeStream user, when enabled';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }

			// delete the token to pass with the test request
			delete this.token;

			// and instead set Service Gateway header
			this.apiRequestOptions = this.apiRequestOptions || {};
			this.apiRequestOptions.headers = this.apiRequestOptions.headers || {};
			this.apiRequestOptions.headers['Service-Gateway-CS-User-Id'] = this.users[1].user.id;
			
			// enable support for accepting Service Gateway headers
			this.doApiRequest(
				{
					method: 'post',
					path: '/no-auth/enable-sg',
					data: {
						enable: true,
						_subscriptionCheat: this.apiConfig.sharedSecrets.subscriptionCheat
					}
				},
				callback
			);
		});
	}

	after (callback) {
		// disable accepting Service Gateway headers
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/enable-sg',
				data: {
					enable: false,
					_subscriptionCheat: this.apiConfig.sharedSecrets.subscriptionCheat
				}
			},
			error => {
				if (error) { return callback(error); }
				super.after(callback);
			}
		);
	}

	validateResponse (data) {
		Assert.strictEqual(data.user.id, this.users[1].user.id, '/users/me did not fetch the correct user');
	}
}

module.exports = ServiceGatewayCSUserIdTest;
