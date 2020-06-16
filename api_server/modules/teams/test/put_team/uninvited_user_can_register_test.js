'use strict';

const PutTeamTest = require('./put_team_test');
const RandomString = require('randomstring');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class UninvitedUserCanRegisterTest extends PutTeamTest {

	get description () {
		return 'an unregistered user who is uninvited from their last team should still be able to sign up fresh';
	}

	// before the test runs...
	init (callback) {
		BoundAsync.series(this, [
			super.init,         // standard setup creates a team and other registered users
			this.removeUser     // remove the current user from the team (uninvite them)
		], callback);
	}

	// remove the current user from the team created
	removeUser (callback) {
		this.unregisteredUser = this.users.find(user => !user.user.isRegistered);
		this.doApiRequest(
			{
				method: 'put',
				path: '/teams/' + this.team.id,
				data: {
					$addToSet: {
						removedMemberIds: this.unregisteredUser.user.id
					}
				},
				token: this.users[1].accessToken
			},
			callback
		);
	}

	// run the actual test...
	run (callback) {
		// in running the test, we'll take the unregistered user who was removed from a team (their last team),
		// and go through a normal sign-up flow ... this should work without a hitch
		BoundAsync.series(this, [
			this.registerUser,
			this.confirmUser,
			this.login
		], callback);
	}

	// re-register the user we already created, as if they are signing up fresh 
	// for the first time
	registerUser (callback) {
		this.data = {
			email: this.unregisteredUser.user.email,
			username: RandomString.generate(8),
			password: RandomString.generate(8),
			_confirmationCheat: this.apiConfig.secrets.confirmationCheat
		};
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/register',
				data: this.data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.registerResponse = response;
				Assert.equal(response.user.id, this.unregisteredUser.user.id, 'user ID does not match after re-register');
				Assert.equal(response.user.username, this.data.username, 'username does not match the user given on re-register');
				callback();
			}
		);
	}

	// confirm the user, which should go off without a hitch
	confirmUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/confirm',
				data: {
					email: this.unregisteredUser.user.email,
					confirmationCode: this.registerResponse.user.confirmationCode
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.confirmResponse = response;
				Assert.equal(response.user.id, this.unregisteredUser.user.id, 'user ID does not match after confirm');
				callback();
			}
		);
	}

	// log the user in using the provided password
	login (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/login',
				data: {
					email: this.unregisteredUser.user.email,
					password: this.data.password
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert.equal(response.user.id, this.unregisteredUser.user.id, 'user ID does not match after login');
				Assert.equal(response.accessToken, this.confirmResponse.accessToken, 'access token does not match after login');
				callback();
			}
		);
	}
}

module.exports = UninvitedUserCanRegisterTest;
