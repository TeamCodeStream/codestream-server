// base class for many tests of the "PUT /no-auth/slack-enable" request

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
//const Secrets = require(process.env.CS_API_TOP + '/config/secrets');

class CommonInit {

	get method () {
		return 'put';
	}

	// no authentication for the test request
	dontWantToken() {
		return true;
	}

	init (callback) {
		this.path = '/no-auth/slack-enable';
		BoundAsync.series(this, [
			this.createUser,		// create a user, this is not the user to make the test request (which requires no user)
			this.createRepo,		// create a repo (which creates a team)
			this.makeTestData		// make the data to use for the test
		], callback);
	}

	// create a user
	createUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.currentUserData = response;
				callback();
			}
		);
	}

	// create a repo and team to use for the test
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				callback();
			},
			{
				token: this.currentUserData.accessToken
			}
		);
	}

	// make the data to use for the test
	makeTestData (callback) {
		this.integrationInfo = {
			somthing: 'here',
			number: 1
		};
		this.data = {
//			secret: Secrets.integration,
			teamId: this.team._id,
			enable: true,
			info: this.integrationInfo
		};
		callback();
	}
}

module.exports = CommonInit;
