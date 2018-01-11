'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class ACLTest extends CodeStreamAPITest {

	get description () {
		return 'should return an error when trying to fetch users from a team i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createOtherRepo
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

	createOtherRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.path = '/users?teamId=' + response.team._id;
				callback();
			},
			{
				withRandomEmails: 2,
				token: this.otherUserData.accessToken
			}
		);
	}
}

module.exports = ACLTest;
