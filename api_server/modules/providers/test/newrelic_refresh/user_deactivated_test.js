'use strict';

const NewRelicRefreshTest = require('./newrelic_refresh_test');

class UserDeactivatedTest extends NewRelicRefreshTest {

	get description () {
		return 'should return an error when attempting to refresh a New Relic access token for a user that has been deactivated';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'user'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.doApiRequest(
				{
					method: 'delete',
					path: '/users/' + this.signupResponse.user.id,
					token: this.signupResponse.accessToken,
					headers: {
						'x-delete-user-secret': this.apiConfig.sharedSecrets.confirmationCheat
					}
				},
				callback
			);
		});
	}
}

module.exports = UserDeactivatedTest;
