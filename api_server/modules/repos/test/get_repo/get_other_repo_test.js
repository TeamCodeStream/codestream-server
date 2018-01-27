'use strict';

var GetRepoTest = require('./get_repo_test');

class GetOtherRepoTest extends GetRepoTest {

	get description () {
		return 'should return a valid repo when requesting a repo created by another user on a team that i am on';
	}

	// set the path for the test request
	setPath (callback) {
		// fetch the other repo (created by a different user), i was put on the team so i should be able to fetch it
		this.path = '/repos/' + this.otherRepo._id;
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		// make sure we got the expected repo
		this.validateMatchingObject(this.otherRepo._id, data.repo, 'repo');
		super.validateResponse(data);
	}
}

module.exports = GetOtherRepoTest;
