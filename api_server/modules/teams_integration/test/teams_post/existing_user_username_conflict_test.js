'use strict';

var UserAddedTest = require('./user_added_test');

class ExistingUserUsernameConflictTest extends UserAddedTest {

	get description () {
		return 'should return an error when trying to send a teams post request from a known user who is not on the team that owns the stream and whose username conflicts with an existing user on that team';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1000',
		};
	}

	// create a user who will simulate being the originator of the teams post,
	// override the base class to give this user the same username as the user
	// who is creating the team for the test ... when this user posts from teams,
	// it should fail as they are added to the team because of the username conflict
	createPostOriginator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.postOriginatorData = response;
				callback();
			},
			{
				username: this.currentUser.username
			}
		);
	}
}

module.exports = ExistingUserUsernameConflictTest;
