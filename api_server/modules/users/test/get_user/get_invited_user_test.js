'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const UserTestConstants = require('../user_test_constants');

class GetInvitedUserTest extends CodeStreamAPITest {

	get description () {
		return 'should return user when requesting someone else who is on one of my teams (from a repo i created)';
	}

	getExpectedFields () {
		return { user: UserTestConstants.EXPECTED_UNREGISTERED_USER_FIELDS };
	}

	// before the test runs...
	before (callback) {
		// create a repo (which creates a team), include a random user on the team,
		// we'll then try to fetch that user
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUser = response.users[0];	// we should be able to fetch this user
				this.path = '/users/' + this.otherUser._id;
				callback();
			},
			{
				withRandomEmails: 2,	// create a couple users on the fly
				token: this.token		// current user creates the repo and team
			}
		);
	}

	// validate the response to the test request...
	validateResponse (data) {
		// validate we got back the expected user, and make sure there aren't any attributes a client shouldn't see
		this.validateMatchingObject(this.otherUser._id, data.user, 'user');
		this.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetInvitedUserTest;
