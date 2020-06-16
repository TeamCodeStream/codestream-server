'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const UserTestConstants = require('../user_test_constants');

class GetInvitingUserTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		Object.assign(this.teamOptions, {
			creatorIndex: 1,
			numAdditionalInvites: 1
		});
	}
	get description () {
		return 'should return user when requesting someone else who is on one of my teams (from a team they created)';
	}

	getExpectedFields () {
		return UserTestConstants.EXPECTED_USER_RESPONSE;
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.otherUser = this.users[1].user;
			this.path = '/users/' + this.otherUser.id;
			callback();
		});
	}

	// validate the response to the test request...
	validateResponse (data) {
		// validate we got back the expected user, and make sure there aren't any attributes a client shouldn't see
		this.validateMatchingObject(this.otherUser.id, data.user, 'user');
		this.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetInvitingUserTest;
