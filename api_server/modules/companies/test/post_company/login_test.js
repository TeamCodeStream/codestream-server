'use strict';

const PostCompanyTest = require('./post_company_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class LoginTest extends PostCompanyTest {

	get description () {
		return 'should be able to login using the returned access token after creating a company under one-user-per-org';
	}

	run (callback) {
		BoundAsync.series(this, [
			super.run,
			this.doLogin
		], callback);
	}

	doLogin (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/login',
				token: this.responseData.accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert.strictEqual(response.teams[0].id, this.responseData.teamId, 'team ID in response not equal to originally obtained teamId');
				Assert.strictEqual(response.user.id, this.responseData.userId, 'user ID in response not equal to originally obtained userId');
				Assert.strictEqual(response.user.joinMethod, 'Created Team', 'joinMethod not properly set, should be Created Team');
				callback();
			}
		);
	}
}

module.exports = LoginTest;
