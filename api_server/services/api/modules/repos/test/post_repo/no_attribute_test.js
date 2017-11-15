'use strict';

var PostRepoTest = require('./post_repo_test');

class NoAttributeTest extends PostRepoTest {

	get description () {
		return `should return error when attempting to create a repo with no ${this.attribute}`;
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1002',
			info: this.attribute
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = NoAttributeTest;
