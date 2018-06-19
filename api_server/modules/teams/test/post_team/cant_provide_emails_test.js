'use strict';

const PostTeamTest = require('./post_team_test');
const Assert = require('assert');

class CantProvideEmailsTest extends PostTeamTest {

	get description () {
		return 'should NOT add users to the team when provided by emails (this is only supported through POST /repos)';
	}

	// before the test runs...
	before (callback) {
		// run the standard test set up for creating a team, but...
		super.before(error => {
			if (error) { return callback(error); }
			// ...add a random email
			const email = this.userFactory.randomEmail();
			this.data.emails = [email];
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// make sure we don't see any users in the returned response, we'll assume
		// this means no users were created
		Assert.ifError(data.users, 'data.users should not be returned');
		super.validateResponse(data);
	}
}

module.exports = CantProvideEmailsTest;
