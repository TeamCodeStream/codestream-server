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

	before (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUser = response.users[0];
				this.path = '/users/' + this.otherUser._id;
				callback();
			},
			{
				withRandomEmails: 2,
				token: this.token
			}
		);
	}

	validateResponse (data) {
		this.validateMatchingObject(this.otherUser._id, data.user, 'user');
		this.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetInvitedUserTest;
