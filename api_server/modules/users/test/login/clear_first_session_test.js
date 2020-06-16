'use strict';

const LoginTest = require('./login_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class ClearFirstSessionTest extends LoginTest {

	get description () {
		return 'firstSession should be set to 0 on second login';
	}

	run (callback) {
		BoundAsync.series(this, [
			super.run,
			this.doSecondLogin
		], callback);
	}

	doSecondLogin (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/login',
				data: {
					email: this.data.email,
					password: this.data.password
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert(response.user.firstSessionStartedAt === 0, 'firstSession was not set to 0');
				callback();
			}
		);
	}
}

module.exports = ClearFirstSessionTest;
