'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const UserTestConstants = require('../user_test_constants');

class GetTeamMember extends CodeStreamAPITest {

	get description () {
		return 'should return user when requesting someone else who is on one of my teams (from a repo created by a third user)';
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
				callback();
			}
		);
	}

	// create a repo, which creates a team, with both the current user and the team creator, 
	// as well as a couple of other users created on the fly ... the current user should then
	// be able to fetch one of the created users, since they are on the same team
	createRandomRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUser = response.users[0];
				this.path = '/users/' + this.otherUser._id;
				callback();
			},
			{
				withRandomEmails: 2,	// create a few on-the-fly users
				withEmails: [this.currentUser.email],	// include the current user
				token: this.otherUserData.accessToken	// "other" user creates the repo and team
			}
		);
	}

	// validate the response to the request test
	validateResponse (data) {
		// validate we got back the expected user, and make sure there aren't any attributes a client shouldn't see
		this.validateMatchingObject(this.otherUser._id, data.user, 'user');
		this.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetTeamMember;
