'use strict';

const GetRepoTest = require('./get_repo_test');
const ObjectId = require('mongodb').ObjectId;

class NotFoundTest extends GetRepoTest {

	get description () {
		return 'should return an error when trying to fetch a repo that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	// before the test runs...
	before (callback) {
		super.before (error => {
			// substitute a non-existent repo ID
			if (error) { return callback(error); }
			this.path = '/repos/' + ObjectId();
			callback();
		});
	}
}

module.exports = NotFoundTest;
