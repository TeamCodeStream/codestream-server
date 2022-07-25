'use strict';

const GetBCastTokenTest = require('./get_bcast_token_test');
const Assert = require('assert');

class GetBCastTokenWithTeamTest extends GetBCastTokenTest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 0;  // create a team for this user, which changes their token
	}

	get description () {
		return 'should return the user\'s V3 broadcaster token when requested, if the user has created a team and logged in';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.login(callback);
		})
	}

	// do a login request to get the existing token
	login (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/login',
				data: {
					email: this.currentUser.user.email,
					password: this.currentUser.password
				}
			}, (error, response) => {
				if (error) { return callback(error); }
				this.existingToken = response.broadcasterV3Token;
				callback();
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.strictEqual(data.token, this.existingToken, 'returned token is not correct');
	}
}

module.exports = GetBCastTokenWithTeamTest;
