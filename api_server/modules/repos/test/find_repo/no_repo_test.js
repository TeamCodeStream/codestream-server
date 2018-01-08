'use strict';

var FindRepoTest = require('./find_repo_test');
var Assert = require('assert');

class NoRepoTest extends FindRepoTest {

	get description () {
		return 'should return an empty structure when no matching repo is found';
	}

	getExpectedFields () {
		return null;
	}

	makePath (callback) {
		this.queryData.url = 'https://nothingwhatsoever.com';
		super.makePath(callback);
	}

	validateResponse (data) {
		Assert.deepEqual({}, data, 'data is not empty as expected');
	}
}

module.exports = NoRepoTest;
