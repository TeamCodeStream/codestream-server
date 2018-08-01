'use strict';

const PutTeamTest = require('./put_team_test');
const RandomString = require('randomstring');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class UninvitedUserCanRegisterTest extends PutTeamTest {

	get description () {
		return 'an unregistered user who is uninvited from their last team should still be able to sign up fresh';
	}

	// before the test runs...
	init (callback) {
		BoundAsync.series(this, [
			this.registerUser,  // register a user (but don't confirm, creating an "unregistered" user)
			super.init,         // standard setup creates a team and other registered users
			this.removeUser     // remove the current user from the team (uninvite them)
		], callback);
	}

	// run the actual test...
	run (callback) {
		// in running the test, we'll take the unregistered user who was removed from a team (their last team),
		// and go through a normal sign-up flow ... this should work without a hitch
		BoundAsync.series(this, [
			this.registerCurrentUser,
			this.confirmUser,
			this.login
		], callback);
	}

	// indicate we don't want a registered user
	dontWantToken () {
		return true;
	}

	// register a user but don't confirm, creating an "unregistered" current user
	registerUser (callback) {
		this.userFactory.registerRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.currentUser = response.user;
				callback();
			}
		);
	}

	// remove the current user from the team created
	removeUser (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/teams/' + this.team._id,
				data: {
					$pull: {
						memberIds: this.currentUser._id
					}
				},
				token: this.otherUserData[0].accessToken
			},
			callback
		);
	}

	// re-register the user we already created, as if they are signing up fresh 
	// for the first time
	registerCurrentUser (callback) {
		this.data = {
			email: this.currentUser.email,
			username: RandomString.generate(8),
			password: RandomString.generate(8),
			_confirmationCheat: SecretsConfig.confirmationCheat
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
				Assert.equal(response.user._id, this.currentUser._id, 'user ID does not match after re-register');
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
					email: this.currentUser.email,
					confirmationCode: this.registerResponse.user.confirmationCode
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.confirmResponse = response;
				Assert.equal(response.user._id, this.currentUser._id, 'user ID does not match after confirm');
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
					email: this.currentUser.email,
					password: this.data.password
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert.equal(response.user._id, this.currentUser._id, 'user ID does not match after login');
				Assert.equal(response.accessToken, this.confirmResponse.accessToken, 'access token does not match after login');
				callback();
			}
		);
	}
}

module.exports = UninvitedUserCanRegisterTest;
