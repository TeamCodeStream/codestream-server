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

	// make the path we'll use to run the test request, with pre-established query parameters
	makePath (callback) {
		// substitute a fake url 
		this.queryData.url = 'https://nothingwhatsoever.com';
		super.makePath(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.deepEqual({}, data, 'data is not empty as expected');
	}
}

module.exports = NoRepoTest;
