'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const UserTestConstants = require('../user_test_constants');

class GetUsersTest extends CodeStreamAPITest {

	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createRandomRepo,
			this.setPath
		], callback);
	}

	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	createRandomRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.users = response.users;
				callback();
			},
			{
				withRandomEmails: 5,
				withEmails: [this.currentUser.email],
				token: this.mine ? this.token : this.otherUserData.accessToken
			}
		);
	}

	validateResponse (data) {
		this.validateMatchingObjects(this.myUsers, data.users, 'users');
		this.validateSanitizedObjects(data.users, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetUsersTest;
