// base class for many tests of the "PUT /check-signup" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const UUID = require('uuid/v4');

class CommonInit {

	// before the test runs...
	init (callback) {
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
		userData._confirmationCheat = this.apiConfig.sharedSecrets.confirmationCheat;  // cheat code to get back the confirmation link 
		userData._subscriptionCheat = this.apiConfig.sharedSecrets.subscriptionCheat;
		userData.signupToken = this.signupToken;
		userData.expiresIn = this.expiresIn;
		this.data = { token: this.signupToken };
		this.userFactory.registerUser(
			userData,
			(error, response) => {
				if (error) { return callback(error); }
				this.currentUser = response;
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
			token: this.currentUser.user.confirmationToken
		};
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/confirm',
				data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.currentUser = response;
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
			{ token: this.currentUser.accessToken }
		);
	}

	// wait a few seconds to make sure the signup token is saved
	wait (callback) {
		const time = this.waitTime || (this.mockMode ? 200 : 2000);
		setTimeout(callback, time);
	}

}

module.exports = CommonInit;
