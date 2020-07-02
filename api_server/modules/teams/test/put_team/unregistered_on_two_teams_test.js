'use strict';

const RemoveUsersTest = require('./remove_users_test');
const RandomString = require('randomstring');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
//const Assert = require('assert');

class UnregisteredOnTwoTeamsTest extends RemoveUsersTest {

	get description () {
		return 'an unregistered user who is uninvited from their last team should not be deactivated if they are on another team';
	}

	// before the test runs...
	init (callback) {
		BoundAsync.series(this, [
			super.init,				// standard setup creates a team and other registered users
			this.createOtherTeam,	// create another team to invite an unregistered user to
			this.inviteToOtherTeam	// invite the user to the other team
		], callback);
	}

	// create another team to invite the unregistered user to
	createOtherTeam (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/teams',
				data: {
					name: RandomString.generate(10)
				},
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.otherTeam = response.team;
				callback();
			}
		);
	}

	// invite the user to the other team
	inviteToOtherTeam (callback) {
		this.unregisteredUserOnOtherTeam = this.users.find(user => !user.user.isRegistered).user;
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					email: this.unregisteredUserOnOtherTeam.email,
					teamId: this.otherTeam.id
				},
				token: this.token
			},
			callback
		);
	}

	// run the actual test...
	run (callback) {
		super.run(callback);
/*
		// in running the test, we'll take the unregistered user who was removed from a team (their last team),
		// and go through a normal sign-up flow ... this should work without a hitch
		BoundAsync.series(this, [
			this.registerUser,
			this.confirmUser,
			this.login
		], callback);
	*/
	}

}

module.exports = UnregisteredOnTwoTeamsTest;
