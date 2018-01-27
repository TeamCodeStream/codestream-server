'use strict';

var FindRepoTest = require('./find_repo_test');

class NoAttributeTest extends FindRepoTest {

	get description () {
		return `should return error when attempting to find a repo with no ${this.attribute} supplied`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	// make the path we'll use to run the test request, with pre-established query parameters
	makePath (callback) {
		// remove the attribute from query parameters before really making the path
		delete this.queryData[this.attribute];
		super.makePath(callback);
	}
}

module.exports = NoAttributeTest;
