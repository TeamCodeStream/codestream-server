'use strict';

const LoginTest = require('./login_test');
const RandomString = require('randomstring');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class NoPasswordTest extends LoginTest {

	get description () {
		return 'should return an error if a user with no password tries to login';
	}

	getExpectedError () {
		return {
			code: 'USRC-1001'
		};
	}

	// before the test runs...
	before (callback) {
		// the only way a user doesn't have a password is if they get invited,
		// so create a registered user, have them create a team, then have them
		// invite the test user before they try to login for the test
		BoundAsync.series(this, [
			this.createOtherUser,	// create a registered user
			this.createTeam,		// create a team
			this.inviteUser			// invite the test user, creating the user record with no password
		], callback);
	}

	// create a registered user, who will create a team and then invite the test user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.otherUserData = response;
				callback();
			}
		);
	}

	// have the registered user create a team
	createTeam (callback) {
		this.teamFactory.createRandomTeam(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				callback();
			},
			{
				token: this.otherUserData.accessToken
			}
		);
	}

	// have the registered user invite another user to the team,
	// use this user's email for the login test
	inviteUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					email: this.userFactory.randomEmail(),
					teamId: this.team._id
				},
				token: this.otherUserData.accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.data = {
					email: response.user.email,
					password: RandomString.generate(8)
				};
				callback();
			}
		);
	}
}

module.exports = NoPasswordTest;
