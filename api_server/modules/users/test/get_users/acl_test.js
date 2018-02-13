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

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create a second registered user
			this.createOtherRepo	// have the other user create a repo and team, and the current is not included
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

	// have the other user create a repo and team, with the current user not included,
	// the current user should not be able to fetch users for the team
	createOtherRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.path = '/users?teamId=' + response.team._id;
				callback();
			},
			{
				withRandomEmails: 2,	// add a couple more users for good measure
				token: this.otherUserData.accessToken	// the "other" user creates the repo and team
			}
		);
	}
}

module.exports = ACLTest;
