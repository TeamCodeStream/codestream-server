'use strict';

var GetRepoTest = require('./get_repo_test');

class GetOtherRepoTest extends GetRepoTest {

	get description () {
		return 'should return a valid repo when requesting a repo created by another user on a team that i am on';
	}

	setPath (callback) {
		this.path = '/repos/' + this.otherRepo._id;
		callback();
	}

	validateResponse (data) {
		this.validateMatchingObject(this.otherRepo._id, data.repo, 'repo');
		super.validateResponse(data);
	}
}

module.exports = GetOtherRepoTest;
