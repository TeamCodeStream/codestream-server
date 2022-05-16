'use strict';

const AuthenticationTest = require('../authentication_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class ServiceGatewayNRUserIdTest extends AuthenticationTest {

	get description () {
		return 'should accept Service Gateway header identifying New Relic user, when enabled';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.registerNrUser,
			this.enableServiceGateway
		], callback);
	}

	registerNrUser (callback) {
		// do a mock New Relic registration, identifying our user #1 as the NR user
		this.nrUserId = Math.floor(Math.random() * 1000000000);
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/nr-register',
				data: {
					apiKey: 'dummy',
				},
				requestOptions: {
					headers: {
						'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
						'X-CS-Mock-Email': this.userFactory.randomEmail(),
						'X-CS-Mock-Id': this.nrUserId,
						'X-CS-Mock-Name': this.userFactory.randomFullName()
					}
				}
			},
			(error, userData) => {
				if (error) { return callback(error); }
				this.createdUser = userData.user;
				callback();
			}
		);
	}
	
	enableServiceGateway (callback) {
		// delete the token to pass with the test request
		delete this.token;

		// and instead set Service Gateway header
		this.apiRequestOptions = this.apiRequestOptions || {};
		this.apiRequestOptions.headers = this.apiRequestOptions.headers || {};
		this.apiRequestOptions.headers['Service-Gateway-User-Id'] = this.nrUserId;
		
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
		Assert.strictEqual(data.user.id, this.createdUser.id, '/users/me did not fetch the correct user');
	}
}

module.exports = ServiceGatewayNRUserIdTest;
