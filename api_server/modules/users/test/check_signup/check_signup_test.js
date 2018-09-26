'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const UUID = require('uuid/v4');
const Assert = require('assert');
const UserTestConstants = require('../user_test_constants');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');

class CheckSignupTest extends CodeStreamAPITest {

	get description () {
		return 'should return login data and an access token when a user has been issued a signup token and signed up with it';
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/no-auth/check-signup';
	}

	getExpectedFields () {
		return UserTestConstants.EXPECTED_LOGIN_RESPONSE;
	}

	// before the test runs...
	before (callback) {
		this.beforeLogin = Date.now();
		BoundAsync.series(this, [
			this.registerUser,  // create an unregistered user with a random signup token
			this.confirmUser,   // confirm the user
			this.createTeam,    // create a team for the user to be on, this is required before the signup token can be used
			this.wait
		], callback);
	}

	// register (but don't confirm) a user, 
	registerUser (callback) {
		this.signupToken = UUID();
		const userData = this.userFactory.getRandomUserData();
		userData.wantLink = true;   // we'll get back a confirmation link 
		userData._confirmationCheat = SecretsConfig.confirmationCheat;  // cheat code to get back the confirmation link 
		userData.signupToken = this.signupToken;
		userData.expiresIn = this.expiresIn;
		this.data = { token: this.signupToken };
		this.userFactory.registerUser(
			userData,
			(error, response) => {
				if (error) { return callback(error); }
				this.userData = response;
				callback();
			}
		);
	}
    
	// confirm the user we registered, using a random signup token, this simulates what happens
	// when the IDE generates a signup token and passes it on to the web client for signup and the
	// user goes through the signup process
	confirmUser (callback) {
		if (this.dontConfirm) { return callback(); }
		const data = {
			token: this.userData.user.confirmationToken
		};
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/confirm',
				data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.accessToken = response.accessToken;
				callback();
			}
		);
	}

	// create a random team for the user to be on, this is required for proper use of the signup token
	createTeam (callback) {
		if (this.dontCreateTeam) { return callback(); }
		this.teamFactory.createRandomTeam(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				callback();
			},
			{ token: this.accessToken }
		);
	}

	// wait a few seconds to make sure the signup token is saved
	wait (callback) {
		setTimeout(callback, 2000);
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate we get back the expected user, an access token, and a pubnub subscription key
		Assert(data.user.email === this.userData.user.email, 'email doesn\'t match');
		Assert(data.user.lastLogin > this.beforeLogin, 'lastLogin not set to most recent login time');
		Assert(data.accessToken, 'no access token');
		Assert(data.pubnubKey, 'no pubnub key');
		Assert(data.pubnubToken, 'no pubnub token');
		Assert(data.teams.length === 1, 'no team in response');
		this.validateMatchingObject(this.team._id, data.teams[0], 'team');
		this.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES_FOR_ME);
	}
}

module.exports = CheckSignupTest;
