'use strict';

var GetRepoTest = require('./get_repo_test');

class GetMyRepoTest extends GetRepoTest {

	get description () {
		return 'should return a valid repo when requesting a repo created by me';
	}

	setPath (callback) {
		this.path = '/repos/' + this.myRepo._id;
		callback();
	}

	validateResponse (data) {
		this.validateMatchingObject(this.myRepo._id, data.repo, 'repo');
		super.validateResponse(data);
	}
}

module.exports = GetMyRepoTest;
