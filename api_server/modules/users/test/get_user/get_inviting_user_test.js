'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const UserTestConstants = require('../user_test_constants');

class GetInvitingUserTest extends CodeStreamAPITest {

	get description () {
		return 'should return user when requesting someone else who is on one of my teams (from a repo they created)';
	}

	getExpectedFields () {
		return UserTestConstants.EXPECTED_USER_RESPONSE;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create a second registered user
			this.createRandomRepo	// have the other user create a repo and team
		], callback);
	}

	// create a second registered user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				// this is the user we'll try to fetch
				this.path = '/users/' + this.otherUserData.user._id;
				callback();
			}
		);
	}

	// create a repo, which creates a team, with both the current user and the team creator ...
	// the current user should then be able to fetch the team creator
	createRandomRepo (callback) {
		this.repoFactory.createRandomRepo(
			callback,
			{
				withRandomEmails: 2,	// add a few other users for good measure
				withEmails: [this.currentUser.email],	// make sure current user is on the team
				token: this.otherUserData.accessToken	// "other" user creates the team
			}
		);
	}

	// validate the response to the test request...
	validateResponse (data) {
		// validate we got back the expected user, and make sure there aren't any attributes a client shouldn't see
		this.validateMatchingObject(this.otherUserData.user._id, data.user, 'user');
		this.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetInvitingUserTest;
