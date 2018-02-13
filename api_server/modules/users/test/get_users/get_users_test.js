// provide a base class to use for testing the "GET /users" request

'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const UserTestConstants = require('../user_test_constants');

class GetUsersTest extends CodeStreamAPITest {

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create a second registered user
			this.createRandomRepo,	// create a repo (and team) to use for the test
			this.setPath			// set the path to use when issuing the test request
		], callback);
	}

	// create a second registered user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a repo (and team) to use for the test
	createRandomRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.users = response.users;
				callback();
			},
			{
				withRandomEmails: 5,	// add some additional users, created on the fly
				withEmails: [this.currentUser.email],	// add the "current" user to the team
				token: this.mine ? this.token : this.otherUserData.accessToken	// current user or other user creates the repo/team, as needed
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate we got back the users expected, and ensure no attributes that shouldn't be seen by clients
		this.validateMatchingObjects(this.myUsers, data.users, 'users');
		this.validateSanitizedObjects(data.users, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetUsersTest;
