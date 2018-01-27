'use strict';

var GetRepoTest = require('./get_repo_test');

class GetMyRepoTest extends GetRepoTest {

	get description () {
		return 'should return a valid repo when requesting a repo created by me';
	}

	// set the path for the test request
	setPath (callback) {
		// fetch the repo the current user created
		this.path = '/repos/' + this.myRepo._id;
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		// make sure we got the expected repo
		this.validateMatchingObject(this.myRepo._id, data.repo, 'repo');
		super.validateResponse(data);
	}
}

module.exports = GetMyRepoTest;
