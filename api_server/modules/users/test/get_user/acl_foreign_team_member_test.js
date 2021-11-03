'use strict';

const GetForeignTeamMemberTest = require('./get_foreign_team_member_test');
const RandomString = require('randomstring');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ACLForeignTeamMemberTest extends GetForeignTeamMemberTest {

	get description() {
		return 'a user who is "foreign" to a team should not be able to fetch users who are on that team';
	}

	getExpectedError() {
		return {
			code: 'RAPI-1009'
		};
	}

	// before the test runs...
	before(callback) {
		BoundAsync.series(this, [
			super.before,
			this.registerForeignUser,
			this.confirmForeignUser
		], callback);
	}

	// register the foreign user so it can try to fetch other users
	registerForeignUser (callback) {
		let data = {
			email: this.nrCommentResponse.post.creator.email,
			password: RandomString.generate(8),
			username: RandomString.generate(8),
			_confirmationCheat: this.apiConfig.sharedSecrets.confirmationCheat
		};
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/register',
				data: data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.foreignUserData = response;
				callback();
			}
		);
	}

	// confirm registration for the foreign user
	confirmForeignUser (callback) {
		const user = this.foreignUserData.user;
		let data = {
			email: user.email,
			confirmationCode: user.confirmationCode
		};
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/confirm',
				data: data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.token = response.accessToken;
				this.path = '/users/' + this.users[0].user.id;
				callback();
			}
		);
	}
}

module.exports = ACLForeignTeamMemberTest;
