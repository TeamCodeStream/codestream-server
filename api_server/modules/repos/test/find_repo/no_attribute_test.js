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

	makePath (callback) {
		delete this.queryData[this.attribute];
		super.makePath(callback);
	}
}

module.exports = NoAttributeTest;
